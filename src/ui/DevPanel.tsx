/**
 * Painel de desenvolvimento — SÓ para testes. Fica atrás de `import.meta.env.DEV`, então o Vite
 * remove a renderização no build de produção (o jogador nunca vê).
 *
 * De propósito NÃO adiciona ações à store (`GameState`): fala direto com `useGame.setState/getState`,
 * pra não vazar ferramenta de teste pra dentro da economia de verdade. Estilos são inline pela mesma
 * razão — nada de dev encosta no `styles.css` do jogo.
 */

import { useState } from "react";
import type { CSSProperties } from "react";
import { useGame, eraAtual } from "../state/store";
import { BUILDINGS } from "../data/buildings";
import { eraPorNivel } from "../data/eras";
import { PRESTIGE_DIVISOR } from "../domain/constants";
import { limparSave } from "../state/save";

/** Marco mais alto de qualquer prédio — atingi-lo abre todas as passivas daquele prédio (§3.4). */
const MARCO_MAX = 100;

const ATALHOS_PEIXES = [
  { rotulo: "+1K", valor: 1e3 },
  { rotulo: "+1M", valor: 1e6 },
  { rotulo: "+1B", valor: 1e9 },
  { rotulo: "+1T", valor: 1e12 },
];

function gatosZerados(): Record<string, number> {
  return Object.fromEntries(BUILDINGS.map((b) => [b.id, 0]));
}

// --- ações de teste (via setState direto) ---

function addPeixes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return;
  useGame.setState((s) => ({ peixes: s.peixes + n }));
}

function addCoroas(n: number) {
  if (!Number.isFinite(n) || n <= 0) return;
  useGame.setState((s) => ({ coroas: s.coroas + n }));
}

/**
 * Revela todos os prédios com o enxame mínimo (1 gato cada). Na cadeia de compra (§4.6.9) não dá pra
 * revelar um prédio sem ter o 1º gato do anterior — então isto também constrói todas as Obras
 * (a Era derivada salta pra última). Direto no estado, sem fanfarra.
 */
function revelarPredios() {
  useGame.setState((s) => {
    const gatos = { ...s.gatos };
    for (const b of BUILDINGS) gatos[b.id] = Math.max(gatos[b.id] ?? 0, 1);
    return { gatos };
  });
}

/** Desbloqueia tudo: enche cada prédio até o topo de marcos (revela a cadeia + abre todas as passivas). */
function desbloquearTudo() {
  useGame.setState((s) => {
    const gatos = { ...s.gatos };
    for (const b of BUILDINGS) gatos[b.id] = Math.max(gatos[b.id] ?? 0, MARCO_MAX);
    return { gatos };
  });
}

/**
 * Constrói a próxima Obra ainda não erguida (§4.6.9), passando pelo caminho REAL do jogo
 * (`comprarGatos`) — satisfaz a cadeia, financia o 1º gato da Obra, e dispara fanfarra + lump.
 */
function cruzarProximaEra() {
  const s = useGame.getState();
  const obra = BUILDINGS.find((b) => b.ehObra && (s.gatos[b.id] ?? 0) === 0);
  if (!obra) return; // todas as Obras já construídas
  const idx = BUILDINGS.findIndex((b) => b.id === obra.id);
  const gatos = { ...s.gatos };
  for (let i = 0; i < idx; i++) gatos[BUILDINGS[i]!.id] = Math.max(gatos[BUILDINGS[i]!.id] ?? 0, 1);
  useGame.setState({ gatos, peixes: s.peixes + obra.custoBasePorGato });
  useGame.getState().comprarGatos(obra.id, 1);
}

/**
 * Empurra os `gastos` até já valerem N coroas (§6) — testa o botão de Nova Dinastia sem jogar 1h.
 * Inverte `floor(sqrt(gastos/DIV))`: gastos = N² × DIV.
 */
function darGastosParaCoroas(n: number) {
  const alvo = n * n * PRESTIGE_DIVISOR;
  useGame.setState((s) => ({ gastos: Math.max(s.gastos, alvo) }));
}

/** Zera a run (inclui o save) — testa progressão do zero. */
function zerarRun() {
  limparSave();
  useGame.setState({
    peixes: 0,
    lifetime: 0,
    gastos: 0,
    coroas: 0,
    gatos: gatosZerados(),
    habilidades: [],
    seloImperial: false,
    dinastias: 0,
    runInicioTs: Date.now(),
    ganhoOffline: null,
    eraFanfarra: null,
  });
}

// --- estilos inline (dev-only, fora do styles.css) ---

