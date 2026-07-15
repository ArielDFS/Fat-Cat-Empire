/**
 * CONTEÚDO — Habilidades passivas (GAME_DESIGN.md §3.4, ADR-0002). Só dados, zero lógica de jogo.
 *
 * Cada prédio ganha 4 passivas, uma por marco de gatos [10, 25, 50, 100]. O marco *abre* a compra;
 * o jogador *compra* com peixes. As passivas vêm em dois sabores que competem pelos mesmos peixes
 * (ADR-0002): **Produção** (buffa a idle daquele prédio) e **Clique** (buffa o poder de clique,
 * global e invisível offline). São 4 arquétipos:
 *
 *   P1  producaoMult      ×fator na produção do prédio           (CC — upgrades de prédio)
 *   P2  producaoPorGato   +pct de produção por gato do prédio    (CC — "Thousand Fingers")
 *   C1  cliqueMult        ×fator no poder de clique (global)     (CH — click damage)
 *   C2  cliqueColheita    +pct no CLICK_FACTOR efetivo (global)  (CC — "clicking gains +% of CpS")
 *
 * Distribuição 8/8 com o clique liderando (a 1ª passiva do jogo é de Clique) e idle sem marco morto
 * — ver a tabela do §3.4. Custos e valores são alvo de balanceamento (§8), não `[TRAVADO]`.
 */

import { COST_GROWTH } from "../domain/constants";
import { BUILDINGS } from "./buildings";

/** Efeito de uma passiva. `pool` (produção/clique) é derivado do `tipo` — ver `poolDe`. */
export type EfeitoPassiva =
  | { readonly tipo: "producaoMult"; readonly fator: number } // P1
  | { readonly tipo: "producaoPorGato"; readonly pct: number } // P2
  | { readonly tipo: "cliqueMult"; readonly fator: number } // C1
  | { readonly tipo: "cliqueColheita"; readonly pct: number }; // C2

export type Pool = "producao" | "clique";

export function poolDe(efeito: EfeitoPassiva): Pool {
  return efeito.tipo === "cliqueMult" || efeito.tipo === "cliqueColheita" ? "clique" : "producao";
}

export interface PassiveAbility {
  /** `${buildingId}:m${marco}` — estável, serializado no save. */
  readonly id: string;
  readonly buildingId: string;
  readonly nome: string;
  readonly descricao: string;
  /** Emoji-placeholder até termos ícones próprios (ART_STYLE). */
  readonly emoji: string;
  /** Gatos no prédio para a passiva abrir (um dos marcos de §3.4). */
  readonly marco: number;
  readonly custo: number;
  readonly efeito: EfeitoPassiva;
}

/** Custo ≈ "mais 10 gatos" no ponto do marco. Fator de balanceamento (§8), ajustável. */
const FATOR_CUSTO = 10;

function custoNoMarco(custoBasePorGato: number, marco: number): number {
  return Math.round(custoBasePorGato * COST_GROWTH ** marco * FATOR_CUSTO);
}

/** Descrição legível do efeito, para o hover-modal da loja. */
export function descreverEfeito(efeito: EfeitoPassiva): string {
  switch (efeito.tipo) {
    case "producaoMult":
      return `Produção do prédio ×${efeito.fator.toLocaleString("pt-BR")}`;
    case "producaoPorGato":
      return `+${(efeito.pct * 100).toLocaleString("pt-BR")}% de produção do prédio por gato dele`;
    case "cliqueMult":
      return `Poder de clique ×${efeito.fator.toLocaleString("pt-BR")} (global)`;
    case "cliqueColheita":
      return `Cada clique colhe +${(efeito.pct * 100).toLocaleString("pt-BR")}% da produção/s (global)`;
  }
}

/** Uma passiva escrita à mão: casa por posição com `Building.marcos` ([10,25,50,100]). */
type Def = { nome: string; descricao: string; emoji: string; efeito: EfeitoPassiva };

