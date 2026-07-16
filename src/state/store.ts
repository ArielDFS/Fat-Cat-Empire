/**
 * Store Zustand — o estado do jogo e as ações que o mudam (GAME_DESIGN.md §9).
 *
 * Regra de ouro: a store pode importar `domain/` e `data/`, mas `domain/` NUNCA
 * importa a store. Toda a matemática vive em `domain/` (testada); aqui só orquestramos.
 */

import { create } from "zustand";
import { BUILDINGS } from "../data/buildings";
import type { Building } from "../data/buildings";
import { abilityPorId, abilitiesDoPredio, poolDe } from "../data/abilities";
import type { PassiveAbility, EfeitoPassiva } from "../data/abilities";
import { custoDeVariosGatos } from "../domain/cost";
import {
  habilidadeDesbloqueada,
  multiplicadorProducao,
  multiplicadorClique,
  bonusColheita,
} from "../domain/abilities";
import type { EfeitoProducao, EfeitoClique } from "../domain/abilities";
import { peixesPorClique } from "../domain/click";
import { producaoPorSegundo } from "../domain/production";
import type { PredioProdutor } from "../domain/production";
import { calcularGanhoOffline } from "../domain/offline";
import type { GanhoOffline } from "../domain/offline";
import { coroasGanhasNaRun } from "../domain/prestige";
import { SELO_IMPERIAL_MULT } from "../domain/constants";
import { eraDeObras, lumpDaEra } from "../domain/era";
import { ERAS, LUMP_SEGUNDOS, LUMP_PISO, eraPorNivel } from "../data/eras";
import type { Era } from "../data/eras";
import { carregarSave, gravarSave } from "./save";

/** gatos por prédio, tudo em zero. */
function gatosZerados(): Record<string, number> {
  const g: Record<string, number> = {};
  for (const b of BUILDINGS) g[b.id] = 0;
  return g;
}

