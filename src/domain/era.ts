/**
 * Eras do Império — o eixo civilizacional. Economia PURA (GAME_DESIGN.md §4.5).
 *
 * Não importa nada de `ui/`, `state/` nem `data/` (a regra de ouro de `production.ts`). O *conteúdo*
 * das Eras (nomes, limiares, constantes de lump) mora em `data/eras.ts`; aqui fica só a matemática
 * testável: qual Era um `lifetime` representa e quanto vale o lump ao cruzar uma.
 *
 * A Era é **derivada do `lifetime`** (§4.5) — nenhum recurso novo. O único estado que a store
 * persiste é a Era mais alta já atingida (um inteiro), para não repagar o lump ao recarregar.
 */

/**
 * Nível da Era correspondente a um `lifetime` de peixes (§4.5). `limiares` em ordem crescente,
 * começando em 0 (Era 1 é o início). Retorna 1..N; nunca abaixo de 1, mesmo com entrada inválida
 * (relógio/save corrompido) — a run sempre está em pelo menos a Era 1.
 */
export function nivelDaEra(lifetime: number, limiares: readonly number[]): number {
  let nivel = 1;
  for (let i = 1; i < limiares.length; i++) {
    const limiar = limiares[i];
    if (limiar !== undefined && lifetime >= limiar) nivel = i + 1;
    else break; // limiares crescentes: o primeiro não-atingido corta o resto
  }
  return nivel;
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
