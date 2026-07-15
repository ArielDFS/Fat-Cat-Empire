import { describe, it, expect } from "vitest";
import {
  habilidadeDesbloqueada,
  multiplicadorProducao,
  multiplicadorClique,
  bonusColheita,
} from "./abilities";
import type { EfeitoProducao, EfeitoClique } from "./abilities";

describe("habilidadeDesbloqueada", () => {
  it("abre exatamente ao atingir o marco (>=)", () => {
    expect(habilidadeDesbloqueada(9, 10)).toBe(false);
    expect(habilidadeDesbloqueada(10, 10)).toBe(true);
    expect(habilidadeDesbloqueada(11, 10)).toBe(true);
  });
});

describe("multiplicadorProducao (P1 × P2)", () => {
  it("sem passivas é neutro (×1)", () => {
    expect(multiplicadorProducao([], 100)).toBe(1);
  });

  it("P1 (fatores) compõem multiplicativamente, independem dos gatos", () => {
    const efeitos: EfeitoProducao[] = [
      { tipo: "producaoMult", fator: 1.5 },
      { tipo: "producaoMult", fator: 2 },
    ];
    expect(multiplicadorProducao(efeitos, 0)).toBeCloseTo(3);
    expect(multiplicadorProducao(efeitos, 50)).toBeCloseTo(3);
  });

  it("P2 (+% por gato) escala com o enxame daquele prédio", () => {
    const efeitos: EfeitoProducao[] = [{ tipo: "producaoPorGato", pct: 0.01 }]; // +1%/gato
    expect(multiplicadorProducao(efeitos, 0)).toBeCloseTo(1); // 1 + 0.01*0
    expect(multiplicadorProducao(efeitos, 100)).toBeCloseTo(2); // 1 + 0.01*100
  });

  it("P1 e P2 combinam: Π(P1) × (1 + Σ(P2)·gatos)", () => {
    const efeitos: EfeitoProducao[] = [
      { tipo: "producaoMult", fator: 2 },
      { tipo: "producaoPorGato", pct: 0.005 },
      { tipo: "producaoPorGato", pct: 0.005 },
    ];
    // 2 × (1 + (0.005+0.005)*50) = 2 × 1.5 = 3
    expect(multiplicadorProducao(efeitos, 50)).toBeCloseTo(3);
  });
});

describe("multiplicadorClique (C1)", () => {
  it("sem C1 é neutro (×1)", () => {
    expect(multiplicadorClique([])).toBe(1);
    expect(multiplicadorClique([{ tipo: "cliqueColheita", pct: 0.5 }])).toBe(1); // C2 não conta aqui
  });

  it("multiplica os fatores de clique entre si", () => {
    const efeitos: EfeitoClique[] = [
      { tipo: "cliqueMult", fator: 1.5 },
      { tipo: "cliqueMult", fator: 2 },
    ];
    expect(multiplicadorClique(efeitos)).toBeCloseTo(3);
  });
});

describe("bonusColheita (C2)", () => {
  it("sem C2 é zero", () => {
    expect(bonusColheita([])).toBe(0);
    expect(bonusColheita([{ tipo: "cliqueMult", fator: 2 }])).toBe(0); // C1 não conta aqui
  });

  it("soma os percentuais de colheita", () => {
    const efeitos: EfeitoClique[] = [
      { tipo: "cliqueColheita", pct: 0.02 },
      { tipo: "cliqueColheita", pct: 0.03 },
    ];
    expect(bonusColheita(efeitos)).toBeCloseTo(0.05);
  });
});
