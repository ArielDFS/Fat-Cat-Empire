import { describe, it, expect } from "vitest";
import { CLICK_FACTOR } from "./constants";
import { fatorDaCadenciaClique, proximaCadenciaClique, peixesPorClique } from "./click";

describe("peixesPorClique", () => {
  it("base é uma fração da produção (CLICK_FACTOR), com piso de 1", () => {
    expect(peixesPorClique(100_000)).toBeCloseTo(100_000 * CLICK_FACTOR); // 1000
    expect(peixesPorClique(10)).toBe(1); // 10*0.01 = 0.1 -> piso 1
    expect(peixesPorClique(0)).toBe(1); // produção zero ainda dá o piso
  });

  it("cliqueMult (C1) multiplica o poder de clique", () => {
    expect(peixesPorClique(100_000, 3)).toBeCloseTo(100_000 * CLICK_FACTOR * 3);
    expect(peixesPorClique(0, 1.5)).toBeCloseTo(1.5); // o piso nÃ£o apaga o bÃ´nus no bootstrap
  });

  it("colheita (C2) soma ao CLICK_FACTOR efetivo", () => {
    // fator vira 0.01 + 0.02 = 0.03
    expect(peixesPorClique(100_000, 1, 0.02)).toBeCloseTo(100_000 * (CLICK_FACTOR + 0.02));
  });

  it("C1 e C2 se aplicam juntos", () => {
    expect(peixesPorClique(100_000, 2, 0.03)).toBeCloseTo(100_000 * (CLICK_FACTOR + 0.03) * 2);
  });

  it("escala com a produção — nunca fica obsoleto (ADR-0002)", () => {
    const pouca = peixesPorClique(1_000);
    const muita = peixesPorClique(1_000_000);
    expect(muita).toBeCloseTo(pouca * 1000); // cresce proporcional à produção
  });
});

describe("fatorDaCadenciaClique", () => {
  it("mantém cliques em ritmo humano integrais e reduz os excedentes suavemente", () => {
    expect(fatorDaCadenciaClique(0)).toBe(1);
    expect(fatorDaCadenciaClique(8)).toBe(1);
    expect(fatorDaCadenciaClique(9)).toBeCloseTo(0.8);
    expect(fatorDaCadenciaClique(10)).toBeCloseTo(0.64);
  });

  it("satura o ganho acumulado de uma rajada extrema", () => {
    const totalEquivalente = Array.from({ length: 1_000 }, (_, i) => fatorDaCadenciaClique(i + 1)).reduce(
      (total, fator) => total + fator,
      0,
    );
    expect(totalEquivalente).toBeCloseTo(12);
  });
});

describe("proximaCadenciaClique", () => {
  it("drena a cadência na taxa humana antes de registrar o novo clique", () => {
    expect(proximaCadenciaClique(8, 125)).toBeCloseTo(8); // −1 pelo tempo +1 do clique
    expect(proximaCadenciaClique(9, 1_000)).toBeCloseTo(2); // a rajada drenou; só sobram os dois cliques recentes
  });
});
