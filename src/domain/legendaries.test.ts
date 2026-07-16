import { describe, it, expect } from "vitest";
import {
  buffNoNivel,
  multiplicadoresLendarios,
  custoSubirNivel,
  custoRecrutar,
  custoReroll,
  sortearOferta,
  PISO_CUSTO,
  type EfeitoAtivo,
} from "./legendaries";

describe("buffNoNivel (§4.6.7)", () => {
  it("nível 0 (não recrutado) é neutro (1) em qualquer papel", () => {
    expect(buffNoNivel("producaoMult", 1.15, 0)).toBe(1);
    expect(buffNoNivel("custoReducao", 0.03, 0)).toBe(1);
  });

  it("papéis de bônus são compostos: porNivel^nivel", () => {
    expect(buffNoNivel("producaoMult", 1.15, 1)).toBeCloseTo(1.15);
    expect(buffNoNivel("producaoMult", 1.15, 3)).toBeCloseTo(1.15 ** 3);
    expect(buffNoNivel("cliqueMult", 1.2, 2)).toBeCloseTo(1.44);
  });

  it("custoReducao é multiplicador de custo (1−r)^nivel, clampado ao piso", () => {
    expect(buffNoNivel("custoReducao", 0.03, 1)).toBeCloseTo(0.97);
    expect(buffNoNivel("custoReducao", 0.1, 2)).toBeCloseTo(0.81);
    // Muitos níveis: nunca abaixo do piso (custo nunca vira ~grátis).
    expect(buffNoNivel("custoReducao", 0.5, 100)).toBe(PISO_CUSTO);
  });

  it("trunca nível fracionário e clampa negativo", () => {
    expect(buffNoNivel("producaoMult", 2, 2.9)).toBeCloseTo(4);
    expect(buffNoNivel("producaoMult", 2, -5)).toBe(1);
  });
});

describe("multiplicadoresLendarios (§4.6.7)", () => {
  it("sem Lendários, tudo é 1", () => {
    const m = multiplicadoresLendarios([]);
    expect(m).toEqual({ producao: 1, clique: 1, offline: 1, lump: 1, custoGatos: 1 });
  });

  it("combina por eixo (produção multiplica produção, clique multiplica clique)", () => {
    const efeitos: EfeitoAtivo[] = [
      { tipo: "producaoMult", porNivel: 1.5, nivel: 1 }, // Selo ×1,5
      { tipo: "producaoMult", porNivel: 1.15, nivel: 2 }, // ×1,3225
      { tipo: "cliqueMult", porNivel: 1.2, nivel: 1 },
      { tipo: "custoReducao", porNivel: 0.03, nivel: 1 },
    ];
    const m = multiplicadoresLendarios(efeitos);
    expect(m.producao).toBeCloseTo(1.5 * 1.15 ** 2);
    expect(m.clique).toBeCloseTo(1.2);
    expect(m.custoGatos).toBeCloseTo(0.97);
    expect(m.offline).toBe(1);
    expect(m.lump).toBe(1);
  });

  it("ignora Lendários no nível 0", () => {
    const m = multiplicadoresLendarios([{ tipo: "producaoMult", porNivel: 1.5, nivel: 0 }]);
    expect(m.producao).toBe(1);
  });
});

describe("custos em Coroas", () => {
  it("subir nível: base × growth^nivelAtual", () => {
    expect(custoSubirNivel(0, 2, 1.4)).toBe(2); // recrutar → nível 1
    expect(custoSubirNivel(1, 2, 1.4)).toBe(Math.ceil(2 * 1.4));
    expect(custoSubirNivel(3, 2, 1.4)).toBe(Math.ceil(2 * 1.4 ** 3));
  });

  it("recrutar cresce com a coleção", () => {
    expect(custoRecrutar(0, 2, 1.5)).toBe(2);
    expect(custoRecrutar(3, 2, 1.5)).toBe(Math.ceil(2 * 1.5 ** 3));
  });

  it("reroll sobe a cada reroll (piso anti-treadmill)", () => {
    expect(custoReroll(0, 1, 1.6)).toBe(1);
    expect(custoReroll(2, 1, 1.6)).toBe(Math.ceil(1.6 ** 2));
  });
});

describe("sortearOferta (draft)", () => {
  it("devolve k ids distintos do pool", () => {
    const pool = ["a", "b", "c", "d", "e"];
    const rng = mockRng([0, 0, 0]); // sempre pega o primeiro do que resta
    const oferta = sortearOferta(pool, 3, rng);
    expect(oferta).toEqual(["a", "b", "c"]);
    expect(new Set(oferta).size).toBe(3); // distintos
  });

  it("se o pool tem menos que k, devolve todos", () => {
    const oferta = sortearOferta(["x", "y"], 3, mockRng([0, 0]));
    expect(oferta.sort()).toEqual(["x", "y"]);
  });

  it("pool vazio → oferta vazia", () => {
    expect(sortearOferta([], 3, mockRng([0]))).toEqual([]);
  });
});

/** RNG determinístico: devolve os valores em sequência (satura no último). */
function mockRng(valores: number[]): () => number {
  let i = 0;
  return () => valores[Math.min(i++, valores.length - 1)] ?? 0;
}
