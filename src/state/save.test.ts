import { describe, it, expect, beforeEach } from "vitest";
import { carregarSave, gravarSave, limparSave, SAVE_VERSION } from "./save";
import { SELO_LENDARIO_ID } from "../data/legendaries";

const KEY = "fat-cat-empire:save";

/** Stub mínimo de localStorage (o ambiente de teste é `node`, sem Web Storage). */
function instalarLocalStorageStub() {
  const mapa = new Map<string, string>();
  const stub = {
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => void mapa.set(k, v),
    removeItem: (k: string) => void mapa.delete(k),
    clear: () => mapa.clear(),
  };
  (globalThis as { localStorage?: unknown }).localStorage = stub;
  return mapa;
}

let store: Map<string, string>;
beforeEach(() => {
  store = instalarLocalStorageStub();
});

describe("save v3 (Corte Lendária)", () => {
  it("round-trip: grava e carrega preservando gastos, coroas e Lendários", () => {
    gravarSave({
      peixes: 500,
      lifetime: 1_234,
      coroas: 3,
      gastos: 9_000,
      gatos: { caixa_papelao: 12, prefeitura_vira_lata: 1 },
      habilidades: ["caixa_papelao:m10"],
      recargasAtivasAte: { mare_de_peixe: 123_456 },
      lendarios: { [SELO_LENDARIO_ID]: 1, barao_bigode: 3 },
      ofertaDraft: ["garra_ouro"],
      rerollsFeitos: 2,
      eraMaxAtingida: 4,
      dinastias: 2,
      runInicioTs: 111,
    });
    const s = carregarSave()!;
    expect(s.versao).toBe(SAVE_VERSION);
    expect(s.gastos).toBe(9_000);
    expect(s.coroas).toBe(3);
    expect(s.gatos.prefeitura_vira_lata).toBe(1);
    expect(s.recargasAtivasAte).toEqual({ mare_de_peixe: 123_456 });
    expect(s.lendarios).toEqual({ [SELO_LENDARIO_ID]: 1, barao_bigode: 3 });
    expect(s.eraMaxAtingida).toBe(4);
    expect(s.dinastias).toBe(2);
  });

  it("gastos ausente/ inválido → 0 (defensivo)", () => {
    store.set(KEY, JSON.stringify({ versao: 3, ts: 1, peixes: 0, lifetime: 0, coroas: 0, gatos: {} }));
    expect(carregarSave()!.gastos).toBe(0);
  });

  it("versão desconhecida (futura) → descarta", () => {
    store.set(KEY, JSON.stringify({ versao: 99, ts: 1, peixes: 0, lifetime: 0, coroas: 0, gatos: {} }));
    expect(carregarSave()).toBeNull();
  });
});

describe("migração em cadeia v1 → v2 → v3 (ADR-0003 + ADR-0004)", () => {
  it("v1: semeia gastos ≈ lifetime, descarta eraMaisAlta e converte o Selo no Lendário #0", () => {
    // Um save v1 típico (modelo lifetime): tinha eraMaisAlta e seloImperial, não tinha gastos.
    store.set(
      KEY,
      JSON.stringify({
        versao: 1,
        ts: 1,
        peixes: 250,
        lifetime: 4_000_000,
        coroas: 2,
        gatos: { caixa_papelao: 40 },
        habilidades: ["caixa_papelao:m10"],
        eraMaisAlta: 3,
        seloImperial: true,
        dinastias: 1,
        runInicioTs: 777,
      }),
    );
    const s = carregarSave()!;
    expect(s.versao).toBe(SAVE_VERSION); // 3
    expect(s.gastos).toBe(4_000_000); // gastos ≈ lifetime (preserva o progresso de prestígio)
    expect((s as unknown as Record<string, unknown>).eraMaisAlta).toBeUndefined(); // descartado
    expect(s.lendarios).toEqual({ [SELO_LENDARIO_ID]: 1 }); // Selo → Lendário #0
    expect(s.peixes).toBe(250); // recursos preservados
    expect(s.coroas).toBe(2);
    expect(s.dinastias).toBe(1);
  });

  it("v2 → v3: sem Selo, os Lendários começam vazios", () => {
    store.set(
      KEY,
      JSON.stringify({ versao: 2, ts: 1, peixes: 0, lifetime: 0, coroas: 5, gastos: 100, gatos: {} }),
    );
    const s = carregarSave()!;
    expect(s.versao).toBe(SAVE_VERSION);
    expect(s.coroas).toBe(5);
    expect(s.lendarios).toEqual({});
  });
});

describe("limparSave", () => {
  it("remove o save", () => {
    gravarSave({ peixes: 1, lifetime: 1, coroas: 0, gastos: 0, gatos: {}, habilidades: [] });
    limparSave();
    expect(carregarSave()).toBeNull();
  });
});
