/**
 * Constantes econômicas globais — GAME_DESIGN.md §3.1 `[TRAVADO]`.
 *
 * Regra de ouro (§11): nenhum número mágico espalhado pelo código. Todo valor de
 * balanceamento nasce aqui ou em `src/data/`. Mudar qualquer `[TRAVADO]` exige
 * decisão registrada no changelog do GAME_DESIGN.md.
 */

/** Passo do game loop, em milissegundos. A lógica roda por delta real, não por contagem de ticks. */
export const TICK_MS = 100;

/** Crescimento exponencial do custo por gato comprado num prédio. */
export const COST_GROWTH = 1.15;

/** Peixes por clique = produção/segundo × isto (com piso de 1). */
export const CLICK_FACTOR = 0.01;

/** Fração da produção normal creditada enquanto ausente. */
export const OFFLINE_RATE = 0.5;

/** Teto de horas de produção offline acumulada. */
export const OFFLINE_CAP_H = 8;

/**
 * Escala da fórmula de coroas do prestígio: `coroas = floor(cbrt(gastos / DIVISOR))` (§6, ADR-0004).
 * Baixado de 1e6→1e4 na v0.7: com a raiz cúbica e a curva suave, 1e4 dá ~3 coroas numa run 1 curta
 * (o bastante pra começar a Corte Lendária). Balanceamento (§8), sintoniza o nº de dinastias.
 */
export const PRESTIGE_DIVISOR = 1e4;
