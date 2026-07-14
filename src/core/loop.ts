/**
 * Game loop — dispara `tick` por delta de tempo REAL (GAME_DESIGN.md §9, §3.1).
 *
 * A produção roda por tempo decorrido, não por contagem de ticks: se um frame
 * atrasar, o próximo credita o intervalo maior. O clamp evita saltos absurdos
 * quando a aba volta do background (o ganho de background de verdade é o sistema
 * offline do passo 4, não este loop).
 */

import { TICK_MS } from "../domain/constants";
import { useGame } from "../state/store";

const CLAMP_DT_S = 0.5;

/** Inicia o loop e devolve uma função para pará-lo. */
export function iniciarLoop(): () => void {
  let ultimo = performance.now();
  const id = window.setInterval(() => {
    const agora = performance.now();
    const dt = Math.min((agora - ultimo) / 1000, CLAMP_DT_S);
    ultimo = agora;
    useGame.getState().tick(dt);
  }, TICK_MS);
  return () => window.clearInterval(id);
}