/** Tabela do §3.4 (8/8, clique liderando). A ordem casa com os marcos do prédio. */
const DEFS: Record<string, readonly Def[]> = {
  caixa_papelao: [
    { nome: "Luva Antiderrapante", descricao: "Clique firme: cada toque rende mais.", emoji: "🧤", efeito: { tipo: "cliqueMult", fator: 1.5 } },
    { nome: "Papelão Reforçado", descricao: "Dupla face aguenta o dobro de ronrons.", emoji: "📦", efeito: { tipo: "producaoMult", fator: 2 } },
    { nome: "Colônia de Caixas", descricao: "Cada gato extra empurra a vizinhança inteira.", emoji: "🏘️", efeito: { tipo: "producaoPorGato", pct: 0.01 } },
    { nome: "Precisão Felina", descricao: "O clique aprende a colher da produção.", emoji: "🎯", efeito: { tipo: "cliqueColheita", pct: 0.02 } },
  ],
  barraca_peixe: [
    { nome: "Isca Premium", descricao: "Sardinha gourmet atrai mais peixe.", emoji: "🪱", efeito: { tipo: "producaoMult", fator: 1.5 } },
    { nome: "Fisgada Rápida", descricao: "Reflexo de gato: o clique fisga na hora.", emoji: "🎣", efeito: { tipo: "cliqueMult", fator: 1.5 } },
    { nome: "Rede de Arrasto", descricao: "Pega tudo que passa. Dobrou.", emoji: "🕸️", efeito: { tipo: "producaoMult", fator: 2 } },
    { nome: "Arpão de Bambu", descricao: "Cada clique perfura o dobro.", emoji: "🔱", efeito: { tipo: "cliqueMult", fator: 2 } },
  ],
  miaurcado: [
    { nome: "Balcão de Gelo", descricao: "Peixe fresco vende sozinho.", emoji: "🧊", efeito: { tipo: "producaoMult", fator: 1.5 } },
    { nome: "Feira Movimentada", descricao: "Multidão gera multidão: cada gato puxa freguês.", emoji: "🏪", efeito: { tipo: "producaoPorGato", pct: 0.005 } },
    { nome: "Grito do Feirante", descricao: "'Óia a promoção!' — o clique ganha voz.", emoji: "📣", efeito: { tipo: "cliqueMult", fator: 1.5 } },
    { nome: "Rede de Bancas", descricao: "Uma banca em cada esquina do beco. Dobrou.", emoji: "🏬", efeito: { tipo: "producaoMult", fator: 2 } },
  ],
  banco_atum: [
    { nome: "Bônus por Clique", descricao: "Todo clique vira comissão.", emoji: "💳", efeito: { tipo: "cliqueMult", fator: 1.5 } },
    { nome: "Gerente Sonolento", descricao: "Dorme no cofre e ainda rende o dobro.", emoji: "😴", efeito: { tipo: "producaoMult", fator: 2 } },
    { nome: "Juros Compostos", descricao: "Cada clique rende um tiquinho de tudo.", emoji: "📈", efeito: { tipo: "cliqueColheita", pct: 0.03 } },
    { nome: "Alta do Atum", descricao: "Mercado em alta: o clique dispara.", emoji: "🐟", efeito: { tipo: "cliqueMult", fator: 2 } },
  ],
};

/** Todas as passivas, achatadas a partir das defs por prédio × os marcos do prédio. */
export const PASSIVE_ABILITIES: readonly PassiveAbility[] = BUILDINGS.flatMap((b) => {
  const defs = DEFS[b.id] ?? [];
  return b.marcos.map((marco, i) => {
    const d = defs[i] ?? {
      nome: `Melhoria ${i + 1}`,
      descricao: "",
      emoji: "❔",
      efeito: { tipo: "producaoMult", fator: 2 } as EfeitoPassiva,
    };
    return {
      id: `${b.id}:m${marco}`,
      buildingId: b.id,
      nome: d.nome,
      descricao: d.descricao,
      emoji: d.emoji,
      marco,
      custo: custoNoMarco(b.custoBasePorGato, marco),
      efeito: d.efeito,
    };
  });
});

const POR_ID = new Map(PASSIVE_ABILITIES.map((a) => [a.id, a]));

export function abilityPorId(id: string): PassiveAbility | undefined {
  return POR_ID.get(id);
}

/** Passivas de um prédio, na ordem dos marcos. */
export function abilitiesDoPredio(buildingId: string): readonly PassiveAbility[] {
  return PASSIVE_ABILITIES.filter((a) => a.buildingId === buildingId);
}
