/**
 * Produção de peixes — economia PURA (GAME_DESIGN.md §3.7).
 *
 * Não importa nada de `ui/`, `state/` nem `data/`. 100% testável.
 *
 *     prod_predio(i) = prod_por_gato(i) * qtd_gatos(i) * habilidades_passivas_mult(i)
 *     prod_total     = Σ prod_predio(i) * global_mult
 *     global_mult    = (1 + CROWN_BONUS * coroas) * habilidades_globais * evento_mult
 *
 * Ordem sagrada: **aditiva dentro da coroa, multiplicativa fora** (§3.7). É o que
 * impede a inflação descontrolada nas primeiras runs — não reordene sem recalcular
 * o ritmo inteiro (§8).
 */

import { CROWN_BONUS } from "./constants";

/** Um prédio, reduzido ao que a produção precisa saber dele. */
export interface PredioProdutor {
  /** Produção base de UM gato desse prédio (peixes/s), de `data/buildings.ts`. */
  prodPorGato: number;
  /** Gatos comprados nesse prédio. */
  qtdGatos: number;
  /** Produto dos multiplicadores das habilidades passivas compradas (default 1 = nenhuma). */
  habilidadesPassivasMult?: number;
}

/** Produção de um único prédio, antes do multiplicador global. */
export function producaoDoPredio(
  prodPorGato: number,
  qtdGatos: number,
  habilidadesPassivasMult = 1,
): number {
  return prodPorGato * qtdGatos * habilidadesPassivasMult;
}

/**
 * Multiplicador global. As coroas entram de forma **aditiva** (1 + bônus·coroas);
 * habilidades globais e evento entram de forma **multiplicativa** por fora.
 */
export function multiplicadorGlobal(
  coroas: number,
  habilidadesGlobaisMult = 1,
  eventoMult = 1,
): number {
  return (1 + CROWN_BONUS * coroas) * habilidadesGlobaisMult * eventoMult;
}

/** Soma da produção de todos os prédios, já aplicado o multiplicador global. */
export function producaoTotal(predios: readonly PredioProdutor[], globalMult: number): number {
  let soma = 0;
  for (const p of predios) {
    soma += producaoDoPredio(p.prodPorGato, p.qtdGatos, p.habilidadesPassivasMult ?? 1);
  }
  return soma * globalMult;
}

/**
 * Conveniência: produção por segundo do estado inteiro numa chamada só.
 * Compõe `multiplicadorGlobal` + `producaoTotal` — continua puro.
 */
export function producaoPorSegundo(
  predios: readonly PredioProdutor[],
  coroas: number,
  habilidadesGlobaisMult = 1,
  eventoMult = 1,
): number {
  return producaoTotal(predios, multiplicadorGlobal(coroas, habilidadesGlobaisMult, eventoMult));
}
