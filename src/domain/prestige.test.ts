import { describe, it, expect } from "vitest";
import { coroasGanhasNaRun, podeFundarNovaDinastia, resumoNovaDinastia } from "./prestige";
import { PRESTIGE_DIVISOR } from "./constants";

// coroas = floor(cbrt(gastos / DIVISOR)). DIVISOR = 1e4 (v0.7).
describe("coroasGanhasNaRun (§6, ADR-0004: raiz cúbica)", () => {
  it("é o cubo perfeito na escala do DIVISOR", () => {
    expect(coroasGanhasNaRun(1 * PRESTIGE_DIVISOR)).toBe(1); // cbrt(1)=1
    expect(coroasGanhasNaRun(8 * PRESTIGE_DIVISOR)).toBe(2); // cbrt(8)=2
    expect(coroasGanhasNaRun(27 * PRESTIGE_DIVISOR)).toBe(3);
    expect(coroasGanhasNaRun(1000 * PRESTIGE_DIVISOR)).toBe(10);
  });

  it("é zero abaixo do primeiro DIVISOR de gastos", () => {
    expect(coroasGanhasNaRun(PRESTIGE_DIVISOR - 1)).toBe(0);
    expect(coroasGanhasNaRun(0)).toBe(0);
  });

  it("trata entrada negativa (save corrompido) como zero", () => {
    expect(coroasGanhasNaRun(-5)).toBe(0);
  });

  it("faz floor entre cubos", () => {
    // cbrt(26.9) ≈ 2,997 -> floor 2
    expect(coroasGanhasNaRun(26.9 * PRESTIGE_DIVISOR)).toBe(2);
    // cbrt(7.9) ≈ 1,99 -> floor 1
    expect(coroasGanhasNaRun(7.9 * PRESTIGE_DIVISOR)).toBe(1);
  });

  it("é monotonicamente não-decrescente", () => {
    let anterior = 0;
    for (let k = 0; k <= 1200; k += 30) {
      const atual = coroasGanhasNaRun(k * PRESTIGE_DIVISOR);
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });
});

describe("podeFundarNovaDinastia", () => {
  it("só libera a partir de 1 coroa", () => {
    expect(podeFundarNovaDinastia(PRESTIGE_DIVISOR - 1)).toBe(false);
    expect(podeFundarNovaDinastia(PRESTIGE_DIVISOR)).toBe(true);
    expect(podeFundarNovaDinastia(1000 * PRESTIGE_DIVISOR)).toBe(true);
  });
});

describe("resumoNovaDinastia (tela de confirmação §6)", () => {
  it("mostra as coroas que entram e o total depois", () => {
    const r = resumoNovaDinastia(8 * PRESTIGE_DIVISOR, 3); // ganha 2
    expect(r.coroasGanhas).toBe(2);
    expect(r.coroasDepois).toBe(5);
  });

  it("quando a run não vale coroa, o resumo não muda o total", () => {
    const r = resumoNovaDinastia(PRESTIGE_DIVISOR - 1, 7);
    expect(r.coroasGanhas).toBe(0);
    expect(r.coroasDepois).toBe(7);
  });
});
