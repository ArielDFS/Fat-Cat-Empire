/**
 * Produção de peixes — economia PURA (GAME_DESIGN.md §3.7, ADR-0004).
 *
 * Não importa nada de `ui/`, `state/` nem `data/`. 100% testável.
 *
 *     prod_predio(i) = prod_por_gato(i) * qtd_gatos(i) * habilidades_passivas_mult(i)
 *     prod_total     = Σ prod_predio(i) * global_mult
 *     global_mult    = lendarios_producao * evento_mult
 *
 * **Migração v0.7 (ADR-0004):** a Coroa **deixou de dar bônus de produção** (morreu o `CROWN_BONUS`).
 * O multiplicador global agora vem dos **Gatos Lendários** (produto dos buffs de produção, que já
 * inclui o Selo Imperial = Lendário #0) × o evento. Tudo **multiplicativo** — a Coroa virou moeda
 * gastável (§6), não entra mais aqui.
 */

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
 * Multiplicador global — tudo **multiplicativo** (ADR-0004): o produto dos buffs de produção dos
 * Lendários (que já embute o Selo #0) × o multiplicador do evento.
 */
export function multiplicadorGlobal(lendariosProducaoMult = 1, eventoMult = 1): number {
  return lendariosProducaoMult * eventoMult;
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
  lendariosProducaoMult = 1,
  eventoMult = 1,
): number {
  return producaoTotal(predios, multiplicadorGlobal(lendariosProducaoMult, eventoMult));
}
