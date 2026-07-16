/**
 * Arte por Gato Lendário — mapeia `LendarioDef.id` ao seu PNG (§4.6.7, ADR-0004).
 *
 * Fica na camada `ui/` (não em `data/`) porque os imports de asset são resolvidos pelo Vite no
 * bundle — mesmo padrão do `buildingArt.ts`. Lendários **sem arte própria** caem no **fallback**
 * (o emoji do `LendarioDef`), então o painel da Corte nunca quebra antes de gerarmos cada rosto.
 */

import empressJady from "../assets/legend_empress_jady.png";

const ART: Record<string, string> = {
  imperatriz_jady: empressJady,
};

/** PNG do Lendário, ou `undefined` se ele ainda não tem arte (a UI usa o emoji como fallback). */
export function artOfLendario(id: string): string | undefined {
  return ART[id];
}
