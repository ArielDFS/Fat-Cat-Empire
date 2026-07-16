/**
 * Eras do Império — o eixo civilizacional. Economia PURA (GAME_DESIGN.md §4.5 / §4.6.9).
 *
 * Não importa nada de `ui/`, `state/` nem `data/` (a regra de ouro de `production.ts`). O *conteúdo*
 * das Eras (nomes, escalas, constantes de lump) mora em `data/eras.ts`; aqui fica só a matemática
 * testável: qual Era um número de Obras construídas representa, e quanto vale o lump ao cruzar uma.
 *
 * **Migração v0.6 (ADR-0003):** a Era deixou de ser função do `lifetime` e passou a ser dirigida
 * por **atos concretos** — cada **Obra** construída (o prédio-virada da Era) sobe um degrau. A
 * contagem de Obras vive em `gatos` (estado persistido); aqui só se converte contagem → nível.
 */

/**
 * Nível da Era a partir do número de **Obras já construídas** na run (§4.6.9). Zero Obras = Era 1
 * (o início do Beco); cada Obra construída sobe um degrau. Nunca abaixo de 1, mesmo com entrada
 * inválida (save corrompido) — a run sempre está em pelo menos a Era 1. Pode retornar acima do total
 * de Eras do slice (construir a Obra da última Era "aponta" para uma Era ainda inexistente — o
 * chamador clampa via `eraPorNivel`).
 */
export function eraDeObras(obrasConstruidas: number): number {
  return Math.max(1, Math.floor(obrasConstruidas) + 1);
}

/**
 * O lump de peixes ao cruzar uma Era (§4.5): um empurrão único, **nunca** um multiplicador.
 *
 *     lump = max( piso, prodPorSegundo × segundos )
 *
 * O termo `prodPorSegundo × segundos` faz o empurrão valer ~`segundos` da produção do momento
 * (alvo do §4.5: ~30 s), então escala com a run. O `piso` garante que a Era não seja irrelevante
 * cedo, quando a produção ainda é ínfima. Entradas negativas são clampadas a 0.
 */
export function lumpDaEra(prodPorSegundo: number, segundos: number, piso: number): number {
  const base = Math.max(0, prodPorSegundo) * Math.max(0, segundos);
  return Math.max(Math.max(0, piso), base);
}
