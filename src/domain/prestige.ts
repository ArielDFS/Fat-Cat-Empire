/**
 * Prestígio — Nova Dinastia. Economia PURA (GAME_DESIGN.md §6).
 *
 * Não importa nada de `ui/`, `state/` nem `data/`. 100% testável.
 *
 *     coroas_ganhas = floor( sqrt( peixes_lifetime_da_run / PRESTIGE_DIVISOR ) )
 *
 * As coroas persistem como CONTAGEM (§6): dão bônus global hoje e serão a moeda dos
 * Artefatos no endgame. Nunca modele coroa como recurso consumível.
 */

import { PRESTIGE_DIVISOR, CROWN_BONUS } from "./constants";

/**
 * Coroas que a run renderia se o jogador fundasse a Nova Dinastia agora.
 *
 * @param peixesLifetimeDaRun Peixes acumulados NESTA run (zera a cada Dinastia).
 * @returns 0 se a run ainda não vale uma coroa (ou entrada inválida).
 */
export function coroasGanhasNaRun(peixesLifetimeDaRun: number): number {
  if (peixesLifetimeDaRun <= 0) return 0;
  return Math.floor(Math.sqrt(peixesLifetimeDaRun / PRESTIGE_DIVISOR));
}

/** O botão de Nova Dinastia só aparece quando isto é verdadeiro (§6). */
export function podeFundarNovaDinastia(peixesLifetimeDaRun: number): boolean {
  return coroasGanhasNaRun(peixesLifetimeDaRun) >= 1;
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
  peixesLifetimeDaRun: number,
  coroasAtuais: number,
): ResumoNovaDinastia {
  const coroasGanhas = coroasGanhasNaRun(peixesLifetimeDaRun);
  const coroasDepois = coroasAtuais + coroasGanhas;
  return {
    coroasGanhas,
    coroasDepois,
    multiplicadorAtual: bonusGlobalDeCoroas(coroasAtuais),
    multiplicadorDepois: bonusGlobalDeCoroas(coroasDepois),
  };
}
