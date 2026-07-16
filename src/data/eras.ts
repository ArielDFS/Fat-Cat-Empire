/**
 * CONTEÚDO — Eras do Império (GAME_DESIGN.md §4.5 / §4.6.1 / §4.6.9). Só dados, zero lógica de jogo.
 *
 * A Era é o **grau de escala civilizacional** da run. NÃO são seis sabores do mesmo beco: a
 * civilização **sobe de escala** — beco → vila → cidade → metrópole → império → galáxia (§4.6.1).
 *
 * **Migração v0.6 (ADR-0003):** a Era deixou de ser dirigida pelo `lifetime`. Agora ela vira ao
 * **construir a Obra** de cada Era (o 6º prédio da cadeia, `ehObra` em `buildings.ts`): a Era atual =
 * 1 + nº de Obras construídas (a matemática vive em `domain/era.ts`; a contagem, em `gatos`). Por
 * isso os antigos `limiar`/`LIMIARES` (limiares de `lifetime`) **saíram** — não há mais gate por
 * odômetro. Cruzar uma Era dá título + fanfarra + troca do mundo de fundo (§4.6.5) + o lump (§4.5).
 *
 * Cada Era carrega dois rótulos: `escala` (o degrau legível, que o jogador sente subir) e `nome`
 * (o nome próprio — o trocadilho, o pilar do humor §1). As constantes de lump são alvo de
 * balanceamento (§8), ajustáveis — não são as constantes `[TRAVADO]` de §3.1.
 */

export interface Era {
  /** Grau, 1..6. = 1 + nº de Obras construídas na run (§4.6.9). */
  readonly nivel: number;
  /** Nome próprio da Era — o trocadilho (pilar do humor §1). */
  readonly nome: string;
  /** Degrau de escala civilizacional, que sobe de propósito (Beco → Galáxia). */
  readonly escala: string;
}

/**
 * As 6 Eras do slice, traçando a escada de escala inteira (beco → galáxia) — o arco "gatos de rua
 * viram um império absurdo" (§1) do início ao fim. Indexadas por `nivel` (1..6); cada Era é
 * inaugurada ao construir a Obra da Era anterior (§4.6.9). No jogo completo a escada estica.
 */
export const ERAS: readonly Era[] = [
  { nivel: 1, nome: "Beco Esquecido", escala: "Beco" },
  { nivel: 2, nome: "Vila do Ronrom", escala: "Vila" },
  { nivel: 3, nome: "Gatópolis", escala: "Cidade" },
  { nivel: 4, nome: "Miadópolis", escala: "Metrópole" },
  { nivel: 5, nome: "Império dos Bigodes", escala: "Império" },
  { nivel: 6, nome: "Via-Láctea Felina", escala: "Galáxia" },
] as const;

/** Segundos de produção que o lump vale ao cruzar uma Era (§4.5, alvo ~30 s). Balanceamento (§8). */
export const LUMP_SEGUNDOS = 30;

/** Piso do lump, para a Era não ser irrelevante cedo (produção ínfima). Balanceamento (§8). */
export const LUMP_PISO = 50;

/** A Era de um nível, clampada à escada (nível fora do intervalo → primeira/última Era). */
export function eraPorNivel(nivel: number): Era {
  const i = Math.min(Math.max(Math.floor(nivel), 1), ERAS.length) - 1;
  return ERAS[i] ?? ERAS[0]!; // i está clampado no intervalo válido; o `!` cobre o array não-vazio
}
