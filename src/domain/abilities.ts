/**
 * Habilidades passivas — a parte PURA (GAME_DESIGN.md §3.4, §3.7, ADR-0002).
 *
 * Não importa nada de `ui/`, `state/` nem `data/` (a regra de ouro de `production.ts`). O *conteúdo*
 * das passivas (nomes, custos, efeitos) mora em `data/abilities.ts`; aqui fica só a matemática
 * testável: quando um marco abre e como cada arquétipo de efeito se combina.
 *
 * Estes tipos são um espelho estrutural de `EfeitoPassiva` em `data/` — replicados de propósito
 * para não quebrar a regra de ouro (domain não importa data). A store faz a ponte entre os dois.
 */

export type EfeitoProducao =
  | { tipo: "producaoMult"; fator: number } // P1: ×fator na produção do prédio
  | { tipo: "producaoPorGato"; pct: number }; // P2: +pct de produção por gato do prédio

export type EfeitoClique =
  | { tipo: "cliqueMult"; fator: number } // C1: ×fator no poder de clique (global)
  | { tipo: "cliqueColheita"; pct: number }; // C2: +pct no CLICK_FACTOR efetivo (global)

/**
 * Um marco está atingido quando o prédio tem gatos suficientes (§3.4). É `>=`: comprar o gato de
 * número `marco` já abre a passiva.
 */
export function habilidadeDesbloqueada(qtdGatos: number, marco: number): boolean {
  return qtdGatos >= marco;
}

/**
 * Multiplicador de PRODUÇÃO de um prédio a partir das passivas de produção compradas dele (§3.7):
 *
 *     mult = Π(fatores P1) × (1 + Σ(pct P2) × qtdGatos)
 *
 * Os P1 (multiplicadores fixos) compõem multiplicativamente; os P2 (+% por gato) somam e escalam
 * com o enxame daquele prédio. Sem passivas → 1 (neutro).
 */
export function multiplicadorProducao(
  efeitos: readonly EfeitoProducao[],
  qtdGatos: number,
): number {
  let mult = 1;
  let pctPorGato = 0;
  for (const e of efeitos) {
    if (e.tipo === "producaoMult") mult *= e.fator;
    else pctPorGato += e.pct;
  }
  return mult * (1 + pctPorGato * qtdGatos);
}

/**
 * Multiplicador GLOBAL de clique a partir de todas as passivas C1 compradas (produto). É global:
 * a passiva mora num prédio, mas o efeito vale para o clique inteiro (ADR-0002). Sem C1 → 1.
 */
export function multiplicadorClique(efeitos: readonly EfeitoClique[]): number {
  let mult = 1;
  for (const e of efeitos) if (e.tipo === "cliqueMult") mult *= e.fator;
  return mult;
}

/**
 * Bônus somado ao `CLICK_FACTOR` a partir das passivas C2 ("clique colhe +% da produção/s").
 * Aditivo e global. Sem C2 → 0.
 */
export function bonusColheita(efeitos: readonly EfeitoClique[]): number {
  let soma = 0;
  for (const e of efeitos) if (e.tipo === "cliqueColheita") soma += e.pct;
  return soma;
}