/** Descarta ids de habilidade desconhecidos e duplicatas de um save (robusto a conteúdo antigo). */
function normalizarHabilidades(salvas: readonly string[]): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const id of salvas) {
    if (abilityPorId(id) && !vistas.has(id)) {
      vistas.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Reconcilia os gatos de um save com os prédios atuais: garante que todo prédio
 * conhecido exista (prédio novo começa em 0) e descarta ids desconhecidos e valores
 * inválidos. Deixa a store robusta a saves de versões anteriores do conteúdo.
 */
function normalizarGatos(salvos: Record<string, number>): Record<string, number> {
  const base = gatosZerados();
  for (const id of Object.keys(base)) {
    const v = salvos[id];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) base[id] = Math.floor(v);
  }
  return base;
}

/** Ponte data → domain: os efeitos das passivas compradas (opcionalmente filtradas por prédio). */
function efeitosComprados(
  habilidades: readonly string[],
  buildingId?: string,
): EfeitoPassiva[] {
  const out: EfeitoPassiva[] = [];
  for (const id of habilidades) {
    const a = abilityPorId(id);
    if (a && (buildingId === undefined || a.buildingId === buildingId)) out.push(a.efeito);
  }
  return out;
}

/**
 * Multiplicador de PRODUÇÃO de um prédio (P1 × P2, §3.7). Depende dos gatos porque o P2 escala
 * com o enxame. Passivas de clique daquele prédio são ignoradas aqui — elas vão pro clique global.
 */
function multProducaoDoPredio(
  buildingId: string,
  habilidades: readonly string[],
  qtdGatos: number,
): number {
  const producao = efeitosComprados(habilidades, buildingId).filter(
    (e): e is EfeitoProducao => poolDe(e) === "producao",
  );
  return multiplicadorProducao(producao, qtdGatos);
}

/** Efeitos de clique de TODAS as passivas compradas (o clique é global, ADR-0002). */
function efeitosCliqueGlobais(habilidades: readonly string[]): EfeitoClique[] {
  return efeitosComprados(habilidades).filter((e): e is EfeitoClique => poolDe(e) === "clique");
}

/**
 * Credita um ganho de peixes da run (produção do tick ou clique). Move o `peixes` **e** o `lifetime`.
 *
 * **Migração v0.6:** o `lifetime` virou pura **estatística de vitrine** (§4.6.9 ponto 6) — não dirige
 * mais Era nem prestígio. Por isso este caminho não tem mais nenhuma lógica de Era: a Era só avança
 * ao **construir uma Obra** (ver `comprarGatos`), nunca por produção/clique (nem offline).
 */
function creditarGanho(s: GameState, ganho: number): Partial<GameState> {
  return { peixes: s.peixes + ganho, lifetime: s.lifetime + ganho };
}

/** Traduz o estado bruto para o formato que `domain/production` entende. */
function produtores(
  gatos: Record<string, number>,
  habilidades: readonly string[],
): PredioProdutor[] {
  return BUILDINGS.map((b) => ({
    prodPorGato: b.producaoPorGato,
    qtdGatos: gatos[b.id] ?? 0,
    habilidadesPassivasMult: multProducaoDoPredio(b.id, habilidades, gatos[b.id] ?? 0),
  }));
}

export interface GameState {
  peixes: number;
  /** Peixes já produzidos na run. **Vitrine only (§4.6.9):** exibido, dirige zero mecânicas. */
  lifetime: number;
  coroas: number;
  /**
   * Peixes GASTOS na run (gatos + passivas + Obras) — a base do prestígio na v0.6 (§6, ADR-0003).
   * `sqrt(gastos / DIVISOR)` = coroas. Zera na Nova Dinastia.
   */
  gastos: number;
  gatos: Record<string, number>;
  /** Ids das Habilidades passivas já compradas na run (§3.4). Reseta na Nova Dinastia. */
  habilidades: string[];
  /** Selo Imperial concedido? (§3.6) Habilidade global — produção ×1,5, permanente, sobrevive à Dinastia. */
  seloImperial: boolean;
  /** Quantas Nova Dinastias já foram fundadas (§6). Permanente — não se deriva das coroas (que crescem por valor). */
  dinastias: number;
  /** `Date.now()` do início da run atual (§6). Re-armado na Nova Dinastia; base da conquista §12 (passo 8). */
  runInicioTs: number;

  /** Ganho da última ausência, enquanto o modal de retorno está aberto (null = sem modal). */
  ganhoOffline: GanhoOffline | null;
  /** Era recém-cruzada ao vivo, enquanto a fanfarra toca (null = sem fanfarra). Não persiste. */
  eraFanfarra: Era | null;
  /** Já carregou o save nesta sessão? Evita reaplicar o offline (ex.: StrictMode em dev). */
  hidratado: boolean;

  /** Compra `quantidade` gatos de um prédio, se der pra pagar. */
  comprarGatos: (buildingId: string, quantidade: number) => void;
  /** Compra uma Habilidade passiva destravada por marco, se der pra pagar (§3.4). */
  comprarHabilidade: (abilityId: string) => void;
  /** Um clique manual no peixe grande. */
  clicar: () => void;
  /** Funda a Nova Dinastia (§6): credita coroas, concede o Selo na estreia, reseta a run. */
  novaDinastia: () => void;
  /** Avança a produção passiva por `dtSegundos` de tempo real. */
  tick: (dtSegundos: number) => void;
  /** Carrega o save (se houver) e credita a produção offline. Idempotente por sessão. */
  hidratar: () => void;
  /** Persiste o estado atual da run em LocalStorage. */
  salvar: () => void;
  /** Fecha o modal de retorno (os peixes já foram creditados na hidratação). */
  fecharModalOffline: () => void;
  /** Encerra a fanfarra de Era (o lump já foi creditado no cruzamento). */
  fecharFanfarra: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  peixes: 0,
  lifetime: 0,
  coroas: 0,
  gastos: 0,
  gatos: gatosZerados(),
  habilidades: [],
  seloImperial: false,
  dinastias: 0,
  runInicioTs: Date.now(),
  ganhoOffline: null,
  eraFanfarra: null,
  hidratado: false,

  comprarGatos: (buildingId, quantidade) => {
    if (quantidade <= 0) return;
    const s = get();
    const b = BUILDINGS.find((x) => x.id === buildingId);
    if (!b) return;
    if (!predioDesbloqueado(b, s.gatos)) return; // cadeia de compra: prédio ainda oculto (§4.6.9)
    const possui = s.gatos[buildingId] ?? 0;
    const custo = custoDeVariosGatos(b.custoBasePorGato, possui, quantidade);
    if (s.peixes < custo) return;

    const novosGatos = { ...s.gatos, [buildingId]: possui + quantidade };
    const patch: Partial<GameState> = {
      peixes: s.peixes - custo,
      gastos: s.gastos + custo, // gasto conta pro prestígio (§6, ADR-0003)
      gatos: novosGatos,
    };

    // Construir a Obra (a 1ª compra dela) VIRA a Era (§4.6.9): revela o 1º prédio da Era seguinte
    // via cadeia (automático), troca o mundo (Era derivada de gatos) e dispara fanfarra + lump.
    if (b.ehObra && possui === 0) {
      const novaEra = eraDeObras(obrasConstruidas(novosGatos));
      if (novaEra <= ERAS.length) {
        // A última Obra do slice "apontaria" para uma Era inexistente — aí não há virada a comemorar.
        patch.eraFanfarra = eraPorNivel(novaEra);
        patch.peixes = (patch.peixes as number) + lumpDaEra(prodPorSegundo(s), LUMP_SEGUNDOS, LUMP_PISO);
      }
    }
    set(patch);
  },

  comprarHabilidade: (abilityId) => {
    const s = get();
    const a = abilityPorId(abilityId);
    if (!a) return; // habilidade desconhecida
    if (s.habilidades.includes(abilityId)) return; // já comprada
    const b = BUILDINGS.find((x) => x.id === a.buildingId);
    if (!b || !predioDesbloqueado(b, s.gatos)) return; // cadeia de compra: prédio ainda oculto
    if (!habilidadeDesbloqueada(s.gatos[a.buildingId] ?? 0, a.marco)) return; // marco não atingido
    if (s.peixes < a.custo) return; // sem peixes
    set({
      peixes: s.peixes - a.custo,
      gastos: s.gastos + a.custo, // gasto conta pro prestígio (§6, ADR-0003)
      habilidades: [...s.habilidades, abilityId],
    });
  },

  clicar: () => {
    const s = get();
    const ganho = poderDeClique(s);
    set(creditarGanho(s, ganho));
  },

  novaDinastia: () => {
    const s = get();
    // A coroa escala pelos peixes GASTOS na run (§6, ADR-0003) — não mais pelo `lifetime`.
    const coroasGanhas = coroasGanhasNaRun(s.gastos);
    if (coroasGanhas < 1) return; // guarda: o botão só aparece com ≥1 coroa, mas a ação também protege

    // Reset: gatos zerados ⇒ a Era volta ao Beco e os prédios re-travam (ambos derivam de gatos).
    set({
      peixes: 0,
      lifetime: 0,
      gastos: 0,
      gatos: gatosZerados(),
      habilidades: [],
      coroas: s.coroas + coroasGanhas, // coroa persiste como contagem (§6)
      seloImperial: true, // concedido na 1ª Dinastia; idempotente depois (o ×1,5 nunca empilha)
      dinastias: s.dinastias + 1, // contagem permanente de fundações
      runInicioTs: Date.now(), // re-arma o relógio da run (§12)
      ganhoOffline: null,
      eraFanfarra: null,
    });
    // Persiste já: um reload logo após a fundação não deve ressuscitar a run antiga (§6).
    get().salvar();
  },

  tick: (dtSegundos) => {
    if (dtSegundos <= 0) return;
    const s = get();
    const ganho = prodPorSegundo(s) * dtSegundos;
    if (ganho <= 0) return;
    set(creditarGanho(s, ganho));
  },

  hidratar: () => {
    if (get().hidratado) return; // uma vez por sessão (StrictMode monta o efeito 2×)

    const save = carregarSave();
    if (!save) {
      set({ hidratado: true });
      return;
    }

    const base = {
      peixes: save.peixes,
      lifetime: save.lifetime,
      coroas: save.coroas,
      gastos: save.gastos,
      gatos: normalizarGatos(save.gatos),
      habilidades: normalizarHabilidades(save.habilidades),
      // O Selo entra no `base` porque o cálculo offline usa `prodPorSegundo(base)`, que já o inclui
      // no multiplicador global (§3.6: produção ×1,5 rende ausente, ao contrário da Passiva de Clique).
      seloImperial: save.seloImperial === true,
    };

    // A produção que alimenta o offline precisa ser a EFETIVA (com coroas já embutidas),
    // pois `domain/offline` não reaplica coroas. `prodPorSegundo` entrega exatamente isso.
    const ganho = calcularGanhoOffline(prodPorSegundo(base), Date.now() - save.ts);

    // Nada de Era na hidratação: a Era deriva de `gatos` (já carregado) — construir Obra é ato ao
    // vivo, nunca offline (§4.6.9). O offline só credita peixes+lifetime (vitrine), não gastos.
    set({
      ...base,
      peixes: base.peixes + ganho.peixes,
      lifetime: base.lifetime + ganho.peixes,
      dinastias: save.dinastias ?? 0,
      // Save antigo sem `runInicioTs` → carimba agora (a run já corria, mas não sabemos desde quando).
      runInicioTs: save.runInicioTs ?? Date.now(),
      ganhoOffline: ganho.peixes > 0 ? ganho : null,
      hidratado: true,
    });
  },

  salvar: () => {
    const s = get();
    gravarSave({
      peixes: s.peixes,
      lifetime: s.lifetime,
      coroas: s.coroas,
      gastos: s.gastos,
      gatos: s.gatos,
      habilidades: s.habilidades,
      seloImperial: s.seloImperial,
      dinastias: s.dinastias,
      runInicioTs: s.runInicioTs,
    });
  },

  fecharModalOffline: () => set({ ganhoOffline: null }),
  fecharFanfarra: () => set({ eraFanfarra: null }),
}));

