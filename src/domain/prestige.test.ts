import { describe, it, expect } from "vitest";
import {
  coroasGanhasNaRun,
  podeFundarNovaDinastia,
  bonusGlobalDeCoroas,
  resumoNovaDinastia,
} from "./prestige";

describe("coroasGanhasNaRun", () => {
  it("bate exatamente a tabela do §6", () => {
    expect(coroasGanhasNaRun(1_000_000)).toBe(1);
    expect(coroasGanhasNaRun(4_000_000)).toBe(2);
    expect(coroasGanhasNaRun(25_000_000)).toBe(5);
    expect(coroasGanhasNaRun(100_000_000)).toBe(10);
  });

  it("é zero abaixo do primeiro milhão", () => {
    expect(coroasGanhasNaRun(999_999)).toBe(0);
    expect(coroasGanhasNaRun(0)).toBe(0);
  });

  it("trata entrada negativa (relógio/save corrompido) como zero", () => {
    expect(coroasGanhasNaRun(-5)).toBe(0);
  });

  it("faz floor (não arredonda pra cima) entre marcos", () => {
    // sqrt(3.9999e6 / 1e6) = sqrt(3.9999) ≈ 1.9999 -> floor 1
    expect(coroasGanhasNaRun(3_999_900)).toBe(1);
    // sqrt(8.9e6/1e6) = sqrt(8.9) ≈ 2.983 -> floor 2
    expect(coroasGanhasNaRun(8_900_000)).toBe(2);
  });

  it("é monotonicamente não-decrescente", () => {
    let anterior = 0;
    for (let m = 0; m <= 120; m += 3) {
      const atual = coroasGanhasNaRun(m * 1_000_000);
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });
});

describe("podeFundarNovaDinastia", () => {
  it("só libera a partir de 1 coroa", () => {
    expect(podeFundarNovaDinastia(999_999)).toBe(false);
    expect(podeFundarNovaDinastia(1_000_000)).toBe(true);
    expect(podeFundarNovaDinastia(50_000_000)).toBe(true);
  });
});

describe("bonusGlobalDeCoroas", () => {
  it("sem coroas o bônus é 1 (neutro)", () => {
    expect(bonusGlobalDeCoroas(0)).toBeCloseTo(1);
  });

  it("bate os bônus da tabela do §6", () => {
    expect(bonusGlobalDeCoroas(1)).toBeCloseTo(1.02);
    expect(bonusGlobalDeCoroas(5)).toBeCloseTo(1.1);
    expect(bonusGlobalDeCoroas(10)).toBeCloseTo(1.2);
  });

  it("clampa coroas negativas para não gerar bônus abaixo de 1", () => {
    expect(bonusGlobalDeCoroas(-3)).toBeCloseTo(1);
  });
});

describe("resumoNovaDinastia (tela de confirmação §6)", () => {
  it("mostra o antes-e-depois corretamente", () => {
    const r = resumoNovaDinastia(4_000_000, 3);
    expect(r.coroasGanhas).toBe(2);
    expect(r.coroasDepois).toBe(5);
    expect(r.multiplicadorAtual).toBeCloseTo(1.06); // 3 coroas
    expect(r.multiplicadorDepois).toBeCloseTo(1.1); // 5 coroas
  });

  it("quando a run não vale coroa, o resumo não muda nada", () => {
    const r = resumoNovaDinastia(500_000, 7);
    expect(r.coroasGanhas).toBe(0);
    expect(r.coroasDepois).toBe(7);
    expect(r.multiplicadorAtual).toBeCloseTo(r.multiplicadorDepois);
  });
});
