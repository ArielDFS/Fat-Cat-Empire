import { describe, it, expect } from "vitest";
import { OFFLINE_CAP_H } from "./constants";
import { calcularGanhoOffline } from "./offline";

const H = 3600 * 1000; // uma hora em ms
const TETO_S = OFFLINE_CAP_H * 3600; // 28.800 s

describe("calcularGanhoOffline", () => {
  it("ausência curta: aplica 50% da taxa", () => {
    // prod 10/s, 1 min = 60 s -> 10 * 60 * 0.5 = 300
    const r = calcularGanhoOffline(10, 60_000);
    expect(r.peixes).toBe(300);
    expect(r.segundosConsiderados).toBe(60);
    expect(r.foiCapado).toBe(false);
  });

  it("ausência capada: limita a 8h e marca foiCapado", () => {
    // 10h ausente, prod 10/s -> considera só 8h (28.800 s) -> 10 * 28800 * 0.5 = 144.000
    const r = calcularGanhoOffline(10, 10 * H);
    expect(r.segundosConsiderados).toBe(TETO_S);
    expect(r.peixes).toBe(144_000);
    expect(r.foiCapado).toBe(true);
  });

  it("exatamente 8h não é considerado capado", () => {
    const r = calcularGanhoOffline(10, OFFLINE_CAP_H * H);
    expect(r.segundosConsiderados).toBe(TETO_S);
    expect(r.foiCapado).toBe(false);
  });

  it("relógio pra trás (ms negativo): ganho zero", () => {
    const r = calcularGanhoOffline(10, -5000);
    expect(r).toEqual({ peixes: 0, segundosConsiderados: 0, foiCapado: false });
  });

  it("ausência nula (ms = 0): ganho zero", () => {
    const r = calcularGanhoOffline(10, 0);
    expect(r).toEqual({ peixes: 0, segundosConsiderados: 0, foiCapado: false });
  });

  it("produção zero: nenhum peixe, mas o tempo ainda é contabilizado", () => {
    const r = calcularGanhoOffline(0, 2 * H);
    expect(r.peixes).toBe(0);
    expect(r.segundosConsiderados).toBe(2 * 3600);
    expect(r.foiCapado).toBe(false);
  });

  it("produção negativa (save adulterado) não gera peixes negativos", () => {
    const r = calcularGanhoOffline(-50, 1 * H);
    expect(r.peixes).toBe(0);
  });

  it("aplica OFFLINE_RATE de 50% em produção alta", () => {
    // prod 100/s, 2h = 7200 s -> 100 * 7200 * 0.5 = 360.000
    const r = calcularGanhoOffline(100, 2 * H);
    expect(r.peixes).toBe(360_000);
  });
});
