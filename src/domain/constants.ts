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

/** Escala da fórmula de coroas do prestígio. */
export const PRESTIGE_DIVISOR = 1e6;

/** Bônus de produção global por coroa (+2%). */
export const CROWN_BONUS = 0.02;
