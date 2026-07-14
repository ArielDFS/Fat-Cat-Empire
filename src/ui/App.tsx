import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BUILDINGS } from "../data/buildings";
import { iniciarLoop } from "../core/loop";
import { useGame, prodPorSegundo, poderDeClique, custoDaCompra, predioDesbloqueado } from "../state/store";
import { iniciarAutoSave } from "../state/save";
import { artOf } from "./buildingArt";
import fishImg from "../assets/fish_click.png";
import coinImg from "../assets/fish_coin.png";

/** Teto de gatos desenhados por lane. O enxame não cresce além disso; vira "+N". */
const MAX_SHOWN = 36;

/**
 * Densidade do enxame: conforme os gatos aumentam, eles encolhem e se sobrepõem, ficando
 * "mais densos" numa faixa de ALTURA FIXA (decisão de design 1a). A lane cresce só na horizontal.
 */
function densidade(n: number): { alturaPx: number; sobreposicaoPx: number } {
  if (n <= 6) return { alturaPx: 96, sobreposicaoPx: 0 };
  if (n <= 12) return { alturaPx: 86, sobreposicaoPx: 10 };
  if (n <= 20) return { alturaPx: 74, sobreposicaoPx: 20 };
  if (n <= 28) return { alturaPx: 62, sobreposicaoPx: 28 };
  return { alturaPx: 54, sobreposicaoPx: 34 };
}

