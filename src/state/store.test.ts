import { describe, it, expect, beforeEach } from "vitest";
import { useGame, prodPorSegundo, poderDeClique, habilidadesDoPredio } from "./store";
import { abilityPorId } from "../data/abilities";

const CLIQUE10 = abilityPorId("caixa_papelao:m10")!; // C1 clique ×1,5, marco 10
const PROD25 = abilityPorId("caixa_papelao:m25")!; //   P1 produção ×2, marco 25

/** Semeia a run num estado conhecido, sem passar pela hidratação (que toca LocalStorage). */
function seed(patch: Partial<ReturnType<typeof useGame.getState>>) {
  useGame.setState({
    peixes: 0,
    lifetime: 0,
    coroas: 0,
    gatos: {},
    habilidades: [],
    ganhoOffline: null,
    ...patch,
  });
}

beforeEach(() => seed({}));

describe("comprarHabilidade (§3.4)", () => {
  it("compra uma passiva aberta: debita peixes e a registra", () => {
    seed({ peixes: CLIQUE10.custo, gatos: { caixa_papelao: 10 } });
    useGame.getState().comprarHabilidade(CLIQUE10.id);
    expect(useGame.getState().peixes).toBe(0);
    expect(useGame.getState().habilidades).toContain(CLIQUE10.id);
  });

  it("não compra com marco não atingido (24 < 25)", () => {
    seed({ peixes: PROD25.custo, gatos: { caixa_papelao: 24 } });
    useGame.getState().comprarHabilidade(PROD25.id);
    expect(useGame.getState().habilidades).toHaveLength(0);
    expect(useGame.getState().peixes).toBe(PROD25.custo);
  });

  it("não compra sem peixes suficientes", () => {
    seed({ peixes: CLIQUE10.custo - 1, gatos: { caixa_papelao: 10 } });
    useGame.getState().comprarHabilidade(CLIQUE10.id);
    expect(useGame.getState().habilidades).toHaveLength(0);
  });

  it("não compra em prédio ainda bloqueado (lifetime < desbloqueio)", () => {
    const barraca = abilityPorId("barraca_peixe:m10")!; // desbloqueia em 250 de lifetime
    seed({ peixes: barraca.custo, lifetime: 0, gatos: { barraca_peixe: 10 } });
    useGame.getState().comprarHabilidade(barraca.id);
    expect(useGame.getState().habilidades).toHaveLength(0);
  });

  it("é idempotente: comprar de novo não cobra nem duplica", () => {
    seed({ peixes: CLIQUE10.custo, gatos: { caixa_papelao: 10 } });
    useGame.getState().comprarHabilidade(CLIQUE10.id);
    useGame.getState().comprarHabilidade(CLIQUE10.id);
    expect(useGame.getState().peixes).toBe(0);
    expect(useGame.getState().habilidades).toEqual([CLIQUE10.id]);
  });
});

describe("efeito das passivas na economia (ADR-0002)", () => {
  it("Passiva de Produção multiplica a produção daquele prédio (×2)", () => {
    seed({ peixes: PROD25.custo, gatos: { caixa_papelao: 25 } });
    const antes = prodPorSegundo(useGame.getState());
    useGame.getState().comprarHabilidade(PROD25.id);
    expect(prodPorSegundo(useGame.getState())).toBeCloseTo(antes * 2);
  });

  it("Passiva de Clique aumenta o clique, mas NÃO a produção", () => {
    // Muitos gatos para o clique escapar do piso de 1 e o efeito ×1,5 aparecer.
    seed({ peixes: CLIQUE10.custo, gatos: { caixa_papelao: 1500 } });
    const prodAntes = prodPorSegundo(useGame.getState());
    const clickAntes = poderDeClique(useGame.getState());
    useGame.getState().comprarHabilidade(CLIQUE10.id);
    expect(prodPorSegundo(useGame.getState())).toBeCloseTo(prodAntes); // produção intacta
    expect(poderDeClique(useGame.getState())).toBeCloseTo(clickAntes * 1.5); // clique ×1,5
  });
});

describe("habilidadesDoPredio (seletor de UI)", () => {
  it("marca desbloqueada por marco e comprada por posse", () => {
    const ups = habilidadesDoPredio("caixa_papelao", { caixa_papelao: 25 }, [CLIQUE10.id]);
    const m10 = ups.find((u) => u.id === CLIQUE10.id)!;
    const m50 = ups.find((u) => u.marco === 50)!;
    expect(m10.desbloqueada).toBe(true);
    expect(m10.comprada).toBe(true);
    expect(m50.desbloqueada).toBe(false); // 25 < 50
    expect(m50.comprada).toBe(false);
  });
});
