import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BUILDINGS } from "../data/buildings";
import { iniciarLoop } from "../core/loop";
import {
  useGame,
  prodPorSegundo,
  poderDeClique,
  custoDaCompra,
  predioDesbloqueado,
  habilidadesDoPredio,
  multiplicadorProducaoDoPredio,
} from "../state/store";
import { descreverEfeito, poolDe } from "../data/abilities";
import { iniciarAutoSave } from "../state/save";
import { artOf } from "./buildingArt";
import { DevPanel } from "./DevPanel";
import fishImg from "../assets/fish_click.png";
import coinImg from "../assets/fish_coin.png";
import skyBeco from "../assets/sky_beco.png";

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

/** Sufixos por potência de mil: "" 1e0 · K 1e3 · M 1e6 · B 1e9 · T 1e12. */
const SUFIXOS = ["", "K", "M", "B", "T"] as const;

/**
 * Formatação legível (pt-BR). Abaixo de 1.000, número cru (1 casa se pequeno e fracionário).
 * De 1.000 em diante, sufixo K/M/B/T com ~3 algarismos significativos. Sem letra correspondente
 * (≥ 1e15), cai em notação científica (ex.: "1,23e15").
 */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  const sinal = n < 0 ? "-" : "";
  const original = Math.abs(n);

  if (original < 1000) {
    const s = Number.isInteger(original) ? String(original) : original.toFixed(original < 10 ? 1 : 0);
    return sinal + s.replace(".", ",");
  }

  // Divisão iterativa: evita a imprecisão do log10 nas potências exatas de mil (1e9 virava "1000M").
  let abs = original;
  let tier = 0;
  while (abs >= 1000 && tier < SUFIXOS.length - 1) {
    abs /= 1000;
    tier++;
  }
  if (abs >= 1000) {
    // Estourou os sufixos (≥ 1e15): notação científica (ex.: "1,23e15").
    return sinal + original.toExponential(2).replace("+", "").replace(".", ",");
  }

  const casas = abs < 10 ? 2 : abs < 100 ? 1 : 0;
  let s = abs.toFixed(casas);
  if (parseFloat(s) >= 1000 && tier < SUFIXOS.length - 1) {
    abs /= 1000; // arredondou pra 1000 (ex.: 999,98M) → promove ao próximo sufixo (→ 1B)
    tier++;
    s = abs.toFixed(2);
  }
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, ""); // tira zeros à toa
  return sinal + s.replace(".", ",") + SUFIXOS[tier];
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
  const habilidades = useGame((s) => s.habilidades);
  const clicar = useGame((s) => s.clicar);
  const comprarGatos = useGame((s) => s.comprarGatos);
  const comprarHabilidade = useGame((s) => s.comprarHabilidade);
  const ganhoOffline = useGame((s) => s.ganhoOffline);
  const fecharModalOffline = useGame((s) => s.fecharModalOffline);

  const rate = prodPorSegundo({ gatos, coroas, habilidades });
  const clickPow = poderDeClique({ gatos, coroas, habilidades });

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
    <div className="app" style={{ ["--sky" as string]: `url(${skyBeco})` }}>
      <div className="skybg" aria-hidden="true" />
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
                    <img className="pop-fish" src={fishImg} alt="" aria-hidden="true" />
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
            const multProducao = multiplicadorProducaoDoPredio(habilidades, b.id, n);
            // Todas as passivas do prédio (visíveis desde o desbloqueio, §3.4 / req UI).
            const ups = habilidadesDoPredio(b.id, gatos, habilidades);
            const prodPredio = b.producaoPorGato * n * multProducao;
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
                      {multProducao > 1 && (
                        <span className="lane-mult" title="Bônus das Passivas de Produção">
                          ×{fmt(multProducao)}
                        </span>
                      )}
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
                  </div>
                </div>

                <div className="lane-ups">
                  {ups.map((u) => {
                    const pool = poolDe(u.efeito);
                    const estado = u.comprada
                      ? "comprada"
                      : u.desbloqueada
                        ? "aberta"
                        : "bloqueada";
                    const afford = peixes >= u.custo;
                    const clicavel = estado === "aberta";
                    return (
                      <button
                        key={u.id}
                        className="up"
                        data-pool={pool}
                        data-estado={estado}
                        data-afford={afford ? "1" : "0"}
                        aria-disabled={!clicavel}
                        onClick={() => {
                          if (clicavel) comprarHabilidade(u.id);
                        }}
                      >
                        <span className="up-ico" aria-hidden="true">{u.emoji}</span>
                        {estado === "comprada" && <span className="up-flag up-check">✓</span>}
                        {estado === "bloqueada" && <span className="up-flag up-lock">🔒</span>}
                        <span className="up-card" role="tooltip">
                          <span className="up-card-head">
                            <span className="up-card-emoji">{u.emoji}</span>
                            <b>{u.nome}</b>
                            <span className="up-card-pool">
                              {pool === "clique" ? "Clique" : "Produção"}
                            </span>
                          </span>
                          <span className="up-card-desc">{u.descricao}</span>
                          <span className="up-card-eff">{descreverEfeito(u.efeito)}</span>
                          <span className="up-card-foot">
                            {estado === "comprada"
                              ? "Comprada ✓"
                              : estado === "bloqueada"
                                ? `Abre com ${fmt(u.marco)} gatos`
                                : `🐟 ${fmt(u.custo)}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
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
        Teste de arte + UI (claro imperial). O Píer usa a lane e o gato próprios; ícone é
        placeholder até gerar o PNG. Enxame denso, teto de {MAX_SHOWN} gatos por lane.
      </footer>

      {import.meta.env.DEV && <DevPanel />}
    </div>
  );
}
