import { describe, it, expect } from "vitest";
import { eraDeObras, lumpDaEra } from "./era";

describe("eraDeObras (§4.6.9)", () => {
  it("zero Obras construídas é a Era 1 (o início do Beco)", () => {
    expect(eraDeObras(0)).toBe(1);
  });

  it("cada Obra construída sobe um degrau", () => {
    expect(eraDeObras(1)).toBe(2);
    expect(eraDeObras(2)).toBe(3);
    expect(eraDeObras(5)).toBe(6);
  });

  it("construir a última Obra do slice aponta para uma Era além (o chamador clampa)", () => {
    expect(eraDeObras(6)).toBe(7);
  });

  it("entrada negativa/inválida (save corrompido) nunca cai abaixo da Era 1", () => {
    expect(eraDeObras(-3)).toBe(1);
    expect(eraDeObras(-1)).toBe(1);
  });

  it("trunca frações (contagem sempre inteira)", () => {
    expect(eraDeObras(2.9)).toBe(3);
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
