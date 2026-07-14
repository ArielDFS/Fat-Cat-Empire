/**
 * Custo de comprar gatos — economia PURA (GAME_DESIGN.md §3.2).
 *
 * Este módulo não importa nada de `ui/`, `state/` nem `data/`. É 100% testável.
 *
 *     custo(n) = ceil( custoBase * COST_GROWTH^n )
 *
 * onde `n` = gatos JÁ comprados naquele prédio. A contagem é de gatos dentro do
 * prédio (v0.2), não de cópias do prédio — mas a matemática é a clássica do gênero.
 */

import { COST_GROWTH } from "./constants";

/**
 * Custo do próximo gato de um prédio, dado quantos já se possui.
 *
 * @param custoBase       Custo do 1º gato daquele prédio (de `data/buildings.ts`).
 * @param gatosPossuidos  Gatos já comprados nesse prédio (n ≥ 0).
 */
export function custoDoProximoGato(custoBase: number, gatosPossuidos: number): number {
  return Math.ceil(custoBase * COST_GROWTH ** gatosPossuidos);
}

/**
 * Custo total para comprar `quantidade` gatos de uma vez, partindo de
 * `gatosPossuidos`. Soma termo a termo — cada gato é arredondado individualmente,
 * exatamente como o jogo cobra. Alimenta o toggle "comprar 1 / 10 / 100".
 *
 * @returns 0 se `quantidade <= 0`.
 */
export function custoDeVariosGatos(
  custoBase: number,
  gatosPossuidos: number,
  quantidade: number,
): number {
  let total = 0;
  for (let i = 0; i < quantidade; i++) {
    total += custoDoProximoGato(custoBase, gatosPossuidos + i);
  }
  return total;
}
