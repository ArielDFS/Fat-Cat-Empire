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
import { nivelDaEra, lumpDaEra } from "../domain/era";
import { LIMIARES, LUMP_SEGUNDOS, LUMP_PISO, eraPorNivel } from "../data/eras";
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
 * Aplica um ganho de peixes que TAMBÉM conta como `lifetime` (produção do tick ou clique) e
 * processa os cruzamentos de Era (§4.5). Devolve o patch para `set`.
 *
 * O ganho move o `lifetime`; se ele cruzar um ou mais limiares de Era, cada Era nova paga um
 * **lump** (§4.5) — creditado só em peixes, **não** no lifetime, para o presente não empurrar a
 * run pra próxima Era de graça (o lifetime continua sendo produção genuína). A fanfarra mostra a
 * Era mais alta alcançada. Sem cruzamento, só credita peixes e lifetime.
 *
 * Reusado pelo tick, pelo clique e pelo painel dev — é o único caminho de "ganho ao vivo".
 */
export function aplicarGanhoLifetime(s: GameState, ganho: number): Partial<GameState> {
  const lifetime = s.lifetime + ganho;
  const nivelNovo = nivelDaEra(lifetime, LIMIARES);
  if (nivelNovo <= s.eraMaisAlta) {
    return { peixes: s.peixes + ganho, lifetime };
  }
  // Cruzou uma ou mais Eras: paga o lump de cada (produção estável — não depende de peixes).
  const rate = prodPorSegundo(s);
  let peixes = s.peixes + ganho;
  for (let n = s.eraMaisAlta + 1; n <= nivelNovo; n++) {
    peixes += lumpDaEra(rate, LUMP_SEGUNDOS, LUMP_PISO);
  }
  return { peixes, lifetime, eraMaisAlta: nivelNovo, eraFanfarra: eraPorNivel(nivelNovo) };
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
  lifetime: number;
  coroas: number;
  gatos: Record<string, number>;
  /** Ids das Habilidades passivas já compradas na run (§3.4). Reseta na Nova Dinastia (futuro). */
  habilidades: string[];
  /** Era mais alta já atingida na run (§4.5). Persistida (inteiro) para não repagar o lump. */
  eraMaisAlta: number;

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
  gatos: gatosZerados(),
  habilidades: [],
  eraMaisAlta: 1,
  ganhoOffline: null,
  eraFanfarra: null,
  hidratado: false,

  comprarGatos: (buildingId, quantidade) => {
    if (quantidade <= 0) return;
    const s = get();
    const b = BUILDINGS.find((x) => x.id === buildingId);
    if (!b) return;
    if (!predioDesbloqueado(b, s.lifetime)) return; // não compra num prédio ainda oculto
    const possui = s.gatos[buildingId] ?? 0;
    const custo = custoDeVariosGatos(b.custoBasePorGato, possui, quantidade);
    if (s.peixes < custo) return;
    set({
      peixes: s.peixes - custo,
      gatos: { ...s.gatos, [buildingId]: possui + quantidade },
    });
  },

  comprarHabilidade: (abilityId) => {
    const s = get();
    const a = abilityPorId(abilityId);
    if (!a) return; // habilidade desconhecida
    if (s.habilidades.includes(abilityId)) return; // já comprada
    const b = BUILDINGS.find((x) => x.id === a.buildingId);
    if (!b || !predioDesbloqueado(b, s.lifetime)) return; // prédio ainda oculto
    if (!habilidadeDesbloqueada(s.gatos[a.buildingId] ?? 0, a.marco)) return; // marco não atingido
    if (s.peixes < a.custo) return; // sem peixes
    set({ peixes: s.peixes - a.custo, habilidades: [...s.habilidades, abilityId] });
  },

  clicar: () => {
    const s = get();
    const ganho = poderDeClique(s);
    set(aplicarGanhoLifetime(s, ganho));
  },

  tick: (dtSegundos) => {
    if (dtSegundos <= 0) return;
    const s = get();
    const ganho = prodPorSegundo(s) * dtSegundos;
    if (ganho <= 0) return;
    set(aplicarGanhoLifetime(s, ganho));
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
      gatos: normalizarGatos(save.gatos),
      habilidades: normalizarHabilidades(save.habilidades),
    };

    // A produção que alimenta o offline precisa ser a EFETIVA (com coroas já embutidas),
    // pois `domain/offline` não reaplica coroas. `prodPorSegundo` entrega exatamente isso.
    const ganho = calcularGanhoOffline(prodPorSegundo(base), Date.now() - save.ts);
    const lifetimeFinal = base.lifetime + ganho.peixes;

    // A Era é sincronizada em SILÊNCIO na hidratação: quem paga o lump é o cruzamento AO VIVO
    // (§4.5), não a hidratação. Saves antigos sem `eraMaisAlta` derivam do lifetime. Como o offline
    // pode ter cruzado Eras enquanto ausente, subimos a Era até o lifetime final — sem lump/fanfarra.
    const eraSalva =
      typeof save.eraMaisAlta === "number" && save.eraMaisAlta >= 1
        ? Math.floor(save.eraMaisAlta)
        : nivelDaEra(base.lifetime, LIMIARES);

    set({
      ...base,
      peixes: base.peixes + ganho.peixes,
      lifetime: lifetimeFinal,
      eraMaisAlta: Math.max(eraSalva, nivelDaEra(lifetimeFinal, LIMIARES)),
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
      gatos: s.gatos,
      habilidades: s.habilidades,
      eraMaisAlta: s.eraMaisAlta,
    });
  },

  fecharModalOffline: () => set({ ganhoOffline: null }),
  fecharFanfarra: () => set({ eraFanfarra: null }),
}));

// --- Seletores puros para a UI (evitam reimplementar a economia no componente) ---

/**
 * Um prédio está desbloqueado quando os peixes acumulados na run cruzaram seu limiar (§3.3).
 * Como `lifetime` só cresce dentro de uma run, "desbloqueado uma vez" é automático — não
 * precisa persistir um flag: se já passou do limiar, `lifetime >= desbloqueio` continua verdade.
 */
export function predioDesbloqueado(b: Building, lifetime: number): boolean {
  return lifetime >= b.desbloqueio;
}

type EstadoProducao = Pick<GameState, "gatos" | "coroas" | "habilidades">;

export function prodPorSegundo(s: EstadoProducao): number {
  return producaoPorSegundo(produtores(s.gatos, s.habilidades), s.coroas);
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
