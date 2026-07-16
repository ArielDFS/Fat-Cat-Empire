/**
 * CONTEÚDO — Gatos Lendários (Corte Lendária, GAME_DESIGN.md §4.6.7, ADR-0004). Só dados.
 *
 * Cada Lendário tem um **papel** (`efeito.tipo`) e uma **magnitude por nível** (`porNivel`). A
 * matemática (buff por nível, combinação, custos, sorteio) mora em `domain/legendaries.ts`; aqui só
 * o elenco e as constantes de balanceamento (§8, afináveis — a *forma* foi validada por simulação).
 *
 * Aquisição (§4.6.7): **draft de 3** do pool (filtrado por `tier` ≤ Era atingida, não recrutados) →
 * recrutar 1 (Coroas) → **reroll** paga Coroas com piso (o pool encolhe ao coletar). Poder por
 * **nível** (determinístico). O **Selo Imperial é o #0** (`gratis`, recrutado na 1ª Dinastia).
 */

import type { TipoEfeitoLendario } from "../domain/legendaries";

export interface LendarioDef {
  /** Id estável (serializado no save). */
  readonly id: string;
  readonly nome: string;
  readonly descricao: string;
  /** Emoji-placeholder até termos arte própria (cada Lendário terá rosto único, §4.6.7). */
  readonly emoji: string;
  /** Era mínima já atingida pra o Lendário entrar no draft (1..6). O #0 é `gratis` (fora do draft). */
  readonly tier: number;
  /** Papel + magnitude por nível. Ver `domain/legendaries.ts`. */
  readonly efeito: { readonly tipo: TipoEfeitoLendario; readonly porNivel: number };
  /** Concedido de graça (não aparece no draft nem custa Coroas). Só o Selo Imperial (#0). */
  readonly gratis?: boolean;
}

// --- Constantes de custo em Coroas (§8, balanceamento) ---
/** Custo do 1º nível de um Lendário recém-recrutado escala com quantos já se tem: base × growth^n. */
export const RECRUTAR_BASE = 2;
export const RECRUTAR_GROWTH = 1.5;
/** Custo pra subir um nível: base × growth^nivelAtual. (validado na simulação: ~2 × 1,4^n) */
export const NIVEL_BASE = 2;
export const NIVEL_GROWTH = 1.4;
/** Custo do reroll da oferta, sobe a cada reroll desde o último recrutamento (piso anti-treadmill). */
export const REROLL_BASE = 1;
export const REROLL_GROWTH = 1.6;
/** Quantos Lendários a oferta de draft mostra por vez. */
export const DRAFT_K = 3;

/**
 * O elenco. #0 = Selo Imperial (grátis, 1ª Dinastia). Os demais entram no draft por tier de Era.
 * Papéis espalhados (produção lidera — são os quebra-parede; ADR-0004). Nomes/números = editáveis.
 */
export const LEGENDARIES: readonly LendarioDef[] = [
  // #0 — concedido na 1ª Dinastia (era o "Selo Imperial", §3.6)
  {
    id: "selo_imperial",
    nome: "Selo Imperial",
    descricao: "O sinete do império, carimbado na Caixa. Produção ×1,5 por nível.",
    emoji: "🏅",
    tier: 0,
    efeito: { tipo: "producaoMult", porNivel: 1.5 },
    gratis: true,
  },

  // Tier 1 — Beco / Vila
  {
    id: "barao_bigode",
    nome: "Barão von Bigode",
    descricao: "Aristogato que faz a produção inteira render mais.",
    emoji: "🎩",
    tier: 1,
    efeito: { tipo: "producaoMult", porNivel: 1.15 },
  },
  {
    id: "garra_ouro",
    nome: "Garra de Ouro",
    descricao: "Cada toque dela vale ouro — poder de clique turbinado.",
    emoji: "🐾",
    tier: 1,
    efeito: { tipo: "cliqueMult", porNivel: 1.2 },
  },
  {
    id: "dona_sardinha",
    nome: "Dona Sardinha",
    descricao: "Negocia cada gato mais barato na feira.",
    emoji: "🐟",
    tier: 1,
    efeito: { tipo: "custoReducao", porNivel: 0.03 },
  },

  // Tier 3 — Cidade / Metrópole
  {
    id: "gato_schrodinger",
    nome: "Gato de Schrödinger",
    descricao: "Vivo e morto ao mesmo tempo — trabalha até quando você não está.",
    emoji: "📦",
    tier: 3,
    efeito: { tipo: "offlineMult", porNivel: 1.25 },
  },
  {
    id: "fada_ronrom",
    nome: "Fada do Ronrom",
    descricao: "Um ronrom mágico que amplifica a produção do império.",
    emoji: "✨",
    tier: 3,
    efeito: { tipo: "producaoMult", porNivel: 1.18 },
  },
  {
    id: "capitao_naveta",
    nome: "Capitão Naveta",
    descricao: "Antecipa a próxima Era — o empurrão da virada vem em dobro.",
    emoji: "🚀",
    tier: 3,
    efeito: { tipo: "lumpMult", porNivel: 1.5 },
  },

  // Tier 5 — Império / Galáxia
  {
    id: "imperatriz_nebulosa",
    nome: "Imperatriz Nebulosa",
    descricao: "Rainha cósmica: produção global em outro patamar.",
    emoji: "🌌",
    tier: 5,
    efeito: { tipo: "producaoMult", porNivel: 1.25 },
  },
  {
    id: "punho_cometa",
    nome: "Punho Cometa",
    descricao: "Soco à velocidade da luz — clique devastador.",
    emoji: "☄️",
    tier: 5,
    efeito: { tipo: "cliqueMult", porNivel: 1.3 },
  },
  {
    id: "vovo_quantica",
    nome: "Vovó Quântica",
    descricao: "Compra gatos no atacado interdimensional. Custo despenca.",
    emoji: "👵",
    tier: 5,
    efeito: { tipo: "custoReducao", porNivel: 0.05 },
  },
  {
    id: "rei_dourado",
    nome: "Rei Dourado do Atum",
    descricao: "O monarca do mar galáctico — produção suprema.",
    emoji: "👑",
    tier: 5,
    efeito: { tipo: "producaoMult", porNivel: 1.3 },
  },
  {
    id: "guardiao_vortex",
    nome: "Guardião do Vórtex",
    descricao: "Vigia o tempo — o ganho offline flui como num buraco de minhoca.",
    emoji: "🌀",
    tier: 5,
    efeito: { tipo: "offlineMult", porNivel: 1.4 },
  },
] as const;

/** O Selo Imperial — o Lendário #0, concedido na 1ª Dinastia. */
export const SELO_LENDARIO_ID = "selo_imperial";

const POR_ID = new Map(LEGENDARIES.map((l) => [l.id, l]));

export function lendarioPorId(id: string): LendarioDef | undefined {
  return POR_ID.get(id);
}

/**
 * Ids elegíveis pro draft: `tier` ≤ Era já atingida, ainda não recrutados, e não `gratis`.
 * (`niveis[id] > 0` = recrutado.)
 */
export function poolDisponivel(niveis: Record<string, number>, eraAtual: number): string[] {
  return LEGENDARIES.filter(
    (l) => !l.gratis && l.tier <= eraAtual && (niveis[l.id] ?? 0) === 0,
  ).map((l) => l.id);
}
