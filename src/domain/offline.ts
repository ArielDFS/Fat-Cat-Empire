/**
 * Progresso offline — economia PURA (GAME_DESIGN.md §7).
 *
 * Não importa nada de `ui/`, `state/` nem `data/`. 100% testável.
 *
 *     ganho = prod_por_segundo * min(segundos_ausente, 8h) * 0.50
 *
 * Anti-relógio (§7): se o tempo ausente for negativo (relógio adiantado no save
 * e depois atrasado), o ganho é zero. Num single-player não vale fazer mais que isso.
 *
 * NOTA DE ESCOPO: `prodPorSegundo` deve chegar aqui **já efetivo** — com o bônus de
 * coroas, habilidades e evento embutidos (via `production.producaoPorSegundo`). Este
 * módulo NÃO reaplica coroas, para não contar o bônus duas vezes. Ver conversa da
 * grelha: o §11 rascunhou a assinatura com `coroas`, mas o §7 (spec real) não usa —
 * seguimos o §7.
 */

import { OFFLINE_RATE, OFFLINE_CAP_H } from "./constants";

const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_HORA = 3600;

export interface GanhoOffline {
  /** Peixes creditados pela ausência. */
  peixes: number;
  /** Segundos efetivamente considerados (já aplicado o teto de 8h). */
  segundosConsiderados: number;
  /** true se a ausência passou do teto de 8h (o modal avisa que foi capada). */
  foiCapado: boolean;
}

/**
 * Calcula o ganho de peixes por uma ausência.
 *
 * @param prodPorSegundo Produção efetiva por segundo no momento do save (≥ 0).
 * @param msAusente      Milissegundos ausente (`agora - ultimoSave`).
 */
export function calcularGanhoOffline(prodPorSegundo: number, msAusente: number): GanhoOffline {
  const tetoSegundos = OFFLINE_CAP_H * SEGUNDOS_POR_HORA;

  // Relógio pra trás ou ausência nula: nada a creditar.
  if (msAusente <= 0) {
    return { peixes: 0, segundosConsiderados: 0, foiCapado: false };
  }

  const segundosAusente = msAusente / MS_POR_SEGUNDO;
  const foiCapado = segundosAusente > tetoSegundos;
  const segundosConsiderados = Math.min(segundosAusente, tetoSegundos);
  const peixes = Math.max(0, prodPorSegundo) * segundosConsiderados * OFFLINE_RATE;

  return { peixes, segundosConsiderados, foiCapado };
}
