import { describe, it, expect } from "vitest";
import { nivelDaEra, lumpDaEra } from "./era";

// Escada de teste com a forma da real (§4.5): crescente, começando em 0.
const LIMIARES = [0, 1_500, 8_000, 40_000, 120_000, 600_000];

describe("nivelDaEra (§4.5)", () => {
  it("lifetime 0 é a Era 1 (o início)", () => {
    expect(nivelDaEra(0, LIMIARES)).toBe(1);
  });

  it("no limiar exato já conta como a Era nova (>=)", () => {
    expect(nivelDaEra(1_500, LIMIARES)).toBe(2);
    expect(nivelDaEra(8_000, LIMIARES)).toBe(3);
    expect(nivelDaEra(600_000, LIMIARES)).toBe(6);
  });

  it("logo abaixo do limiar ainda é a Era anterior", () => {
    expect(nivelDaEra(1_499, LIMIARES)).toBe(1);
    expect(nivelDaEra(119_999, LIMIARES)).toBe(4);
  });

  it("acima do último limiar satura na última Era", () => {
    expect(nivelDaEra(9e15, LIMIARES)).toBe(6);
  });

  it("entrada negativa (relógio/save corrompido) nunca cai abaixo da Era 1", () => {
    expect(nivelDaEra(-999, LIMIARES)).toBe(1);
  });

  it("é monotonicamente não-decrescente conforme o lifetime cresce", () => {
    let anterior = 0;
    for (let lt = 0; lt <= 700_000; lt += 2_500) {
      const atual = nivelDaEra(lt, LIMIARES);
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });
});

describe("lumpDaEra (§4.5)", () => {
  it("vale ~segundos da produção quando a produção domina o piso", () => {
    expect(lumpDaEra(100, 30, 50)).toBe(3_000); // 100/s × 30 s = 3000 > piso
  });

  it("cai no piso quando a produção é ínfima (cedo)", () => {
    expect(lumpDaEra(0, 30, 50)).toBe(50);
    expect(lumpDaEra(1, 30, 50)).toBe(50); // 30 < 50 → piso
  });

  it("nunca é um multiplicador — é só a maior das duas parcelas", () => {
    expect(lumpDaEra(2, 30, 50)).toBe(60); // 2×30=60 > 50
  });

  it("clampa produção e segundos negativos a 0 (nunca lump negativo)", () => {
    expect(lumpDaEra(-100, 30, 50)).toBe(50);
    expect(lumpDaEra(100, -30, 50)).toBe(50);
    expect(lumpDaEra(-1, -1, -1)).toBe(0);
  });
});
