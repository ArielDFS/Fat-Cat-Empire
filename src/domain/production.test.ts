import { describe, it, expect } from "vitest";
import { CROWN_BONUS } from "./constants";
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

describe("multiplicadorGlobal", () => {
  it("sem coroas nem bônus, o multiplicador é 1", () => {
    expect(multiplicadorGlobal(0)).toBeCloseTo(1);
  });

  it("cada coroa soma CROWN_BONUS de forma aditiva", () => {
    expect(multiplicadorGlobal(10)).toBeCloseTo(1 + CROWN_BONUS * 10); // 1.2
    expect(multiplicadorGlobal(1)).toBeCloseTo(1.02);
  });

  it("habilidades globais e evento multiplicam por fora", () => {
    // (1 + 0.02*5) * 1.5 * 7 = 1.1 * 1.5 * 7 = 11.55
    expect(multiplicadorGlobal(5, 1.5, 7)).toBeCloseTo(11.55);
  });

  it("respeita a ordem aditiva-dentro / multiplicativa-fora", () => {
    // Se fosse tudo aditivo daria 1 + 0.02*5 + 0.5 = 1.6; o correto é 1.1 * 1.5 = 1.65.
    expect(multiplicadorGlobal(5, 1.5)).toBeCloseTo(1.65);
    expect(multiplicadorGlobal(5, 1.5)).not.toBeCloseTo(1.6);
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
    // base = 7 ; global com 10 coroas = 1.2 -> 8.4
    expect(producaoPorSegundo(predios, 10)).toBeCloseTo(8.4);
  });

  it("é equivalente a chamar producaoTotal com multiplicadorGlobal", () => {
    const predios = [{ prodPorGato: 47, qtdGatos: 12, habilidadesPassivasMult: 4 }];
    const esperado = producaoTotal(predios, multiplicadorGlobal(3, 1.5, 7));
    expect(producaoPorSegundo(predios, 3, 1.5, 7)).toBeCloseTo(esperado);
  });
});
