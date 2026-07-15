import { describe, it, expect, beforeEach } from "vitest";
import { useGame, prodPorSegundo, poderDeClique, habilidadesDoPredio } from "./store";
import { abilityPorId } from "../data/abilities";
import { LUMP_PISO } from "../data/eras";

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
    eraMaisAlta: 1,
    ganhoOffline: null,
    eraFanfarra: null,
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

describe("cruzamento de Era ao vivo (§4.5)", () => {
  it("clicar cruzando o limiar da Era 2 sobe a Era, paga o lump e arma a fanfarra", () => {
    // Sem produção (0 gatos) o clique rende o piso de 1; leva o lifetime a 1 abaixo do limiar (1500).
    seed({ lifetime: 1_499, peixes: 0 });
    useGame.getState().clicar(); // +1 → lifetime 1500 (Era 2)
    const s = useGame.getState();
    expect(s.eraMaisAlta).toBe(2);
    expect(s.eraFanfarra?.nivel).toBe(2);
    // Produção zero → o lump cai no piso. peixes = ganho do clique (1) + piso.
    expect(s.peixes).toBe(1 + LUMP_PISO);
  });

  it("o lump entra só em peixes, não no lifetime (não encadeia a próxima Era de graça)", () => {
    seed({ lifetime: 1_499, peixes: 0 });
    useGame.getState().clicar();
    // lifetime avança só pelo ganho genuíno (o +1 do clique), nunca pelo lump.
    expect(useGame.getState().lifetime).toBe(1_500);
    expect(useGame.getState().eraMaisAlta).toBe(2); // não pulou pra 3
  });

  it("não repaga o lump ao ficar na mesma Era", () => {
    seed({ lifetime: 1_600, eraMaisAlta: 2, peixes: 0 });
    useGame.getState().clicar(); // continua na Era 2
    const s = useGame.getState();
    expect(s.eraMaisAlta).toBe(2);
    expect(s.eraFanfarra).toBeNull();
    expect(s.peixes).toBe(1); // só o ganho do clique, sem lump
  });

  it("um tick que salta vários limiares de uma vez sobe até a Era final e paga cada lump", () => {
    // 8 gatos de rua (0,1/s cada) = 0,8/s. Um tick gigante empurra o lifetime além da Era 3 (8000).
    seed({ lifetime: 0, gatos: { caixa_papelao: 8 } });
    useGame.getState().tick(20_000); // 0,8 × 20000 = 16000 de peixes → cruza Eras 2 e 3
    const s = useGame.getState();
    expect(s.eraMaisAlta).toBe(3);
    expect(s.eraFanfarra?.nivel).toBe(3);
  });

  it("fecharFanfarra limpa a fanfarra sem mexer na Era", () => {
    seed({ lifetime: 1_499 });
    useGame.getState().clicar();
    expect(useGame.getState().eraFanfarra).not.toBeNull();
    useGame.getState().fecharFanfarra();
    expect(useGame.getState().eraFanfarra).toBeNull();
    expect(useGame.getState().eraMaisAlta).toBe(2);
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
