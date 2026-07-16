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
import { HABILIDADES_ATIVAS, habilidadeAtivaPorId } from "../data/activeAbilities";
import { custoDeVariosGatos } from "../domain/cost";
import {
  habilidadeDesbloqueada,
  multiplicadorProducao,
  multiplicadorClique,
  bonusColheita,
} from "../domain/abilities";
import type { EfeitoProducao, EfeitoClique } from "../domain/abilities";
import { fatorDaCadenciaClique, peixesPorClique, proximaCadenciaClique } from "../domain/click";
import { estadoDaHabilidadeAtiva, multiplicadorCliqueAtivo } from "../domain/activeAbilities";
import { producaoPorSegundo } from "../domain/production";
import type { PredioProdutor } from "../domain/production";
import { calcularGanhoOffline } from "../domain/offline";
import type { GanhoOffline } from "../domain/offline";
import { coroasGanhasNaRun } from "../domain/prestige";
import { eraDeObras, lumpDaEra } from "../domain/era";
import { ERAS, LUMP_SEGUNDOS, LUMP_PISO, eraPorNivel } from "../data/eras";
import type { Era } from "../data/eras";
import {
  multiplicadoresLendarios,
  custoSubirNivel,
  custoRecrutar,
  custoReroll,
  sortearOferta,
} from "../domain/legendaries";
import type { EfeitoAtivo, MultsLendarios } from "../domain/legendaries";
import {
  LEGENDARIES,
  lendarioPorId,
  poolDisponivel,
  SELO_LENDARIO_ID,
  RECRUTAR_BASE,
  RECRUTAR_GROWTH,
  NIVEL_BASE,
  NIVEL_GROWTH,
  REROLL_BASE,
  REROLL_GROWTH,
  DRAFT_K,
} from "../data/legendaries";
import type { LendarioDef } from "../data/legendaries";
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

