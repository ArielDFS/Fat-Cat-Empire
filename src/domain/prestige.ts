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

import { PRESTIGE_DIVISOR } from "./constants";

/**
 * Coroas que a run renderia se o jogador fundasse a Nova Dinastia agora.
 *
 * **Raiz CÚBICA (§6, ADR-0004):** `floor(cbrt(gastos / DIVISOR))` — mais suave que o `sqrt` antigo
 * ("8× pra dobrar", padrão Cookie Clicker), pra a Coroa (agora moeda gastável da Corte Lendária)
 * não escalonar demais.
 *
 * @param gastosDaRun Peixes GASTOS nesta run (gatos + passivas + Obras); zera a cada Dinastia.
 * @returns 0 se a run ainda não vale uma coroa (ou entrada inválida).
 */
export function coroasGanhasNaRun(gastosDaRun: number): number {
  if (gastosDaRun <= 0) return 0;
  return Math.floor(Math.cbrt(gastosDaRun / PRESTIGE_DIVISOR));
}

/** O botão de Nova Dinastia só aparece quando isto é verdadeiro (§6). */
export function podeFundarNovaDinastia(gastosDaRun: number): boolean {
  return coroasGanhasNaRun(gastosDaRun) >= 1;
}

/** Tudo que a tela de confirmação obrigatória do §6 precisa mostrar. */
export interface ResumoNovaDinastia {
  /** Coroas que entram nesta fundação (pra gastar na Corte Lendária). */
  coroasGanhas: number;
  /** Total de coroas após fundar. */
  coroasDepois: number;
}

/**
 * Monta o resumo da Nova Dinastia para a tela de confirmação.
 * Puro: não altera nada, só calcula o "antes e depois". A Coroa é moeda gastável (ADR-0004) — não
 * há mais "multiplicador de produção" a mostrar; o buff vem dos Lendários que a Coroa compra.
 */
export function resumoNovaDinastia(
  gastosDaRun: number,
  coroasAtuais: number,
): ResumoNovaDinastia {
  const coroasGanhas = coroasGanhasNaRun(gastosDaRun);
  return { coroasGanhas, coroasDepois: coroasAtuais + coroasGanhas };
}