const S = {
  fab: {
    position: "fixed", left: 14, bottom: 14, zIndex: 9999,
    font: "700 13px/1 monospace", color: "#fff", background: "#7B4FE0",
    border: "2px solid #241C2E", borderRadius: 10, padding: "8px 11px", cursor: "pointer",
    boxShadow: "0 3px 0 #55329E",
  },
  panel: {
    position: "fixed", left: 14, bottom: 14, zIndex: 9999, width: 250,
    font: "12px/1.4 monospace", color: "#eee", background: "#241C2E",
    border: "2px solid #7B4FE0", borderRadius: 12, padding: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontWeight: 700, color: "#C9B4FF", letterSpacing: "0.04em" },
  x: { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16 },
  label: { display: "block", margin: "10px 0 4px", color: "#9a8fb0", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" },
  row: { display: "flex", gap: 5, flexWrap: "wrap" },
  btn: {
    flex: "1 1 auto", font: "700 12px monospace", color: "#241C2E", background: "#2EC4B6",
    border: "1.5px solid #241C2E", borderRadius: 7, padding: "6px 8px", cursor: "pointer",
  },
  btnWide: {
    width: "100%", font: "700 12px monospace", color: "#241C2E", background: "#FFC93C",
    border: "1.5px solid #241C2E", borderRadius: 7, padding: "7px 8px", cursor: "pointer", marginTop: 5,
  },
  btnDanger: {
    width: "100%", font: "700 12px monospace", color: "#fff", background: "#E63946",
    border: "1.5px solid #241C2E", borderRadius: 7, padding: "7px 8px", cursor: "pointer", marginTop: 5,
  },
  input: {
    flex: "1 1 90px", minWidth: 0, font: "12px monospace", color: "#241C2E", background: "#FDF3E3",
    border: "1.5px solid #241C2E", borderRadius: 7, padding: "6px 8px",
  },
  stat: { color: "#9a8fb0", marginTop: 10, fontSize: 11 },
} satisfies Record<string, CSSProperties>;

export function DevPanel() {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState("1000000");
  const peixes = useGame((s) => s.peixes);
  const lifetime = useGame((s) => s.lifetime);
  const gastos = useGame((s) => s.gastos);
  const coroas = useGame((s) => s.coroas);
  const gatos = useGame((s) => s.gatos);
  const seloImperial = useGame((s) => s.seloImperial);
  const dinastias = useGame((s) => s.dinastias);
  const eraNivel = eraAtual(gatos);

  if (!aberto) {
    return (
      <button style={S.fab} onClick={() => setAberto(true)} title="Painel de testes">
        🛠 dev
      </button>
    );
  }

  const custom = Number(valor);

  return (
    <div style={S.panel} role="dialog" aria-label="Painel dev">
      <div style={S.head}>
        <span style={S.title}>🛠 DEV</span>
        <button style={S.x} onClick={() => setAberto(false)} aria-label="fechar">×</button>
      </div>

      <span style={S.label}>Peixes</span>
      <div style={S.row}>
        {ATALHOS_PEIXES.map((a) => (
          <button key={a.rotulo} style={S.btn} onClick={() => addPeixes(a.valor)}>{a.rotulo}</button>
        ))}
      </div>
      <div style={{ ...S.row, marginTop: 5 }}>
        <input
          style={S.input}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="quantidade (ex: 1e12)"
          inputMode="numeric"
        />
        <button style={S.btn} onClick={() => addPeixes(custom)}>+ peixes</button>
      </div>

      <span style={S.label}>Coroas</span>
      <div style={S.row}>
        <button style={S.btn} onClick={() => addCoroas(1)}>+1</button>
        <button style={S.btn} onClick={() => addCoroas(10)}>+10</button>
        <button style={S.btn} onClick={() => addCoroas(custom)}>+ custom</button>
      </div>

      <span style={S.label}>Desbloqueio</span>
      <button style={S.btnWide} onClick={desbloquearTudo}>Desbloquear tudo (prédios + passivas)</button>
      <button style={{ ...S.btnWide, background: "#FF7A2F" }} onClick={revelarPredios}>
        Só revelar prédios (1 gato cada)
      </button>

      <span style={S.label}>Eras</span>
      <button style={{ ...S.btnWide, background: "#C9B4FF" }} onClick={cruzarProximaEra}>
        Construir próxima Obra (vira Era)
      </button>

      <span style={S.label}>Dinastia</span>
      <div style={S.row}>
        <button style={S.btn} onClick={() => darGastosParaCoroas(1)}>gastos → 1 👑</button>
        <button style={S.btn} onClick={() => darGastosParaCoroas(5)}>→ 5 👑</button>
      </div>

      <span style={S.label}>Reset</span>
      <button style={S.btnDanger} onClick={zerarRun}>Zerar run + save</button>

      <div style={S.stat}>
        🐟 {peixes.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
        {" · "}👑 {coroas}
        <br />gastos {gastos.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
        <br />lifetime {lifetime.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} (vitrine)
        <br />Era {eraNivel} — {eraPorNivel(eraNivel).nome}
        {seloImperial ? " · 🏅 Selo" : ""}
        <br />Dinastias {dinastias}
      </div>
    </div>
  );
}
