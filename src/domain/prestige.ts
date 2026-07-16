/**
 * Prestígio — Nova Dinastia. Economia PURA (GAME_DESIGN.md §6).
 *
 * Não importa nada de `ui/`, `state/` nem `data/`. 100% testável.
 *
 *     coroas_ganhas = floor( sqrt( peixes_gastos_na_run / PRESTIGE_DIVISOR ) )
 *
 * **Migração v0.6 (ADR-0003):** a base da Coroa deixou de ser o `lifetime` (removido como driver) e
 * passou a ser os **peixes gastos na run** — tudo que saiu do saldo (gatos + passivas + Obras). Como
 * `gastos ≈ produção`, os alvos de ritmo do §8 sobrevivem aproximadamente; a fórmula não muda.
 *
 * As coroas persistem como CONTAGEM (§6): dão bônus global hoje e serão a moeda dos
 * Artefatos no endgame. Nunca modele coroa como recurso consumível.
 */

import { PRESTIGE_DIVISOR, CROWN_BONUS } from "./constants";

/**
 * Coroas que a run renderia se o jogador fundasse a Nova Dinastia agora.
 *
 * @param gastosDaRun Peixes GASTOS nesta run (gatos + passivas + Obras); zera a cada Dinastia.
 * @returns 0 se a run ainda não vale uma coroa (ou entrada inválida).
 */
export function coroasGanhasNaRun(gastosDaRun: number): number {
  if (gastosDaRun <= 0) return 0;
  return Math.floor(Math.sqrt(gastosDaRun / PRESTIGE_DIVISOR));
}

/** O botão de Nova Dinastia só aparece quando isto é verdadeiro (§6). */
export function podeFundarNovaDinastia(gastosDaRun: number): boolean {
  return coroasGanhasNaRun(gastosDaRun) >= 1;
}

/** Multiplicador de produção global vindo das coroas: 1 + CROWN_BONUS × coroas. */
export function bonusGlobalDeCoroas(coroasTotais: number): number {
  return 1 + CROWN_BONUS * Math.max(0, coroasTotais);
}

/** Tudo que a tela de confirmação obrigatória do §6 precisa mostrar. */
export interface ResumoNovaDinastia {
  /** Coroas que entram nesta fundação. */
  coroasGanhas: number;
  /** Total de coroas após fundar. */
  coroasDepois: number;
  /** Multiplicador global atual (antes de fundar). */
  multiplicadorAtual: number;
  /** Multiplicador global depois de fundar. */
  multiplicadorDepois: number;
}

/**
 * Monta o resumo da Nova Dinastia para a tela de confirmação.
 * Puro: não altera nada, só calcula o "antes e depois".
 */
export function resumoNovaDinastia(
  gastosDaRun: number,
  coroasAtuais: number,
): ResumoNovaDinastia {
  const coroasGanhas = coroasGanhasNaRun(gastosDaRun);
  const coroasDepois = coroasAtuais + coroasGanhas;
  return {
    coroasGanhas,
    coroasDepois,
    multiplicadorAtual: bonusGlobalDeCoroas(coroasAtuais),
    multiplicadorDepois: bonusGlobalDeCoroas(coroasDepois),
  };
}
