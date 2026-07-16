/**
 * Arte por Gato Lendário — mapeia `LendarioDef.id` ao seu PNG (§4.6.7, ADR-0004).
 *
 * Fica na camada `ui/` (não em `data/`) porque os imports de asset são resolvidos pelo Vite no
 * bundle — mesmo padrão do `buildingArt.ts`. Lendários **sem arte própria** caem no **fallback**
 * (o emoji do `LendarioDef`), então o painel da Corte nunca quebra antes de gerarmos cada rosto.
 */

import empressJady from "../assets/legend_empress_jady.png";
import princessHelena from "../assets/legend_princess_helena.png";
import schrodingerCat from "../assets/legend_schrodinger_cat.png";
import vortexGuardian from "../assets/legend_vortex_guardian.png";
import baronBigode from "../assets/legend_baron_bigode.png";

const ART: Record<string, string> = {
  imperatriz_jady: empressJady,
  princesa_helena: princessHelena,
  gato_schrodinger: schrodingerCat,
  guardiao_vortex: vortexGuardian,
  barao_bigode: baronBigode,
};

/** PNG do Lendário, ou `undefined` se ele ainda não tem arte (a UI usa o emoji como fallback). */
export function artOfLendario(id: string): string | undefined {
  return ART[id];
}
