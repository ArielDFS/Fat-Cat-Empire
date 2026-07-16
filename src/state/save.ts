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

/**
 * Bump quando o formato de `SaveData` mudar de forma incompatível (migração entra em `carregarSave`).
 * v2 (2026-07-16, migração do motor v0.6/ADR-0003): +`gastos` (base do prestígio), −`eraMaisAlta`
 * (a Era passou a derivar de `gatos`). Saves v1 são migrados (não descartados) — ver `migrarV1paraV2`.
 */
export const SAVE_VERSION = 2;

export interface SaveData {
  versao: number;
  /** `Date.now()` no momento da gravação — base do cálculo de ausência (§7). */
  ts: number;
  peixes: number;
  /** Peixes já produzidos na run. Vitrine only (§4.6.9) — dirige zero mecânicas. */
  lifetime: number;
  coroas: number;
  /** Peixes GASTOS na run (gatos + passivas + Obras) — base do prestígio na v0.6 (§6). */
  gastos: number;
  gatos: Record<string, number>;
  /** Ids das Habilidades passivas compradas na run (§3.4). Ausente em saves v0.3 → []. */
  habilidades: string[];
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

/**
 * Migra um save v1 (modelo `lifetime`) para o formato v2 (motor v0.6). Preserva recursos e gatos;
 * **semeia `gastos ≈ lifetime`** (ADR-0003: "gastos ≈ produção"), o que aproxima o progresso de
 * prestígio do jogador. Descarta `eraMaisAlta` — a Era re-deriva das Obras em `gatos` (que na v1
 * ainda não existiam como prédios, então uma run v1 volta ao Beco visualmente; os recursos ficam).
 */
function migrarV1paraV2(v1: Record<string, unknown>): Record<string, unknown> {
  const lifetime = typeof v1.lifetime === "number" && v1.lifetime > 0 ? v1.lifetime : 0;
  const { eraMaisAlta: _descartado, ...resto } = v1;
  return { ...resto, versao: SAVE_VERSION, gastos: lifetime };
}

export function carregarSave(): SaveData | null {
  try {
    const cru = localStorage.getItem(SAVE_KEY);
    if (!cru) return null;

    let data = JSON.parse(cru) as Partial<SaveData> & Record<string, unknown>;

    // Migração de versão: v1 → v2 (motor v0.6). Outras versões desconhecidas → descarta.
    if (data.versao === 1) data = migrarV1paraV2(data) as typeof data;
    if (data.versao !== SAVE_VERSION) return null;

    const ok =
      typeof data.ts === "number" &&
      typeof data.peixes === "number" &&
      typeof data.lifetime === "number" &&
      typeof data.coroas === "number" &&
      typeof data.gatos === "object" &&
      data.gatos !== null;
    if (!ok) return null;

    // `habilidades` (§3.4): aceita só strings; a store descarta ids desconhecidos (normalizarHabilidades).
    const habilidades = Array.isArray(data.habilidades)
      ? data.habilidades.filter((x): x is string => typeof x === "string")
      : [];

    // `gastos` (§6, v0.6): base do prestígio. Ausente/inválido → 0 (defensivo).
    const gastos =
      typeof data.gastos === "number" && Number.isFinite(data.gastos) && data.gastos >= 0
        ? data.gastos
        : 0;

    // `seloImperial` (§3.6): só aceita `true` explícito; qualquer outra coisa → undefined
    // (a store trata como false). Nenhum save antigo já concedeu o Selo, então nada se perde.
    const seloImperial = data.seloImperial === true ? true : undefined;

    // `dinastias` (§6): ausente/ inválido → undefined (a store trata como 0).
    const dinastias =
      typeof data.dinastias === "number" && Number.isFinite(data.dinastias) && data.dinastias >= 0
        ? Math.floor(data.dinastias)
        : undefined;

    // `runInicioTs` (§6): ausente/ inválido → undefined (a store carimba `agora`).
    const runInicioTs =
      typeof data.runInicioTs === "number" && Number.isFinite(data.runInicioTs)
        ? data.runInicioTs
        : undefined;

    return { ...(data as SaveData), habilidades, gastos, seloImperial, dinastias, runInicioTs };
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
