import { describe, expect, it } from "vitest";
import {
  estadoDaHabilidadeAtiva,
  multiplicadorCliqueAtivo,
} from "./activeAbilities";

describe("estadoDaHabilidadeAtiva", () => {
  it("percorre disponível → ativa → recarga → disponível", () => {
    expect(estadoDaHabilidadeAtiva(undefined, undefined, 0)).toBe("disponivel");
    expect(estadoDaHabilidadeAtiva(15_000, 90_000, 14_999)).toBe("ativa");
    expect(estadoDaHabilidadeAtiva(15_000, 90_000, 15_000)).toBe("recarga");
    expect(estadoDaHabilidadeAtiva(15_000, 90_000, 89_999)).toBe("recarga");
    expect(estadoDaHabilidadeAtiva(15_000, 90_000, 90_000)).toBe("disponivel");
  });
});

describe("multiplicadorCliqueAtivo", () => {
  it("aplica o multiplicador apenas dentro da janela ativa", () => {
    expect(multiplicadorCliqueAtivo(5, 15_000, 14_999)).toBe(5);
    expect(multiplicadorCliqueAtivo(5, 15_000, 15_000)).toBe(1);
    expect(multiplicadorCliqueAtivo(5, undefined, 0)).toBe(1);
  });
});
