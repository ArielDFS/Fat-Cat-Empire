/**
 * Poder de clique — economia PURA (GAME_DESIGN.md §3.5, ADR-0002).
 *
 * Não importa nada de `ui/`, `state/` nem `data/`. O clique é **sempre uma fração da produção**,
 * nunca um "+N fixo" — é isso que o mantém relevante enquanto a produção cresce (ADR-0002):
 *
 *     valor_base_do_clique = max(1, prod_por_segundo × (CLICK_FACTOR + colheita)) × cliqueMult
 *     peixes_creditados   = valor_base_do_clique × fator_de_cadência
 *
 * `colheita` (C2) e `cliqueMult` (C1) vêm das Passivas de Clique compradas. O piso de 1 cobre o
 * começo do jogo, quando a produção ainda é baixa. A cadência vem depois, na store: ela pode reduzir
 * o valor-base abaixo de 1 durante uma rajada para impedir que autoclickers dominem o burst.
 */

import {
  CLICK_CADENCE_EXCESS_FACTOR,
  CLICK_CADENCE_FULL_CLICKS,
  CLICK_FACTOR,
} from "./constants";

/**
 * @param prodPorSegundo  Produção/s EFETIVA (com coroas e passivas de produção já embutidas).
 * @param cliqueMult      Produto das passivas C1 (default 1 = nenhuma).
 * @param colheita        Soma das passivas C2, somada ao CLICK_FACTOR (default 0 = nenhuma).
 */
export function peixesPorClique(prodPorSegundo: number, cliqueMult = 1, colheita = 0): number {
  const fatorEfetivo = CLICK_FACTOR + colheita;
  // O piso protege a base do clique, mas não pode apagar o investimento em C1:
  // mesmo no bootstrap, ×1,5 precisa render 1,5 por toque.
  return Math.max(1, prodPorSegundo * fatorEfetivo) * cliqueMult;
}

/**
 * Fator suave contra cadência sobre-humana: até o limite confortável, o clique vale integralmente;
 * acima dele, cada toque vale 80% do anterior. A série geométrica converge: 8 cliques integrais +
 * uma cauda de 4 equivalentes = teto prático de 12, sem um piso explorável por autoclicker.
 */
export function fatorDaCadenciaClique(nivelCadencia: number): number {
  if (nivelCadencia <= CLICK_CADENCE_FULL_CLICKS) return 1;
  return CLICK_CADENCE_EXCESS_FACTOR ** (nivelCadencia - CLICK_CADENCE_FULL_CLICKS);
}

/**
 * Atualiza a cadência como um balde vazante: ela perde 8 pontos por segundo antes de somar o novo
 * clique. Assim a memória é limitada a dois números, mas a recuperação é contínua (não há borda de
 * janela explorável).
 */
export function proximaCadenciaClique(cadenciaAnterior: number, msDesdeUltimoClique: number): number {
  const drenagem = (Math.max(0, msDesdeUltimoClique) / 1_000) * CLICK_CADENCE_FULL_CLICKS;
  return Math.max(0, cadenciaAnterior - drenagem) + 1;
}
