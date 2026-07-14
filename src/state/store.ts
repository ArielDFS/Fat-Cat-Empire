/**
 * Store Zustand — o estado do jogo e as ações que o mudam (GAME_DESIGN.md §9).
 *
 * Regra de ouro: a store pode importar `domain/` e `data/`, mas `domain/` NUNCA
 * importa a store. Toda a matemática vive em `domain/` (testada); aqui só orquestramos.
 */

import { create } from "zustand";
import { BUILDINGS } from "../data/buildings";
import type { Building } from "../data/buildings";
import { CLICK_FACTOR } from "../domain/constants";
import { custoDeVariosGatos } from "../domain/cost";
import { producaoPorSegundo } from "../domain/production";
import type { PredioProdutor } from "../domain/production";
import { calcularGanhoOffline } from "../domain/offline";
import type { GanhoOffline } from "../domain/offline";
import { carregarSave, gravarSave } from "./save";

/** gatos por prédio, tudo em zero. */
function gatosZerados(): Record<string, number> {
  const g: Record<string, number> = {};
  for (const b of BUILDINGS) g[b.id] = 0;
  return g;
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

/** Traduz o estado bruto para o formato que `domain/production` entende. */
function produtores(gatos: Record<string, number>): PredioProdutor[] {
  return BUILDINGS.map((b) => ({
    prodPorGato: b.producaoPorGato,
    qtdGatos: gatos[b.id] ?? 0,
    habilidadesPassivasMult: 1, // sem habilidades ainda (passo 5-6)
  }));
}

export interface GameState {
  peixes: number;
  lifetime: number;
  coroas: number;
  gatos: Record<string, number>;

  /** Ganho da última ausência, enquanto o modal de retorno está aberto (null = sem modal). */
  ganhoOffline: GanhoOffline | null;
  /** Já carregou o save nesta sessão? Evita reaplicar o offline (ex.: StrictMode em dev). */
  hidratado: boolean;

  /** Compra `quantidade` gatos de um prédio, se der pra pagar. */
  comprarGatos: (buildingId: string, quantidade: number) => void;
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
}

export const useGame = create<GameState>((set, get) => ({
  peixes: 0,
  lifetime: 0,
  coroas: 0,
  gatos: gatosZerados(),
  ganhoOffline: null,
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

  clicar: () => {
    const s = get();
    const ganho = poderDeClique(s);
    set({ peixes: s.peixes + ganho, lifetime: s.lifetime + ganho });
  },

  tick: (dtSegundos) => {
    if (dtSegundos <= 0) return;
    const s = get();
    const ganho = prodPorSegundo(s) * dtSegundos;
    if (ganho <= 0) return;
    set({ peixes: s.peixes + ganho, lifetime: s.lifetime + ganho });
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
    };

    // A produção que alimenta o offline precisa ser a EFETIVA (com coroas já embutidas),
    // pois `domain/offline` não reaplica coroas. `prodPorSegundo` entrega exatamente isso.
    const ganho = calcularGanhoOffline(prodPorSegundo(base), Date.now() - save.ts);

    set({
      ...base,
      peixes: base.peixes + ganho.peixes,
      lifetime: base.lifetime + ganho.peixes,
      ganhoOffline: ganho.peixes > 0 ? ganho : null,
      hidratado: true,
    });
  },

  salvar: () => {
    const s = get();
    gravarSave({ peixes: s.peixes, lifetime: s.lifetime, coroas: s.coroas, gatos: s.gatos });
  },

  fecharModalOffline: () => set({ ganhoOffline: null }),
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

type EstadoProducao = Pick<GameState, "gatos" | "coroas">;

export function prodPorSegundo(s: EstadoProducao): number {
  return producaoPorSegundo(produtores(s.gatos), s.coroas);
}

export function poderDeClique(s: EstadoProducao): number {
  return Math.max(1, prodPorSegundo(s) * CLICK_FACTOR);
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
