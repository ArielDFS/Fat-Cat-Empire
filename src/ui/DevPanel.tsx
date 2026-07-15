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
import { useGame } from "../state/store";
import { BUILDINGS } from "../data/buildings";
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

function maiorDesbloqueio(): number {
  return Math.max(...BUILDINGS.map((b) => b.desbloqueio));
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

/** Revela os 4 prédios sem inflar o enxame (bom pra testar visual de lane vazia). */
function revelarPredios() {
  useGame.setState((s) => ({ lifetime: Math.max(s.lifetime, maiorDesbloqueio()) }));
}

/** Desbloqueia tudo: revela os prédios E enche cada um até o topo de marcos (abre todas as passivas). */
function desbloquearTudo() {
  useGame.setState((s) => {
    const gatos = { ...s.gatos };
    for (const b of BUILDINGS) gatos[b.id] = Math.max(gatos[b.id] ?? 0, MARCO_MAX);
    return { lifetime: Math.max(s.lifetime, maiorDesbloqueio()), gatos };
  });
}

/** Zera a run (inclui o save) — testa progressão do zero. */
function zerarRun() {
  limparSave();
  useGame.setState({
    peixes: 0,
    lifetime: 0,
    coroas: 0,
    gatos: gatosZerados(),
    habilidades: [],
    ganhoOffline: null,
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
  const coroas = useGame((s) => s.coroas);

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
        Só revelar prédios
      </button>

      <span style={S.label}>Reset</span>
      <button style={S.btnDanger} onClick={zerarRun}>Zerar run + save</button>

      <div style={S.stat}>
        🐟 {peixes.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
        {" · "}👑 {coroas}
        <br />lifetime {lifetime.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}
