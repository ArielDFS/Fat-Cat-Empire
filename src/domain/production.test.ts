import { describe, it, expect } from "vitest";
import {
  producaoDoPredio,
  multiplicadorGlobal,
  producaoTotal,
  producaoPorSegundo,
} from "./production";

describe("producaoDoPredio", () => {
  it("multiplica produção por gato × quantidade", () => {
    expect(producaoDoPredio(0.1, 10)).toBeCloseTo(1);
    expect(producaoDoPredio(47, 3)).toBeCloseTo(141);
  });

  it("aplica o multiplicador de habilidades passivas", () => {
    expect(producaoDoPredio(1, 5, 2)).toBeCloseTo(10);
    expect(producaoDoPredio(1, 5, 16)).toBeCloseTo(80); // teto ×16 do slice
  });

  it("prédio sem gatos não produz nada", () => {
    expect(producaoDoPredio(999, 0)).toBe(0);
  });
});

describe("multiplicadorGlobal (ADR-0004: tudo multiplicativo)", () => {
  it("sem Lendários nem evento, o multiplicador é 1", () => {
    expect(multiplicadorGlobal()).toBeCloseTo(1);
    expect(multiplicadorGlobal(1, 1)).toBeCloseTo(1);
  });

  it("produção dos Lendários × evento (multiplicativo)", () => {
    expect(multiplicadorGlobal(1.5)).toBeCloseTo(1.5); // só Selo #0
    expect(multiplicadorGlobal(1.5, 7)).toBeCloseTo(10.5); // Selo × Festival ×7
    expect(multiplicadorGlobal(3, 2)).toBeCloseTo(6);
  });
});

describe("producaoTotal", () => {
  it("soma os prédios e aplica o multiplicador global", () => {
    const predios = [
      { prodPorGato: 0.1, qtdGatos: 10 }, // 1
      { prodPorGato: 1, qtdGatos: 5 }, //    5
    ];
    expect(producaoTotal(predios, 1)).toBeCloseTo(6);
    expect(producaoTotal(predios, 2)).toBeCloseTo(12);
  });

  it("lista vazia produz zero", () => {
    expect(producaoTotal([], 5)).toBe(0);
  });

  it("usa mult 1 quando o prédio não tem habilidades passivas", () => {
    const semMult = [{ prodPorGato: 8, qtdGatos: 25 }];
    const comMult1 = [{ prodPorGato: 8, qtdGatos: 25, habilidadesPassivasMult: 1 }];
    expect(producaoTotal(semMult, 1)).toBe(producaoTotal(comMult1, 1));
  });
});

describe("producaoPorSegundo (composição)", () => {
  it("compõe produção dos prédios com o multiplicador global", () => {
    const predios = [
      { prodPorGato: 0.1, qtdGatos: 10, habilidadesPassivasMult: 2 }, // 2
      { prodPorGato: 1, qtdGatos: 5 }, //                                5
    ];
    // base = 7 ; Lendários de produção ×1,5 -> 10,5
    expect(producaoPorSegundo(predios, 1.5)).toBeCloseTo(10.5);
  });

  it("é equivalente a chamar producaoTotal com multiplicadorGlobal", () => {
    const predios = [{ prodPorGato: 47, qtdGatos: 12, habilidadesPassivasMult: 4 }];
    const esperado = producaoTotal(predios, multiplicadorGlobal(1.5, 7));
    expect(producaoPorSegundo(predios, 1.5, 7)).toBeCloseTo(esperado);
  });
});
