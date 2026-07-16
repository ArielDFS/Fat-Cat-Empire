/**
 * Janelas de Habilidades ativas (GAME_DESIGN.md §3.5).
 *
 * O domínio só sabe sobre instantes e multiplicadores: conteúdo, estado e interface ficam em
 * `data/`, `state/` e `ui/`. O fim da janela é exclusivo (`agora >= fim`): assim a transição para
 * recarga é determinística mesmo quando o loop chega exatamente no limite.
 */

export type EstadoHabilidadeAtiva = "disponivel" | "ativa" | "recarga";

/**
 * Determina se uma Habilidade está pronta, em sua janela de burst ou em recarga.
 * `terminoAtivoMs` pode faltar após hidratar: efeitos de clique nunca continuam offline.
 */
export function estadoDaHabilidadeAtiva(
  terminoAtivoMs: number | undefined,
  terminoRecargaMs: number | undefined,
  agoraMs: number,
): EstadoHabilidadeAtiva {
  if (terminoAtivoMs !== undefined && agoraMs < terminoAtivoMs) return "ativa";
  if (terminoRecargaMs !== undefined && agoraMs < terminoRecargaMs) return "recarga";
  return "disponivel";
}

/** Multiplicador de clique de uma janela ativa; fora dela, o elemento neutro é ×1. */
export function multiplicadorCliqueAtivo(
  multiplicador: number,
  terminoAtivoMs: number | undefined,
  agoraMs: number,
): number {
  return terminoAtivoMs !== undefined && agoraMs < terminoAtivoMs ? multiplicador : 1;
}
