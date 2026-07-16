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
  /** Era mais alta atingida na run (§4.5). Ausente em saves antigos → derivado do lifetime na store. */
  eraMaisAlta?: number;
  /** Selo Imperial concedido (§3.6). Ausente em saves antigos → false (prestígio nunca esteve ligado). */
  seloImperial?: boolean;
  /** Nº de Nova Dinastias fundadas (§6). Ausente em saves antigos → 0. */
  dinastias?: number;
  /** `Date.now()` do início da run atual (§6) — base da conquista "Dinastia Descartável" (§12). Ausente → agora. */
  runInicioTs?: number;
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

    // `eraMaisAlta` (§4.5) entrou depois: ausente/ inválido → undefined (a store deriva do lifetime).
    const eraMaisAlta =
      typeof data.eraMaisAlta === "number" && Number.isFinite(data.eraMaisAlta) && data.eraMaisAlta >= 1
        ? Math.floor(data.eraMaisAlta)
        : undefined;

    // `seloImperial` (§3.6) entrou depois: só aceita `true` explícito; qualquer outra coisa → undefined
    // (a store trata como false). Nenhum save antigo já concedeu o Selo, então nada se perde.
    const seloImperial = data.seloImperial === true ? true : undefined;

    // `dinastias` (§6) entrou depois: ausente/ inválido → undefined (a store trata como 0).
    const dinastias =
      typeof data.dinastias === "number" && Number.isFinite(data.dinastias) && data.dinastias >= 0
        ? Math.floor(data.dinastias)
        : undefined;

    // `runInicioTs` (§6) entrou depois: ausente/ inválido → undefined (a store carimba `agora`).
    const runInicioTs =
      typeof data.runInicioTs === "number" && Number.isFinite(data.runInicioTs)
        ? data.runInicioTs
        : undefined;

    return { ...(data as SaveData), habilidades, eraMaisAlta, seloImperial, dinastias, runInicioTs };
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