/** Formatação legível de números grandes (pt-BR). */
function fmt(n: number): string {
  if (n < 1000) return (Number.isInteger(n) ? n : n.toFixed(n < 10 ? 1 : 0)).toString();
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/** Duração legível para o modal de retorno (ex.: "2 h 13 min"). */
function fmtDuracao(segundos: number): string {
  const s = Math.floor(segundos);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${seg} s`;
  return `${seg} s`;
}

const QUANTIDADES = [1, 10, 100] as const;

/** Uma partícula "+N" que sobe e some após o clique. */
interface Pop {
  id: number;
  value: number;
  x: number;
}

export function App() {
  // Ordem importa: hidrata o save (credita offline) ANTES de o loop começar a tickar.
  useEffect(() => {
    useGame.getState().hidratar();
    const pararLoop = iniciarLoop();
    const pararSave = iniciarAutoSave(() => useGame.getState().salvar());
    return () => {
      pararLoop();
      pararSave();
    };
  }, []);
  const [qty, setQty] = useState<number>(1);
  const [pops, setPops] = useState<Pop[]>([]);
  const popId = useRef(0);

  const peixes = useGame((s) => s.peixes);
  const lifetime = useGame((s) => s.lifetime);
  const coroas = useGame((s) => s.coroas);
  const gatos = useGame((s) => s.gatos);
  const clicar = useGame((s) => s.clicar);
  const comprarGatos = useGame((s) => s.comprarGatos);
  const ganhoOffline = useGame((s) => s.ganhoOffline);
  const fecharModalOffline = useGame((s) => s.fecharModalOffline);

  const rate = prodPorSegundo({ gatos, coroas });
  const clickPow = poderDeClique({ gatos, coroas });

  // Cascata de desbloqueio (§3.3): só mostra prédios cujo limiar já foi cruzado nesta run.
  const desbloqueados = BUILDINGS.filter((b) => predioDesbloqueado(b, lifetime));
  const proximo = BUILDINGS.find((b) => !predioDesbloqueado(b, lifetime));

  function clicarNoPeixe() {
    clicar();
    const id = popId.current++;
    const x = Math.round(Math.random() * 44 - 22);
    setPops((p) => [...p, { id, value: clickPow, x }]);
  }
  function removerPop(id: number) {
    setPops((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="app">
      {ganhoOffline && (
        <div className="modal-backdrop" role="presentation" onClick={fecharModalOffline}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-titulo">Bem-vindo de volta! 🐟</h2>
            <p>
              Enquanto você esteve fora (<b>{fmtDuracao(ganhoOffline.segundosConsiderados)}</b>),
              seus gatos não pararam de pescar:
            </p>
            <p className="modal-ganho">+{fmt(ganhoOffline.peixes)} 🐟</p>
            {ganhoOffline.foiCapado && <p className="modal-cap">O acúmulo offline é limitado a 8 h.</p>}
            <button className="modal-ok" onClick={fecharModalOffline} autoFocus>
              Coletar
            </button>
          </div>
        </div>
      )}

      <header className="hud">
        <div className="brand">
          <img className="brand-logo" src="/logo_lockup.png" alt="Fat Cat Empire" />
          <span className="tag">dev</span>
        </div>
        <div className="hud-res">
          <div className="res">
            <img className="res-ico-img" src={coinImg} alt="" aria-hidden="true" />
            <span className="res-txt"><span className="res-lab">Peixes</span><b>{fmt(peixes)}</b></span>
          </div>
          <div className="res">
            <span className="res-ico res-crown" aria-hidden="true">👑</span>
            <span className="res-txt"><span className="res-lab">Coroas</span><b>{fmt(coroas)}</b></span>
          </div>
        </div>
      </header>

      <main className="stage">
        <section className="clickcol">
          <div className="fishwrap">
            <button className="bigfish" onClick={clicarNoPeixe} aria-label="clicar no peixe">
              <img src={fishImg} alt="" />
            </button>
            <div className="pops" aria-hidden="true">
              {pops.map((p) => {
                const style: CSSProperties = { ["--x" as string]: `${p.x}px` };
                return (
                  <span key={p.id} className="pop" style={style} onAnimationEnd={() => removerPop(p.id)}>
                    +{fmt(p.value)}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="clickstats">
            <div className="totalrate">
              <strong>{fmt(rate)}</strong>
              <span>peixes / segundo</span>
            </div>
            <p className="clickhint">clique <b>+{fmt(clickPow)}</b> 🐟</p>
          </div>
        </section>

        <section className="lanes">
          <div className="qtybar">
            <span className="qtybar-lab">Comprar</span>
            <div className="seg">
              {QUANTIDADES.map((q) => (
                <button key={q} className={qty === q ? "on" : ""} onClick={() => setQty(q)}>
                  ×{q}
                </button>
              ))}
            </div>
          </div>

          {desbloqueados.map((b) => {
            const n = gatos[b.id] ?? 0;
            const custo = custoDaCompra(gatos, b.id, qty);
            const podeComprar = peixes >= custo;
            const prodPredio = b.producaoPorGato * n;
            const visiveis = Math.min(n, MAX_SHOWN);
            const art = artOf(b.id);
            const d = densidade(n);
            const stripStyle: CSSProperties = {
              ["--cat-h" as string]: `${d.alturaPx}px`,
              ["--cat-ov" as string]: `${d.sobreposicaoPx}px`,
            };
            return (
              <div className="lane" key={b.id} style={{ backgroundImage: `url(${art.lane})` }}>
                <div className="lane-plate" title={b.descricao}>
                  <img className="lane-plate-ico" src={art.icone} alt={b.nome} />
                  <span className="lane-plate-nome">{b.nome}</span>
                </div>

                <div className="lane-stage">
                  <div className="lane-meta">
                    <span className="lane-cnt">
                      {fmt(n)} <img className="cnt-cat" src="/favicon_king.png" alt="gatos" />
                    </span>
                    <span className="lane-prod"><strong>{fmt(prodPredio)}</strong> peixes/s</span>
                  </div>
                  <div className="strip" style={stripStyle}>
                    {Array.from({ length: visiveis }, (_, i) => (
                      <img
                        className="cd"
                        key={i}
                        src={art.gato}
                        alt=""
                        style={{ animationDelay: `${(i % 9) * 0.16}s`, zIndex: i }}
                      />
                    ))}
                    {n > MAX_SHOWN && <span className="more">+{fmt(n - MAX_SHOWN)}</span>}
                  </div>
                </div>

                <button
                  className="buy"
                  disabled={!podeComprar}
                  onClick={() => comprarGatos(b.id, qty)}
                >
                  <span className="buy-label">Comprar ×{qty}</span>
                  <span className="cost">🐟 {fmt(custo)}</span>
                </button>
              </div>
            );
          })}

          {proximo && (
            <div className="lane lane-locked" aria-hidden="true">
              <div className="lane-plate">
                <span className="lock-ico">🔒</span>
              </div>
              <div className="lane-stage lane-stage-locked">
                <div className="locked-copy">
                  <b>Prédio bloqueado</b>
                  <span>
                    Acumule {fmt(proximo.desbloqueio)} peixes na run para revelar
                    {" "}({fmt(Math.max(0, proximo.desbloqueio - lifetime))} restantes)
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="foot">
        Teste de arte + UI (claro imperial). Prédios sem asset próprio (peixaria, banco) reusam a
        Caixa por ora. Enxame denso, teto de {MAX_SHOWN} gatos por lane.
      </footer>
    </div>
  );
}
