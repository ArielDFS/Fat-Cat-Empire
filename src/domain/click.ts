/**
 * Poder de clique — economia PURA (GAME_DESIGN.md §3.5, ADR-0002).
 *
 * Não importa nada de `ui/`, `state/` nem `data/`. O clique é **sempre uma fração da produção**,
 * nunca um "+N fixo" — é isso que o mantém relevante enquanto a produção cresce (ADR-0002):
 *
 *     peixes_por_clique = max(1, prod_por_segundo × (CLICK_FACTOR + colheita) × cliqueMult)
 *
 * `colheita` (C2) e `cliqueMult` (C1) vêm das Passivas de Clique compradas. O piso de 1 cobre o
 * começo do jogo, quando a produção ainda é baixa.
 */

import { CLICK_FACTOR } from "./constants";

/**
 * @param prodPorSegundo  Produção/s EFETIVA (com coroas e passivas de produção já embutidas).
 * @param cliqueMult      Produto das passivas C1 (default 1 = nenhuma).
 * @param colheita        Soma das passivas C2, somada ao CLICK_FACTOR (default 0 = nenhuma).
 */
export function peixesPorClique(prodPorSegundo: number, cliqueMult = 1, colheita = 0): number {
  const fatorEfetivo = CLICK_FACTOR + colheita;
  return Math.max(1, prodPorSegundo * fatorEfetivo * cliqueMult);
}
