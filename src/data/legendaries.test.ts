import { describe, expect, it } from "vitest";
import { LEGENDARIES, lendarioPorId, poolDisponivel } from "./legendaries";

describe("conteúdo dos Gatos Lendários", () => {
  it("mantém ids únicos no elenco", () => {
    const ids = LEGENDARIES.map((lendario) => lendario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Princesa Helena é um Lendário de tier 5 ligado à virada de Era", () => {
    const helena = lendarioPorId("princesa_helena");

    expect(helena).toMatchObject({
      nome: "Princesa Helena",
      tier: 5,
      efeito: { tipo: "lumpMult", porNivel: 1.75 },
    });
    expect(poolDisponivel({}, 4)).not.toContain("princesa_helena");
    expect(poolDisponivel({}, 5)).toContain("princesa_helena");
  });
});
