/**
 * Store Zustand — o estado do jogo e as ações que o mudam (GAME_DESIGN.md §9).
 *
 * Regra de ouro: a store pode importar `domain/` e `data/`, mas `domain/` NUNCA
 * importa a store. Toda a matemática vive em `domain/` (testada); aqui só orquestramos.
 */

import { create } from "zustand";
import { BUILDINGS } from "../data/buildings";
import { CLICK_FACTOR } from "../domain/constants";
import { custoDeVariosGatos } from "../domain/cost";
import { producaoPorSegundo } from "../domain/production";
import type { PredioProdutor } from "../domain/production";

/** gatos por prédio, tudo em zero. */
function gatosZerados(): Record<string, number> {
  const g: Record<string, number> = {};
  for (const b of BUILDINGS) g[b.id] = 0;
  return g;
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

  /** Compra `quantidade` gatos de um prédio, se der pra pagar. */
  comprarGatos: (buildingId: string, quantidade: number) => void;
  /** Um clique manual no peixe grande. */
  clicar: () => void;
  /** Avança a produção passiva por `dtSegundos` de tempo real. */
  tick: (dtSegundos: number) => void;
}

export const useGame = create<GameState>((set, get) => ({
  peixes: 0,
  lifetime: 0,
  coroas: 0,
  gatos: gatosZerados(),

  comprarGatos: (buildingId, quantidade) => {
    if (quantidade <= 0) return;
    const s = get();
    const b = BUILDINGS.find((x) => x.id === buildingId);
    if (!b) return;
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
}));

// --- Seletores puros para a UI (evitam reimplementar a economia no componente) ---

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