// --- Seletores puros para a UI (evitam reimplementar a economia no componente) ---

/**
 * Cadeia de compra (§4.6.9): um prédio está desbloqueado quando o **anterior na escada** já tem ≥1
 * gato (comprar o 1º gato de um prédio revela o próximo). O 1º prédio (Caixa) está sempre revelado.
 *
 * Não precisa de flag persistido: `gatos` (já salvo) É o registro dos atos concretos que dirigem a
 * progressão (ADR-0003). Como não se vende gato, o desbloqueio nunca regride dentro da run. O gate
 * real é o **custo crescente** do 1º gato (auto-pacing), não um limiar de `lifetime`.
 */
export function predioDesbloqueado(b: Building, gatos: Record<string, number>): boolean {
  const idx = BUILDINGS.findIndex((x) => x.id === b.id);
  if (idx <= 0) return true; // 1º prédio (ou id desconhecido) sempre visível
  const anterior = BUILDINGS[idx - 1]!;
  return (gatos[anterior.id] ?? 0) >= 1;
}

/** Quantas Obras já foram construídas na run (têm ≥1 gato). A Era deriva disto (§4.6.9). */
export function obrasConstruidas(gatos: Record<string, number>): number {
  return BUILDINGS.filter((b) => b.ehObra && (gatos[b.id] ?? 0) >= 1).length;
}

