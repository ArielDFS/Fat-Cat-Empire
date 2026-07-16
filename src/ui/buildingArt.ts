/**
 * Arte por prédio — mapeia cada `Building.id` aos seus PNGs (ícone, fundo de lane, gato).
 *
 * Fica na camada `ui/` (não em `data/`, que é só dados) porque os imports de asset são
 * resolvidos pelo Vite no bundle. Prédios ainda sem arte caem no FALLBACK — assim a cascata
 * de desbloqueio (banco) não quebra antes de gerarmos os assets dele.
 */

import cardbox from "../assets/cardbox.png";
import laneCardbox from "../assets/lane_cardbox.png";
import catRua from "../assets/cat_rua.png";
import fishingBarrack from "../assets/fishing_barrack.png";
import laneFishingBarrack from "../assets/lane_fishing_barrack.png";
import catFishSeller from "../assets/cat_fish_seller.png";
import market from "../assets/market.png";
import laneMarket from "../assets/lane_market.png";
import catFeirante from "../assets/cat_feirante.png";
import pier from "../assets/pier.png";
import laneFishingPier from "../assets/lane_fishing_pier.png";
import catFisher from "../assets/cat_fisher.png";
import lataoGourmet from "../assets/latao_gourmet.png";
import laneLataoGourmet from "../assets/lane_latao_gourmet.png";
import catCatador from "../assets/cat_catador.png";

export interface BuildingArt {
  /** Ícone do prédio (lado esquerdo da lane). */
  icone: string;
  /** Fundo tileável da lane. */
  lane: string;
  /** Sprite do gato-tipo (repetido no enxame). */
  gato: string;
}

const ART: Record<string, BuildingArt> = {
  caixa_papelao: { icone: cardbox, lane: laneCardbox, gato: catRua },
  barraca_peixe: { icone: fishingBarrack, lane: laneFishingBarrack, gato: catFishSeller },
  miaurcado: { icone: market, lane: laneMarket, gato: catFeirante },
  pier_pesca: { icone: pier, lane: laneFishingPier, gato: catFisher },
  latao_gourmet: { icone: lataoGourmet, lane: laneLataoGourmet, gato: catCatador },
};

/** Prédios sem arte própria reusam a Caixa até termos os PNGs. */
const FALLBACK: BuildingArt = { icone: cardbox, lane: laneCardbox, gato: catRua };

export function artOf(buildingId: string): BuildingArt {
  return ART[buildingId] ?? FALLBACK;
}
