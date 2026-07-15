import { describe, it, expect } from "vitest";
import { CLICK_FACTOR } from "./constants";
import { peixesPorClique } from "./click";

describe("peixesPorClique", () => {
  it("base é uma fração da produção (CLICK_FACTOR), com piso de 1", () => {
    expect(peixesPorClique(100_000)).toBeCloseTo(100_000 * CLICK_FACTOR); // 1000
    expect(peixesPorClique(10)).toBe(1); // 10*0.01 = 0.1 -> piso 1
    expect(peixesPorClique(0)).toBe(1); // produção zero ainda dá o piso
  });

  it("cliqueMult (C1) multiplica o poder de clique", () => {
    expect(peixesPorClique(100_000, 3)).toBeCloseTo(100_000 * CLICK_FACTOR * 3);
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