/**
 * Nível da Era atual da run (§4.6.9): 1 (Beco) + nº de Obras construídas. Derivado de `gatos` — sem
 * estado separado. Pode exceder o total de Eras do slice ao construir a última Obra; `eraPorNivel`
 * clampa na exibição.
 */
export function eraAtual(gatos: Record<string, number>): number {
  return eraDeObras(obrasConstruidas(gatos));
}

type EstadoProducao = Pick<GameState, "gatos" | "coroas" | "habilidades" | "seloImperial">;

export function prodPorSegundo(s: EstadoProducao): number {
  // O Selo Imperial é a única Habilidade global do slice (§3.6): fator ×1,5 em `habilidades_globais`
  // (§3.7), multiplicativo por fora do colchete das coroas. `domain/production` recebe o fator opaco.
  const habilidadesGlobaisMult = s.seloImperial ? SELO_IMPERIAL_MULT : 1;
  return producaoPorSegundo(produtores(s.gatos, s.habilidades), s.coroas, habilidadesGlobaisMult);
}

export function poderDeClique(s: EstadoProducao): number {
  const clique = efeitosCliqueGlobais(s.habilidades);
  return peixesPorClique(prodPorSegundo(s), multiplicadorClique(clique), bonusColheita(clique));
}

export function custoDaCompra(
  gatos: Record<string, number>,
  buildingId: string,
  quantidade: number,
): number {
  const b = BUILDINGS.find((x) => x.id === buildingId);
  if (!b) return Number.POSITIVE_INFINITY;
  return custoDeVariosGatos(b.custoBasePorGato, gatos[buildingId] ?? 0, quantidade);
}

/**
 * Multiplicador de PRODUÇÃO atual de um prédio (badge da lane). Inclui o P2, que escala com os
 * gatos — por isso precisa da contagem. 1 = nenhuma passiva de produção comprada.
 */
export function multiplicadorProducaoDoPredio(
  habilidades: readonly string[],
  buildingId: string,
  qtdGatos: number,
): number {
  return multProducaoDoPredio(buildingId, habilidades, qtdGatos);
}

/** Uma habilidade passiva enriquecida com o estado dela na run, para a UI da loja. */
export interface HabilidadeUI extends PassiveAbility {
  /** Marco atingido (qtd de gatos >= marco) — a compra está aberta. */
  desbloqueada: boolean;
  /** Já foi comprada nesta run. */
  comprada: boolean;
}

/** Habilidades passivas de um prédio com desbloqueio/compra resolvidos (§3.4). */
export function habilidadesDoPredio(
  buildingId: string,
  gatos: Record<string, number>,
  habilidades: readonly string[],
): HabilidadeUI[] {
  const qtd = gatos[buildingId] ?? 0;
  return abilitiesDoPredio(buildingId).map((a) => ({
    ...a,
    desbloqueada: habilidadeDesbloqueada(qtd, a.marco),
    comprada: habilidades.includes(a.id),
  }));
}
