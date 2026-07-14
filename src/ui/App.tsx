import { useEffect, useState } from "react";
import { BUILDINGS } from "../data/buildings";
import { iniciarLoop } from "../core/loop";
import { useGame, prodPorSegundo, poderDeClique, custoDaCompra } from "../state/store";
import fishImg from "../assets/fish_coin.png";
import boxImg from "../assets/cardbox.png";
import ruaImg from "../assets/cat_rua.png";
import laneBg from "../assets/lane_cardbox.png";

/** Formatação feia-mas-legível para o passo 2. Vira sistema de verdade depois. */
function fmt(n: number): string {
  if (n < 1000) return (Number.isInteger(n) ? n : n.toFixed(n < 10 ? 1 : 0)).toString();
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

const QUANTIDADES = [1, 10, 100] as const;

export function App() {
  useEffect(() => iniciarLoop(), []);
  const [qty, setQty] = useState<number>(1);

  const peixes = useGame((s) => s.peixes);
  const coroas = useGame((s) => s.coroas);
  const gatos = useGame((s) => s.gatos);
  const clicar = useGame((s) => s.clicar);
  const comprarGatos = useGame((s) => s.comprarGatos);

  const rate = prodPorSegundo({ gatos, coroas });
  const clickPow = poderDeClique({ gatos, coroas });

  return (
    <div className="app">
      <header className="hud">
        <strong className="brand">🐱 Fat Cat Empire <span className="tag">dev · passo 2</span></strong>
        <div className="res"><span>🐟 Peixes</span><b>{fmt(peixes)}</b></div>
        <div className="res"><span>⚡ Por s</span><b>{fmt(rate)}</b></div>
        <div className="res"><span>👑 Coroas</span><b>{coroas}</b></div>
      </header>

      <main className="stage">
        <section className="clickcol">
          <button className="bigfish" onClick={clicar} aria-label="clicar no peixe">
            <img src={fishImg} alt="peixe" />
          </button>
          <p className="clickhint">clique: <b>+{fmt(clickPow)}</b></p>
        </section>

        <section className="lanes">
          <div className="qtybar">
            comprar:
            {QUANTIDADES.map((q) => (
              <button
                key={q}
                className={qty === q ? "on" : ""}
                onClick={() => setQty(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {BUILDINGS.map((b) => {
            const n = gatos[b.id] ?? 0;
            const custo = custoDaCompra(gatos, b.id, qty);
            const podeComprar = peixes >= custo;
            const prodPredio = b.producaoPorGato * n;
            const TETO_VISUAL = 48;
            const visiveis = Math.min(n, TETO_VISUAL);
            return (
              <div className="lane" key={b.id} style={{ backgroundImage: `url(${laneBg})` }}>
                {/* ícone do prédio (asset normalizado) */}
                <div className="lane-icon" title={b.descricao}>
                  <img src={boxImg} alt={b.nome} />
                </div>
                <div className="lane-body">
                  <div className="lane-head">
                    <span className="lane-nome">{b.nome}</span>
                    <span className="lane-cnt">{n} 🐈</span>
                  </div>
                  <div className="lane-prod">
                    {b.tipoGato} · {fmt(prodPredio)} peixes/s
                  </div>
                  {/* strip de gatos (sprite normalizado do tipo do prédio) */}
                  <div className="strip">
                    {Array.from({ length: visiveis }, (_, i) => (
                      <img
                        className="cd"
                        key={i}
                        src={ruaImg}
                        alt=""
                        style={{ animationDelay: `${(i % 9) * 0.16}s` }}
                      />
                    ))}
                    {n > TETO_VISUAL && <span className="more">+{fmt(n - TETO_VISUAL)}</span>}
                  </div>
                </div>
                <button
                  className="buy"
                  disabled={!podeComprar}
                  onClick={() => comprarGatos(b.id, qty)}
                >
                  <span>Comprar {qty}</span>
                  <span className="cost">🐟 {fmt(custo)}</span>
                </button>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="foot">
        UI feia de propósito (§10 passo 2). Slots de asset marcados: <code>.lane-icon</code> (ícone
        do prédio) e <code>.strip / .cd</code> (sprite de gato). Assim que você gerar os primeiros
        PNGs, eles entram aqui pra testar o layout.
      </footer>
    </div>
  );
}
