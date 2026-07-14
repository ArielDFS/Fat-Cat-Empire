import { describe, it, expect } from "vitest";
import { COST_GROWTH } from "./constants";
import { custoDoProximoGato, custoDeVariosGatos } from "./cost";

describe("custoDoProximoGato", () => {
  it("cobra o custo base pelo primeiro gato (n = 0)", () => {
    expect(custoDoProximoGato(15, 0)).toBe(15);
    expect(custoDoProximoGato(100, 0)).toBe(100);
  });

  it("cresce por COST_GROWTH a cada gato já possuído", () => {
    // 15 * 1.15   = 17.25  -> ceil 18
    // 15 * 1.15^2 = 19.8375 -> ceil 20
    expect(custoDoProximoGato(15, 1)).toBe(18);
    expect(custoDoProximoGato(15, 2)).toBe(20);
  });

  it("aplica ceil (nunca cobra fração de peixe)", () => {
    const cru = 100 * COST_GROWTH ** 3; // 152.0875
    expect(Number.isInteger(cru)).toBe(false);
    expect(custoDoProximoGato(100, 3)).toBe(Math.ceil(cru));
    expect(custoDoProximoGato(100, 3)).toBe(153);
  });

  it("é monotonicamente crescente em n", () => {
    let anterior = 0;
    for (let n = 0; n < 50; n++) {
      const atual = custoDoProximoGato(15, n);
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });
});

describe("custoDeVariosGatos", () => {
  it("retorna 0 para quantidade <= 0", () => {
    expect(custoDeVariosGatos(15, 0, 0)).toBe(0);
    expect(custoDeVariosGatos(15, 5, -3)).toBe(0);
  });

  it("para k = 1 é igual ao custo do próximo gato", () => {
    expect(custoDeVariosGatos(15, 7, 1)).toBe(custoDoProximoGato(15, 7));
  });

  it("soma os custos individuais (cada gato arredondado)", () => {
    // n=0: 15, n=1: 18, n=2: 20  => 53
    expect(custoDeVariosGatos(15, 0, 3)).toBe(15 + 18 + 20);
    expect(custoDeVariosGatos(15, 0, 3)).toBe(53);
  });

  it("é consistente com a compra gato a gato a partir de qualquer ponto", () => {
    const base = 100;
    const inicio = 10;
    const k = 25;
    let somaManual = 0;
    for (let i = 0; i < k; i++) somaManual += custoDoProximoGato(base, inicio + i);
    expect(custoDeVariosGatos(base, inicio, k)).toBe(somaManual);
  });

  it("comprar 10 de uma vez custa o mesmo que dois lotes de 5", () => {
    const base = 1100;
    const dez = custoDeVariosGatos(base, 0, 10);
    const primeiros5 = custoDeVariosGatos(base, 0, 5);
    const proximos5 = custoDeVariosGatos(base, 5, 5);
    expect(dez).toBe(primeiros5 + proximos5);
  });
});
