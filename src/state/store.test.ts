import { describe, it, expect, beforeEach } from "vitest";
import { useGame, prodPorSegundo, poderDeClique, habilidadesDoPredio, eraAtual } from "./store";
import { abilityPorId } from "../data/abilities";
import { BUILDINGS } from "../data/buildings";
import { LUMP_SEGUNDOS, LUMP_PISO } from "../data/eras";
import { lumpDaEra } from "../domain/era";
import { PRESTIGE_DIVISOR, SELO_IMPERIAL_MULT } from "../domain/constants";

const CLIQUE10 = abilityPorId("caixa_papelao:m10")!; // C1 clique ×1,5, marco 10
const PROD25 = abilityPorId("caixa_papelao:m25")!; //   P1 produção ×2, marco 25

/** Semeia a run num estado conhecido, sem passar pela hidratação (que toca LocalStorage). */
function seed(patch: Partial<ReturnType<typeof useGame.getState>>) {
  useGame.setState({
    peixes: 0,
    lifetime: 0,
    gastos: 0,
    coroas: 0,
    gatos: {},
    habilidades: [],
    seloImperial: false,
    dinastias: 0,
    runInicioTs: Date.now(),
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

  it("não compra em prédio ainda bloqueado pela cadeia (anterior sem gato)", () => {
    const barraca = abilityPorId("barraca_peixe:m10")!; // Barraca só abre com ≥1 gato na Caixa
    seed({ peixes: barraca.custo, gatos: { barraca_peixe: 10 } }); // Caixa em 0 → Barraca oculta
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

describe("virada de Era ao construir a Obra (§4.6.9)", () => {
  // Era-1 Obra = prefeitura_vira_lata; seu anterior na cadeia é latao_gourmet. Custo derivado do
  // dado (robusto a mudanças de curva): 1º gato ⇒ custoBasePorGato.
  const OBRA = "prefeitura_vira_lata";
  const CUSTO_OBRA = BUILDINGS.find((b) => b.id === OBRA)!.custoBasePorGato;

  it("comprar o 1º gato da Obra vira a Era, arma a fanfarra e paga o lump", () => {
    // 1 gato no Latão desbloqueia a Obra e dá produção para o lump.
    seed({ gatos: { latao_gourmet: 1 }, peixes: CUSTO_OBRA });
    const rate = prodPorSegundo(useGame.getState()); // produção do Latão
    useGame.getState().comprarGatos(OBRA, 1);
    const s = useGame.getState();
    expect(eraAtual(s.gatos)).toBe(2); // Beco → Vila
    expect(s.eraFanfarra?.nivel).toBe(2);
    // peixes = (saldo − custo) + lump; saldo == custo, então sobra só o lump.
    expect(s.peixes).toBeCloseTo(lumpDaEra(rate, LUMP_SEGUNDOS, LUMP_PISO));
    expect(s.gastos).toBe(CUSTO_OBRA); // a Obra conta pro prestígio
  });

  it("o lump não mexe no lifetime (vitrine) — comprar gato não produz", () => {
    seed({ gatos: { latao_gourmet: 1 }, peixes: CUSTO_OBRA, lifetime: 5_000 });
    useGame.getState().comprarGatos(OBRA, 1);
    expect(useGame.getState().lifetime).toBe(5_000); // intacto
  });

  it("comprar MAIS gatos de uma Obra já construída não vira Era nem repaga o lump", () => {
    seed({ gatos: { latao_gourmet: 1, [OBRA]: 1 }, peixes: 10 * CUSTO_OBRA });
    const eraAntes = eraAtual(useGame.getState().gatos); // já Era 2
    useGame.getState().comprarGatos(OBRA, 1); // 2º gato da Obra
    const s = useGame.getState();
    expect(eraAtual(s.gatos)).toBe(eraAntes);
    expect(s.eraFanfarra).toBeNull();
  });

  it("fecharFanfarra limpa a fanfarra sem mexer na Era", () => {
    seed({ gatos: { latao_gourmet: 1 }, peixes: CUSTO_OBRA });
    useGame.getState().comprarGatos(OBRA, 1);
    expect(useGame.getState().eraFanfarra).not.toBeNull();
    useGame.getState().fecharFanfarra();
    expect(useGame.getState().eraFanfarra).toBeNull();
    expect(eraAtual(useGame.getState().gatos)).toBe(2);
  });

  it("clicar e tickar NÃO viram Era (a Era só avança por Obra)", () => {
    seed({ gatos: { caixa_papelao: 8 } });
    useGame.getState().clicar();
    useGame.getState().tick(100_000);
    const s = useGame.getState();
    expect(eraAtual(s.gatos)).toBe(1); // continua no Beco
    expect(s.eraFanfarra).toBeNull();
    expect(s.lifetime).toBeGreaterThan(0); // mas o lifetime-vitrine subiu
  });
});

describe("novaDinastia — prestígio (§6)", () => {
  it("funda com ≥1 coroa: credita coroas, concede o Selo e zera a run", () => {
    seed({
      gastos: 4 * PRESTIGE_DIVISOR, // sqrt(4) = 2 coroas
      peixes: 9_999,
      lifetime: 9_999,
      coroas: 1,
      gatos: { caixa_papelao: 50 },
      habilidades: [CLIQUE10.id],
    });
    useGame.getState().novaDinastia();
    const s = useGame.getState();
    expect(s.coroas).toBe(3); // 1 antiga + 2 ganhas
    expect(s.seloImperial).toBe(true);
    expect(s.peixes).toBe(0);
    expect(s.lifetime).toBe(0);
    expect(s.gastos).toBe(0);
    expect(s.gatos.caixa_papelao).toBe(0);
    expect(s.habilidades).toEqual([]);
    expect(eraAtual(s.gatos)).toBe(1); // volta ao Beco (gatos zerados ⇒ 0 Obras)
    expect(s.dinastias).toBe(1); // contador de fundações incrementa
  });

  it("conta as Dinastias de forma cumulativa (não reseta)", () => {
    seed({ gastos: PRESTIGE_DIVISOR, coroas: 0, dinastias: 2 });
    useGame.getState().novaDinastia();
    expect(useGame.getState().dinastias).toBe(3);
  });

  it("não funda com menos de 1 coroa: nada muda", () => {
    seed({ gastos: PRESTIGE_DIVISOR - 1, coroas: 0, gatos: { caixa_papelao: 10 } });
    useGame.getState().novaDinastia();
    const s = useGame.getState();
    expect(s.coroas).toBe(0);
    expect(s.gastos).toBe(PRESTIGE_DIVISOR - 1);
    expect(s.gatos.caixa_papelao).toBe(10);
    expect(s.seloImperial).toBe(false);
  });

  it("o Selo aplica ×1,5 na produção global e sobrevive à Dinastia", () => {
    seed({ gatos: { caixa_papelao: 100 } });
    const semSelo = prodPorSegundo(useGame.getState());
    seed({ gatos: { caixa_papelao: 100 }, seloImperial: true });
    expect(prodPorSegundo(useGame.getState())).toBeCloseTo(semSelo * SELO_IMPERIAL_MULT);
  });

  it("o ×1,5 do Selo NÃO empilha entre Dinastias: fundar de novo só soma coroas", () => {
    seed({ gastos: PRESTIGE_DIVISOR, coroas: 0, seloImperial: true, gatos: { caixa_papelao: 10 } });
    const antes = useGame.getState().seloImperial;
    useGame.getState().novaDinastia();
    const s = useGame.getState();
    expect(antes).toBe(true);
    expect(s.seloImperial).toBe(true); // continua true, não vira "2 selos"
    expect(s.coroas).toBe(1); // quem cresce por Dinastia é a coroa
  });

  it("re-arma o relógio da run ao fundar (base da conquista §12)", () => {
    const antigo = Date.now() - 60_000;
    seed({ gastos: PRESTIGE_DIVISOR, runInicioTs: antigo });
    useGame.getState().novaDinastia();
    expect(useGame.getState().runInicioTs).toBeGreaterThan(antigo);
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
