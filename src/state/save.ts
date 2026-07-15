/**
 * Save/load em LocalStorage (GAME_DESIGN.md §7, §9 — "Save: LocalStorage").
 *
 * A serialização mora em `state/`, não em `domain/`: o formato do save é detalhe de
 * aplicação, não de economia. A matemática do ganho offline continua pura em
 * `domain/offline.ts`. Este módulo só lê/grava e valida o formato.
 *
 * Tudo é defensivo: LocalStorage pode estar cheio, desligado (aba privada) ou com um
 * save de versão antiga/corrompido. Em qualquer falha, o jogo começa do zero em vez de
 * quebrar — perder um save nunca deve travar a inicialização.
 */

const SAVE_KEY = "fat-cat-empire:save";

/** Bump quando o formato de `SaveData` mudar de forma incompatível (migração entra em `carregarSave`). */
export const SAVE_VERSION = 1;

export interface SaveData {
  versao: number;
  /** `Date.now()` no momento da gravação — base do cálculo de ausência (§7). */
  ts: number;
  peixes: number;
  lifetime: number;
  coroas: number;
  gatos: Record<string, number>;
  /** Ids das Habilidades passivas compradas na run (§3.4). Ausente em saves v0.3 → []. */
  habilidades: string[];
}

/** O que a store fornece; `versao` e `ts` são carimbados aqui. */
export type SavePayload = Omit<SaveData, "versao" | "ts">;

export function gravarSave(payload: SavePayload): void {
  try {
    const save: SaveData = { versao: SAVE_VERSION, ts: Date.now(), ...payload };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // LocalStorage indisponível/cheio: não é fatal, só não persiste desta vez.
  }
}

export function carregarSave(): SaveData | null {
  try {
    const cru = localStorage.getItem(SAVE_KEY);
    if (!cru) return null;

    const data = JSON.parse(cru) as Partial<SaveData>;

    // Versão diferente: descarta (o slot de migração futura entra aqui).
    if (data.versao !== SAVE_VERSION) return null;

    const ok =
      typeof data.ts === "number" &&
      typeof data.peixes === "number" &&
      typeof data.lifetime === "number" &&
      typeof data.coroas === "number" &&
      typeof data.gatos === "object" &&
      data.gatos !== null;
    if (!ok) return null;

    // `habilidades` (§3.4) entrou depois: saves anteriores não têm o campo → default [].
    // Aceita só strings; a store descarta ids desconhecidos (normalizarHabilidades).
    const habilidades = Array.isArray(data.habilidades)
      ? data.habilidades.filter((x): x is string => typeof x === "string")
      : [];

    return { ...(data as SaveData), habilidades };
  } catch {
    return null; // JSON corrompido ou LocalStorage inacessível.
  }
}

export function limparSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* nada a fazer */
  }
}

/** Salva a cada 15 s (pega o progresso da run mesmo se o jogo travar). */
const AUTO_SAVE_MS = 15_000;

/**
 * Liga o auto-save: intervalo periódico + salva ao esconder a aba e ao sair.
 * Segue o padrão de `core/loop.ts`: devolve uma função para desligar.
 */
export function iniciarAutoSave(salvar: () => void): () => void {
  const id = window.setInterval(salvar, AUTO_SAVE_MS);
  const aoEsconder = () => {
    if (document.visibilityState === "hidden") salvar();
  };
  document.addEventListener("visibilitychange", aoEsconder);
  window.addEventListener("beforeunload", salvar);

  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", aoEsconder);
    window.removeEventListener("beforeunload", salvar);
  };
}