/** Descarta recargas desconhecidas ou inválidas de saves; a janela ativa nunca é restaurada offline. */
function normalizarRecargasAtivas(salvas: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, terminoMs] of Object.entries(salvas ?? {})) {
    if (habilidadeAtivaPorId(id) && typeof terminoMs === "number" && Number.isFinite(terminoMs) && terminoMs > 0) {
      out[id] = terminoMs;
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

/** Descarta ids de Lendário desconhecidos e níveis inválidos de um save. */
function normalizarLendarios(salvos: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(salvos ?? {})) {
    if (lendarioPorId(id) && typeof v === "number" && Number.isFinite(v) && v >= 1) {
      out[id] = Math.floor(v);
    }
  }
  return out;
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

/** Produto dos bursts ativos; sem janela em curso, cada Habilidade contribui ×1. */
function multiplicadorDasHabilidadesAtivas(
  efeitosAtivosAte: Record<string, number>,
  agoraMs: number,
): number {
  let mult = 1;
  for (const habilidade of HABILIDADES_ATIVAS) {
    mult *= multiplicadorCliqueAtivo(
      habilidade.multiplicadorClique,
      efeitosAtivosAte[habilidade.id],
      agoraMs,
    );
  }
  return mult;
}

// --- Ponte da Corte Lendária (data + estado → domain) ---

/** Efeitos ativos: cada Lendário recrutado (nível ≥ 1) achatado pro domain. */
function efeitosAtivos(lendarios: Record<string, number>): EfeitoAtivo[] {
  const out: EfeitoAtivo[] = [];
  for (const def of LEGENDARIES) {
    const nivel = lendarios[def.id] ?? 0;
    if (nivel > 0) out.push({ tipo: def.efeito.tipo, porNivel: def.efeito.porNivel, nivel });
  }
  return out;
}

/** Os multiplicadores globais que a Corte concede (produção/clique/offline/lump/custo). */
function multsDaCorte(lendarios: Record<string, number>): MultsLendarios {
  return multiplicadoresLendarios(efeitosAtivos(lendarios));
}

/** Nº de Lendários NÃO-grátis já recrutados (base do custo de recrutar; o Selo #0 não conta). */
function nRecrutados(lendarios: Record<string, number>): number {
  return LEGENDARIES.filter((l) => !l.gratis && (lendarios[l.id] ?? 0) > 0).length;
}

/** Sorteia uma nova oferta de draft do pool elegível (RNG real fica aqui, fora do domain). */
function gerarOferta(lendarios: Record<string, number>, eraMax: number): string[] {
  return sortearOferta(poolDisponivel(lendarios, eraMax), DRAFT_K, Math.random);
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
  /** Coroas Felinas — a moeda GASTÁVEL da Corte Lendária (§6, ADR-0004). Permanente. */
  coroas: number;
  /**
   * Peixes GASTOS na run (gatos + passivas + Obras) — a base do prestígio (§6). `cbrt(gastos/DIV)` =
   * coroas ganhas. Zera na Nova Dinastia.
   */
  gastos: number;
  gatos: Record<string, number>;
  /** Ids das Habilidades passivas já compradas na run (§3.4). Reseta na Nova Dinastia. */
  habilidades: string[];
  /** Fim da janela de burst por Habilidade ativa. É efêmero: nunca volta após ficar offline. */
  efeitosAtivosAte: Record<string, number>;
  /** Fim da recarga por Habilidade ativa. Persiste para recarregar sem exploração por reload. */
  recargasAtivasAte: Record<string, number>;
  /** Relógio de apresentação das janelas; o loop o atualiza sem conduzir economia. */
  agoraMs: number;
  /** Nível do balde de cadência; efêmero, usado só para retorno decrescente (§3.5). */
  cadenciaClique: number;
  /** Instante do último clique; com a cadência forma um balde vazante contínuo. */
  ultimoCliqueMs: number | null;
  /** Gatos Lendários recrutados → nível (§4.6.7, ADR-0004). Permanente. O Selo Imperial é o #0. */
  lendarios: Record<string, number>;
  /** Oferta atual do draft (ids sorteados do pool). Persiste pra não sumir ao recarregar. */
  ofertaDraft: string[];
  /** Rerolls feitos desde o último recrutamento (custo de reroll sobe; zera ao recrutar). */
  rerollsFeitos: number;
  /** Era mais alta já atingida em QUALQUER run (permanente) — destrava tiers do pool de Lendários. */
  eraMaxAtingida: number;
  /** Quantas Nova Dinastias já foram fundadas (§6). Permanente. */
  dinastias: number;
  /** `Date.now()` do início da run atual (§6). Re-armado na Nova Dinastia; base da conquista §12. */
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
  /** Recruta um Lendário da oferta de draft, gastando Coroas (§4.6.7). */
  recrutarLendario: (id: string) => void;
  /** Paga Coroas pra sortear uma nova oferta de draft (§4.6.7). */
  rerollOferta: () => void;
  /** Sobe o nível de um Lendário recrutado, gastando Coroas (§4.6.7). */
  subirNivelLendario: (id: string) => void;
  /** Um clique manual no peixe grande. */
  clicar: (agoraMs?: number) => number;
  /** Dispara uma Habilidade ativa disponível no Prédio anfitrião. */
  ativarHabilidadeAtiva: (id: string, agoraMs?: number) => void;
  /** Funda a Nova Dinastia (§6): credita coroas, concede o Selo (Lendário #0) na estreia, reseta a run. */
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
  efeitosAtivosAte: {},
  recargasAtivasAte: {},
  agoraMs: Date.now(),
  cadenciaClique: 0,
  ultimoCliqueMs: null,
  lendarios: {},
  ofertaDraft: [],
  rerollsFeitos: 0,
  eraMaxAtingida: 1,
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
    const custo = custoComReducao(b.custoBasePorGato, possui, quantidade, s.lendarios);
    if (s.peixes < custo) return;

    const novosGatos = { ...s.gatos, [buildingId]: possui + quantidade };
    const patch: Partial<GameState> = {
      peixes: s.peixes - custo,
      gastos: s.gastos + custo, // gasto conta pro prestígio (§6)
      gatos: novosGatos,
    };

    // Construir a Obra (a 1ª compra dela) VIRA a Era (§4.6.9): revela o 1º prédio da Era seguinte
    // via cadeia, troca o mundo (Era derivada de gatos) e dispara fanfarra + lump.
    if (b.ehObra && possui === 0) {
      const novaEra = eraDeObras(obrasConstruidas(novosGatos));
      if (novaEra <= ERAS.length) {
        // A última Obra do slice "apontaria" para uma Era inexistente — aí não há virada a comemorar.
        patch.eraFanfarra = eraPorNivel(novaEra);
        const lump = lumpDaEra(prodPorSegundo(s), LUMP_SEGUNDOS, LUMP_PISO) * multsDaCorte(s.lendarios).lump;
        patch.peixes = (patch.peixes as number) + lump;
      }
      // Desbloqueio de tier de Lendário é PERMANENTE: registra a Era mais alta já tocada.
      if (novaEra > s.eraMaxAtingida) patch.eraMaxAtingida = novaEra;
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
      gastos: s.gastos + a.custo, // gasto conta pro prestígio (§6)
      habilidades: [...s.habilidades, abilityId],
    });
  },

  recrutarLendario: (id) => {
    const s = get();
    if (!s.ofertaDraft.includes(id)) return; // só recruta do que está ofertado
    const def = lendarioPorId(id);
    if (!def || (s.lendarios[id] ?? 0) > 0) return; // desconhecido ou já recrutado
    const custo = custoRecrutar(nRecrutados(s.lendarios), RECRUTAR_BASE, RECRUTAR_GROWTH);
    if (s.coroas < custo) return;
    const lendarios = { ...s.lendarios, [id]: 1 };
    set({
      coroas: s.coroas - custo,
      lendarios,
      ofertaDraft: gerarOferta(lendarios, s.eraMaxAtingida), // nova oferta do pool restante
      rerollsFeitos: 0, // recrutar zera o custo de reroll
    });
  },

  rerollOferta: () => {
    const s = get();
    if (poolDisponivel(s.lendarios, s.eraMaxAtingida).length === 0) return; // nada pra rerolar
    const custo = custoReroll(s.rerollsFeitos, REROLL_BASE, REROLL_GROWTH);
    if (s.coroas < custo) return;
    set({
      coroas: s.coroas - custo,
      ofertaDraft: gerarOferta(s.lendarios, s.eraMaxAtingida),
      rerollsFeitos: s.rerollsFeitos + 1,
    });
  },

  subirNivelLendario: (id) => {
    const s = get();
    const nivel = s.lendarios[id] ?? 0;
    if (nivel < 1) return; // precisa estar recrutado
    const custo = custoSubirNivel(nivel, NIVEL_BASE, NIVEL_GROWTH);
    if (s.coroas < custo) return;
    set({ coroas: s.coroas - custo, lendarios: { ...s.lendarios, [id]: nivel + 1 } });
  },

  clicar: (agoraMs = Date.now()) => {
    const s = get();
    const msDesdeUltimoClique = s.ultimoCliqueMs === null ? 0 : agoraMs - s.ultimoCliqueMs;
    const cadenciaClique = proximaCadenciaClique(s.cadenciaClique, msDesdeUltimoClique);
    const ganho = poderDeClique({ ...s, agoraMs }) * fatorDaCadenciaClique(cadenciaClique);
    set({ ...creditarGanho(s, ganho), agoraMs, cadenciaClique, ultimoCliqueMs: agoraMs });
    return ganho;
  },

  ativarHabilidadeAtiva: (id, agoraMs = Date.now()) => {
    const s = get();
    const habilidade = habilidadeAtivaPorId(id);
    if (!habilidade) return;
    if ((s.gatos[habilidade.buildingId] ?? 0) < 1) return; // o anfitrião precisa existir na run
    if (
      estadoDaHabilidadeAtiva(
        s.efeitosAtivosAte[id],
        s.recargasAtivasAte[id],
        agoraMs,
      ) !== "disponivel"
    ) {
      return;
    }

    set({
      efeitosAtivosAte: { ...s.efeitosAtivosAte, [id]: agoraMs + habilidade.duracaoMs },
      recargasAtivasAte: { ...s.recargasAtivasAte, [id]: agoraMs + habilidade.recargaMs },
      agoraMs,
    });
  },

  novaDinastia: () => {
    const s = get();
    // A coroa escala pelos peixes GASTOS na run (§6, cbrt) — vira moeda gastável (ADR-0004).
    const coroasGanhas = coroasGanhasNaRun(s.gastos);
    if (coroasGanhas < 1) return; // guarda: o botão só aparece com ≥1 coroa, mas a ação também protege

    // Selo Imperial = Lendário #0: concedido (nível 1) na 1ª Dinastia; idempotente depois.
    const lendarios = { ...s.lendarios };
    if ((lendarios[SELO_LENDARIO_ID] ?? 0) < 1) lendarios[SELO_LENDARIO_ID] = 1;

    // Reset da RUN: gatos zerados ⇒ a Era volta ao Beco e os prédios re-travam (derivam de gatos).
    // Permanentes: coroas, lendarios, eraMaxAtingida, dinastias.
    set({
      peixes: 0,
      lifetime: 0,
      gastos: 0,
      gatos: gatosZerados(),
      habilidades: [],
      efeitosAtivosAte: {},
      recargasAtivasAte: {},
      cadenciaClique: 0,
      ultimoCliqueMs: null,
      coroas: s.coroas + coroasGanhas,
      lendarios,
      dinastias: s.dinastias + 1,
      runInicioTs: Date.now(),
      ofertaDraft: gerarOferta(lendarios, s.eraMaxAtingida),
      rerollsFeitos: 0,
      ganhoOffline: null,
      eraFanfarra: null,
    });
    // Persiste já: um reload logo após a fundação não deve ressuscitar a run antiga (§6).
    get().salvar();
  },

  tick: (dtSegundos) => {
    if (dtSegundos <= 0) return;
    const s = get();
    const agoraMs = Date.now();
    const ganho = prodPorSegundo(s) * dtSegundos;
    if (ganho <= 0) {
      set({ agoraMs });
      return;
    }
    set({ ...creditarGanho(s, ganho), agoraMs });
  },

  hidratar: () => {
    if (get().hidratado) return; // uma vez por sessão (StrictMode monta o efeito 2×)

    const save = carregarSave();
    if (!save) {
      set({ hidratado: true });
      return;
    }

    const lendarios = normalizarLendarios(save.lendarios);
    const eraMaxAtingida =
      typeof save.eraMaxAtingida === "number" && save.eraMaxAtingida >= 1
        ? Math.floor(save.eraMaxAtingida)
        : 1;

    const base = {
      peixes: save.peixes,
      lifetime: save.lifetime,
      coroas: save.coroas,
      gastos: save.gastos,
      gatos: normalizarGatos(save.gatos),
      habilidades: normalizarHabilidades(save.habilidades),
      recargasAtivasAte: normalizarRecargasAtivas(save.recargasAtivasAte),
      // Os Lendários entram no `base` porque o offline usa `prodPorSegundo(base)`, que aplica o
      // multiplicador de produção da Corte (o Selo #0 rende ausente, como qualquer produção).
      lendarios,
    };

    // Produção EFETIVA (com o mult dos Lendários embutido). O ganho offline ainda ganha o mult de
    // offline da Corte (ex.: Gato de Schrödinger) por fora.
    const rate = prodPorSegundo(base);
    const ganho = calcularGanhoOffline(rate, Date.now() - save.ts);
    const ganhoPeixes = ganho.peixes * multsDaCorte(lendarios).offline;
    const ganhoFinal = ganho.peixes > 0 ? { ...ganho, peixes: ganhoPeixes } : ganho;

    // Nada de Era na hidratação: a Era deriva de `gatos` (já carregado). Offline só credita
    // peixes+lifetime (vitrine), não gastos.
    set({
      ...base,
      efeitosAtivosAte: {}, // Habilidades de clique são presença: uma janela não sobrevive ao offline.
      agoraMs: Date.now(),
      cadenciaClique: 0,
      ultimoCliqueMs: null,
      peixes: base.peixes + ganhoFinal.peixes,
      lifetime: base.lifetime + ganhoFinal.peixes,
      eraMaxAtingida,
      ofertaDraft:
        save.ofertaDraft && save.ofertaDraft.length > 0
          ? save.ofertaDraft
          : gerarOferta(lendarios, eraMaxAtingida),
      rerollsFeitos: typeof save.rerollsFeitos === "number" ? Math.max(0, Math.floor(save.rerollsFeitos)) : 0,
      dinastias: save.dinastias ?? 0,
      runInicioTs: save.runInicioTs ?? Date.now(),
      ganhoOffline: ganhoFinal.peixes > 0 ? ganhoFinal : null,
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
      recargasAtivasAte: s.recargasAtivasAte,
      lendarios: s.lendarios,
      ofertaDraft: s.ofertaDraft,
      rerollsFeitos: s.rerollsFeitos,
      eraMaxAtingida: s.eraMaxAtingida,
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
 * estado separado. Pode exceder o total de Eras do slice; `eraPorNivel` clampa na exibição.
 */
export function eraAtual(gatos: Record<string, number>): number {
  return eraDeObras(obrasConstruidas(gatos));
}

type EstadoProducao = Pick<GameState, "gatos" | "habilidades" | "lendarios">;
type EstadoClique = EstadoProducao & Pick<GameState, "efeitosAtivosAte" | "agoraMs">;

export function prodPorSegundo(s: EstadoProducao): number {
  // ADR-0004: o multiplicador global de produção vem dos Lendários (que já incluem o Selo #0).
  const mult = multsDaCorte(s.lendarios).producao;
  return producaoPorSegundo(produtores(s.gatos, s.habilidades), mult);
}

export function poderDeClique(s: EstadoClique): number {
  const clique = efeitosCliqueGlobais(s.habilidades);
  return peixesPorClique(
    prodPorSegundo(s),
    multiplicadorCliqueAtual(s),
    bonusColheita(clique),
  );
}

/** Multiplicador explícito do clique (passivas C1 + Lendários + burst ativo), para feedback da UI. */
export function multiplicadorCliqueAtual(s: EstadoClique): number {
  const clique = efeitosCliqueGlobais(s.habilidades);
  const lendClique = multsDaCorte(s.lendarios).clique;
  const ativas = multiplicadorDasHabilidadesAtivas(s.efeitosAtivosAte, s.agoraMs);
  return multiplicadorClique(clique) * lendClique * ativas;
}

/** Custo de comprar gatos já com a redução dos Lendários de custo (`custoReducao`) aplicada. */
function custoComReducao(
  custoBase: number,
  possui: number,
  quantidade: number,
  lendarios: Record<string, number>,
): number {
  const bruto = custoDeVariosGatos(custoBase, possui, quantidade);
  return Math.ceil(bruto * multsDaCorte(lendarios).custoGatos);
}

export function custoDaCompra(
  gatos: Record<string, number>,
  lendarios: Record<string, number>,
  buildingId: string,
  quantidade: number,
): number {
  const b = BUILDINGS.find((x) => x.id === buildingId);
  if (!b) return Number.POSITIVE_INFINITY;
  return custoComReducao(b.custoBasePorGato, gatos[buildingId] ?? 0, quantidade, lendarios);
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

// --- Seletor da Corte Lendária (tudo que o painel de UI precisa) ---

export interface LendarioRecrutadoUI {
  def: LendarioDef;
  nivel: number;
  custoProxNivel: number;
  podeSubir: boolean;
}
export interface OfertaUI {
  def: LendarioDef;
  custoRecrutar: number;
  podeRecrutar: boolean;
}
export interface CorteUI {
  coroas: number;
  recrutados: LendarioRecrutadoUI[];
  oferta: OfertaUI[];
  custoReroll: number;
  podeReroll: boolean;
  poolVazio: boolean;
}

type EstadoCorte = Pick<
  GameState,
  "coroas" | "lendarios" | "ofertaDraft" | "rerollsFeitos" | "eraMaxAtingida"
>;

/** Resolve a Corte pra o painel: recrutados (com custo do próximo nível) + oferta + reroll. */
export function corteUI(s: EstadoCorte): CorteUI {
  const recrutados: LendarioRecrutadoUI[] = LEGENDARIES.filter((l) => (s.lendarios[l.id] ?? 0) > 0)
    .map((def) => {
      const nivel = s.lendarios[def.id] ?? 0;
      const custoProxNivel = custoSubirNivel(nivel, NIVEL_BASE, NIVEL_GROWTH);
      return { def, nivel, custoProxNivel, podeSubir: s.coroas >= custoProxNivel };
    });

  const custoRec = custoRecrutar(nRecrutados(s.lendarios), RECRUTAR_BASE, RECRUTAR_GROWTH);
  const oferta: OfertaUI[] = s.ofertaDraft
    .map((id) => lendarioPorId(id))
    .filter((d): d is LendarioDef => d !== undefined && (s.lendarios[d.id] ?? 0) === 0)
    .map((def) => ({ def, custoRecrutar: custoRec, podeRecrutar: s.coroas >= custoRec }));

  const poolVazio = poolDisponivel(s.lendarios, s.eraMaxAtingida).length === 0;
  const custoRr = custoReroll(s.rerollsFeitos, REROLL_BASE, REROLL_GROWTH);

  return {
    coroas: s.coroas,
    recrutados,
    oferta,
    custoReroll: custoRr,
    podeReroll: !poolVazio && s.coroas >= custoRr,
    poolVazio,
  };
}
