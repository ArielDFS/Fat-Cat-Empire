/**
 * Conteúdo das Habilidades ativas (GAME_DESIGN.md §3.5).
 *
 * Cada uma pertence a um Prédio e fica disponível quando ele já tem ao menos um gato. Duração e
 * recarga vivem aqui, nunca espalhadas pela store ou UI, porque são números de balanceamento.
 */

export interface ActiveAbility {
  /** Id estável: pode entrar no save como chave da recarga. */
  readonly id: string;
  readonly buildingId: string;
  readonly nome: string;
  readonly descricao: string;
  readonly emoji: string;
  readonly multiplicadorClique: number;
  readonly duracaoMs: number;
  readonly recargaMs: number;
}

/** Barraca — o primeiro burst do jogo (GAME_DESIGN.md §3.5). */
export const MARE_DE_PEIXE: ActiveAbility = {
  id: "mare_de_peixe",
  buildingId: "barraca_peixe",
  nome: "Maré de Peixe",
  descricao: "Uma onda de sardinhas faz cada clique fisgar muito mais.",
  emoji: "🌊",
  multiplicadorClique: 5,
  duracaoMs: 15_000,
  recargaMs: 90_000,
};

export const HABILIDADES_ATIVAS: readonly ActiveAbility[] = [MARE_DE_PEIXE];

const POR_ID = new Map(HABILIDADES_ATIVAS.map((habilidade) => [habilidade.id, habilidade]));

export function habilidadeAtivaPorId(id: string): ActiveAbility | undefined {
  return POR_ID.get(id);
}

export function habilidadeAtivaDoPredio(buildingId: string): ActiveAbility | undefined {
  return HABILIDADES_ATIVAS.find((habilidade) => habilidade.buildingId === buildingId);
}
