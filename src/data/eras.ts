/**
 * CONTEÚDO — Eras do Império (GAME_DESIGN.md §4.5 / §4.6.1). Só dados, zero lógica de jogo.
 *
 * A Era é o **grau de escala civilizacional** da run, dirigido pelo `lifetime` de peixes. NÃO são
 * seis sabores do mesmo beco: a civilização **sobe de escala** — beco → vila → cidade → metrópole →
 * império → galáxia (§4.6.1: "Era = a escada de escala caixa→galáxia"). Cruzar uma Era dá título +
 * lump de peixes + fanfarra + troca do mundo de fundo (§4.5, §4.6.5).
 *
 * Cada Era carrega dois rótulos: `escala` (o degrau legível, que sobe de propósito e o jogador
 * sente subir) e `nome` (o nome próprio — o trocadilho, o pilar do humor §1).
 *
 * Os limiares e as constantes de lump são **alvo de balanceamento (§8)**, ajustáveis — não são as
 * constantes `[TRAVADO]` de §3.1. A matemática (qual Era, quanto de lump) mora em `domain/era.ts`.
 */

export interface Era {
  /** Grau, 1..6. É o inteiro que a store persiste como `eraMaisAlta` (§4.5). */
  readonly nivel: number;
  /** Nome próprio da Era — o trocadilho (pilar do humor §1). */
  readonly nome: string;
  /** Degrau de escala civilizacional, que sobe de propósito (Beco → Galáxia). */
  readonly escala: string;
  /** Peixes acumulados na run (`lifetime`) para entrar nesta Era. Era 1 = 0 (início). */
  readonly limiar: number;
}

/**
 * As 6 Eras do slice, traçando a escada de escala inteira (beco → galáxia) comprimida — o arco
 * "gatos de rua viram um império absurdo" (§1) do início ao fim. Ordem crescente por limiar —
 * `domain/era.ts` assume isso. No jogo completo a escada estica (mais degraus entre estes).
 */
export const ERAS: readonly Era[] = [
  { nivel: 1, nome: "Beco Esquecido", escala: "Beco", limiar: 0 },
  { nivel: 2, nome: "Vila do Ronrom", escala: "Vila", limiar: 1_500 },
  { nivel: 3, nome: "Gatópolis", escala: "Cidade", limiar: 8_000 },
  { nivel: 4, nome: "Miadópolis", escala: "Metrópole", limiar: 40_000 },
  { nivel: 5, nome: "Império dos Bigodes", escala: "Império", limiar: 120_000 },
  { nivel: 6, nome: "Via-Láctea Felina", escala: "Galáxia", limiar: 600_000 },
] as const;

/** Limiares em ordem crescente — o formato que `domain/era.ts` (nivelDaEra) consome. */
export const LIMIARES: readonly number[] = ERAS.map((e) => e.limiar);

/** Segundos de produção que o lump vale ao cruzar uma Era (§4.5, alvo ~30 s). Balanceamento (§8). */
export const LUMP_SEGUNDOS = 30;

/** Piso do lump, para a Era não ser irrelevante cedo (produção ínfima). Balanceamento (§8). */
export const LUMP_PISO = 50;

/** A Era de um nível, clampada à escada (nível fora do intervalo → primeira/última Era). */
export function eraPorNivel(nivel: number): Era {
  const i = Math.min(Math.max(Math.floor(nivel), 1), ERAS.length) - 1;
  return ERAS[i] ?? ERAS[0]!; // i está clampado no intervalo válido; o `!` cobre o array não-vazio
}
