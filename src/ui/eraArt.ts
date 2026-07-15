/**
 * Mapeamento Era → mundo de fundo (GAME_DESIGN.md §4.6.5). Vive em `ui/` porque importa assets
 * (como `buildingArt.ts`); `data/eras.ts` fica puro.
 *
 * Modelo visual (§4.6.5): cada Era = **1 fundo bespoke** que troca o mundo inteiro ao cruzar. Só
 * a Era 1 tem asset gerado (`sky_beco.png`); as demais caem no fallback até a arte existir (o
 * pipeline gera uma imagem por Era — ver [[art-pipeline]]). Quando um novo `sky_*` chegar, é só
 * registrá-lo aqui por nível.
 */

import skyBeco from "../assets/sky_beco.png";
import skyVila from "../assets/cat_village.png";
import skyCidade from "../assets/cat_city.png";
import skyMetropole from "../assets/cat_metropole.png";
import skyImperio from "../assets/cat_empire.png";
import skyGalaxia from "../assets/cat_galaxy_empire.png";

// Nível da Era (data/eras.ts) → céu. Os arquivos vieram nomeados com prefixo `cat_` (nome livre,
// mapeado aqui, ART_STYLE §7): apesar do prefixo, são os fundos de mundo, não sprites de gato.
const SKY_POR_NIVEL: Record<number, string> = {
  1: skyBeco, // Beco Esquecido
  2: skyVila, // Vila do Ronrom
  3: skyCidade, // Gatópolis
  4: skyMetropole, // Miadópolis
  5: skyImperio, // Império dos Bigodes
  6: skyGalaxia, // Via-Láctea Felina
};

/** Fundo do mundo para uma Era; fallback no céu do Beco enquanto os demais assets não existem. */
export function skyDaEra(nivel: number): string {
  return SKY_POR_NIVEL[nivel] ?? skyBeco;
}
