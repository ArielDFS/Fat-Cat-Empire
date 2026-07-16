import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BUILDINGS } from "../data/buildings";
import { iniciarLoop } from "../core/loop";
import {
  useGame,
  prodPorSegundo,
  poderDeClique,
  custoDaCompra,
  predioDesbloqueado,
  eraAtual,
  habilidadesDoPredio,
  multiplicadorProducaoDoPredio,
  corteUI,
} from "../state/store";
import { buffNoNivel } from "../domain/legendaries";
import type { TipoEfeitoLendario } from "../domain/legendaries";
import { descreverEfeito, poolDe } from "../data/abilities";
import { SELO_LENDARIO_ID } from "../data/legendaries";
import { eraPorNivel } from "../data/eras";
import { podeFundarNovaDinastia, coroasGanhasNaRun, resumoNovaDinastia } from "../domain/prestige";
import { iniciarAutoSave } from "../state/save";
import { artOf } from "./buildingArt";
import { artOfLendario } from "./legendaryArt";
import { skyDaEra } from "./eraArt";
import { DevPanel } from "./DevPanel";
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

/** Rótulo do papel de um Lendário (§4.6.7). */
const PAPEL_LENDARIO: Record<TipoEfeitoLendario, string> = {
  producaoMult: "Produção global",
  cliqueMult: "Poder de clique",
  offlineMult: "Ganho offline",
  lumpMult: "Virada de Era",
  custoReducao: "Custo dos gatos",
};

/** Descreve o buff de um Lendário: o total no nível atual, ou o efeito por-nível (nível 0 = oferta). */
function descreverBuffLendario(tipo: TipoEfeitoLendario, porNivel: number, nivel: number): string {
  if (nivel <= 0) {
    // Na oferta: mostra o efeito por nível.
    return tipo === "custoReducao"
      ? `−${Math.round(porNivel * 100)}% custo / nível`
      : `×${porNivel.toLocaleString("pt-BR")} / nível`;
  }
  const f = buffNoNivel(tipo, porNivel, nivel);
  return tipo === "custoReducao"
    ? `custo ×${f.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`
    : `×${f.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;
}

/** Numeral romano para o grau da Era (I..VI no slice). */
const ROMANOS = ["", "I", "II", "III", "IV", "V", "VI"] as const;
function romano(n: number): string {
  return ROMANOS[n] ?? String(n);
}

/** Quanto tempo a fanfarra de Era fica na tela antes de sumir sozinha (ms). */
const FANFARRA_MS = 4200;

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

  const [confirmandoDinastia, setConfirmandoDinastia] = useState(false);
  const [corteAberta, setCorteAberta] = useState(false);

  const peixes = useGame((s) => s.peixes);
  const lifetime = useGame((s) => s.lifetime);
  const coroas = useGame((s) => s.coroas);
  const gastos = useGame((s) => s.gastos);
  const gatos = useGame((s) => s.gatos);
  const habilidades = useGame((s) => s.habilidades);
  const lendarios = useGame((s) => s.lendarios);
  const ofertaDraft = useGame((s) => s.ofertaDraft);
  const rerollsFeitos = useGame((s) => s.rerollsFeitos);
  const eraMaxAtingida = useGame((s) => s.eraMaxAtingida);
  const temSelo = (lendarios[SELO_LENDARIO_ID] ?? 0) > 0;
  const dinastias = useGame((s) => s.dinastias);
  const eraFanfarra = useGame((s) => s.eraFanfarra);
  const clicar = useGame((s) => s.clicar);
  const comprarGatos = useGame((s) => s.comprarGatos);
  const comprarHabilidade = useGame((s) => s.comprarHabilidade);
  const novaDinastia = useGame((s) => s.novaDinastia);
  const recrutarLendario = useGame((s) => s.recrutarLendario);
  const rerollOferta = useGame((s) => s.rerollOferta);
  const subirNivelLendario = useGame((s) => s.subirNivelLendario);
  const ganhoOffline = useGame((s) => s.ganhoOffline);
  const fecharModalOffline = useGame((s) => s.fecharModalOffline);
  const fecharFanfarra = useGame((s) => s.fecharFanfarra);

  const rate = prodPorSegundo({ gatos, habilidades, lendarios });
  const clickPow = poderDeClique({ gatos, habilidades, lendarios });
  const eraNivel = eraAtual(gatos); // 1 + Obras construídas (§4.6.9)
  const era = eraPorNivel(eraNivel);
  const podeDinastia = podeFundarNovaDinastia(gastos);
  const resumoDinastia = resumoNovaDinastia(gastos, coroas);
  const corte = corteUI({ coroas, lendarios, ofertaDraft, rerollsFeitos, eraMaxAtingida });
  const temCorte = corte.coroas > 0 || corte.recrutados.length > 0;

  function confirmarDinastia() {
    novaDinastia();
    setConfirmandoDinastia(false);
  }

  // A fanfarra de Era some sozinha depois de FANFARRA_MS (o lump já foi creditado no cruzamento).
  useEffect(() => {
    if (!eraFanfarra) return;
    const id = window.setTimeout(fecharFanfarra, FANFARRA_MS);
    return () => window.clearTimeout(id);
  }, [eraFanfarra, fecharFanfarra]);

  // Confete da fanfarra: um leque de peixes/moedas/brilhos saindo do card. Memoizado por Era —
  // senão os ticks (que re-renderizam durante os ~4 s da fanfarra) re-sorteariam tudo a cada frame.
  const confete = useMemo(() => {
    if (!eraFanfarra) return [];
    return Array.from({ length: 18 }, (_, i) => {
      const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 130 + Math.random() * 190;
      return {
        tx: Math.cos(ang) * dist,
        ty: Math.sin(ang) * dist - 40, // leve viés pra cima (sobe e cai)
        rot: Math.random() * 720 - 360,
        sc: 0.65 + Math.random() * 0.8,
        delay: Math.random() * 0.22,
        dur: 1.1 + Math.random() * 0.8,
        kind: i % 3, // 0 = moeda, 1 = peixe, 2 = brilho
      };
    });
  }, [eraFanfarra]);

  // Cadeia de compra (§4.6.9): só mostra prédios cujo anterior já tem ≥1 gato.
  const desbloqueados = BUILDINGS.filter((b) => predioDesbloqueado(b, gatos));
  const proximo = BUILDINGS.find((b) => !predioDesbloqueado(b, gatos));
  // O prédio cujo 1º gato revela o `proximo` é o último desbloqueado (o anterior a ele na escada).
  const reveladorDoProximo = desbloqueados[desbloqueados.length - 1];

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
    <div className="app" style={{ ["--sky" as string]: `url(${skyDaEra(eraNivel)})` }}>
      <div className="skybg" aria-hidden="true" />

      {eraFanfarra && (
        <div className="fanfarra" role="status" aria-live="polite" onClick={fecharFanfarra}>
          <div className="fanfarra-rays" aria-hidden="true" />
          <div className="fanfarra-card">
            <span className="fanfarra-kicker">Nova Era do Império</span>
            <span className="fanfarra-num">Era {romano(eraFanfarra.nivel)}</span>
            <h2 className="fanfarra-nome">{eraFanfarra.nome}</h2>
            <p className="fanfarra-mundo">Seu império subiu de escala: <b>{eraFanfarra.escala}</b> 🐾</p>
          </div>
          <div className="fanfarra-burst" aria-hidden="true">
            {confete.map((p, i) => {
              const style: CSSProperties = {
                ["--tx" as string]: `${p.tx}px`,
                ["--ty" as string]: `${p.ty}px`,
                ["--rot" as string]: `${p.rot}deg`,
                ["--sc" as string]: `${p.sc}`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.dur}s`,
              };
              return (
                <span key={i} className="ff-p" style={style}>
                  {p.kind === 0 && <img src={coinImg} alt="" />}
                  {p.kind === 1 && <img src={fishImg} alt="" />}
                  {p.kind === 2 && <span className="ff-spark">✨</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
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
      {confirmandoDinastia && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setConfirmandoDinastia(false)}
        >
          <div
            className="modal modal-dinastia"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dinastia-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dinastia-titulo">Fundar Nova Dinastia? 👑</h2>
            <p>Você reinicia o império do zero — em troca de Coroas Felinas permanentes.</p>
            <div className="dinastia-cols">
              <div className="dinastia-col perde">
                <span className="dinastia-col-lab">Você perde</span>
                <ul>
                  <li>Todos os peixes</li>
                  <li>Todos os gatos</li>
                  <li>Prédios e passivas</li>
                  <li>Volta ao Beco (Era I)</li>
                </ul>
              </div>
              <div className="dinastia-col mantem">
                <span className="dinastia-col-lab">Você mantém</span>
                <ul>
                  <li>Coroas Felinas</li>
                  <li>Gatos Lendários</li>
                  {temSelo && <li>Selo Imperial</li>}
                  <li>Conquistas</li>
                </ul>
              </div>
            </div>
            <p className="dinastia-ganho">
              +{fmt(resumoDinastia.coroasGanhas)} 👑{" "}
              <span>(total {fmt(resumoDinastia.coroasDepois)})</span>
            </p>
            <p className="dinastia-mult">
              Coroas pra gastar na <b>Corte Lendária</b> (recrutar e evoluir Gatos Lendários).
            </p>
            {!temSelo && (
              <p className="dinastia-selo">
                🏅 E você ganha o <b>Selo Imperial</b> (Gato Lendário #0): produção ×1,5, pra sempre.
              </p>
            )}
            <div className="dinastia-acoes">
              <button
                className="dinastia-btn-cancel"
                onClick={() => setConfirmandoDinastia(false)}
              >
                Agora não
              </button>
              <button className="dinastia-btn-go" onClick={confirmarDinastia} autoFocus>
                Fundar Dinastia
              </button>
            </div>
          </div>
        </div>
      )}

      {corteAberta && (
        <div className="modal-backdrop" role="presentation" onClick={() => setCorteAberta(false)}>
          <div
            className="modal modal-corte"
            role="dialog"
            aria-modal="true"
            aria-labelledby="corte-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="corte-topo">
              <h2 id="corte-titulo">Corte Lendária</h2>
              <span className="corte-coroas" title="Coroas Felinas — a moeda da Corte">
                <span className="corte-coroas-ico" aria-hidden="true">👑</span> {fmt(corte.coroas)}
              </span>
            </div>

            {/* Recrutar — o herói: retratos grandes, escolha 1 de 3 */}
            {corte.poolVazio ? (
              <p className="corte-vazio">
                🏆 Coleção completa — todos os Lendários já disponíveis estão na sua Corte. Alcance
                Eras mais altas para destravar novos.
              </p>
            ) : (
              <section className="corte-draft">
                <div className="corte-sec-cab">
                  <h3 className="corte-h">Recrutar</h3>
                  <span className="corte-h-sub">escolha 1 de {corte.oferta.length}</span>
                </div>
                <div className="corte-draft-cards">
                  {corte.oferta.map((o) => (
                    <article key={o.def.id} className="corte-hero">
                      <div className="corte-hero-art">
                        {artOfLendario(o.def.id) ? (
                          <img src={artOfLendario(o.def.id)} alt={o.def.nome} />
                        ) : (
                          <span className="corte-hero-emoji" aria-hidden="true">{o.def.emoji}</span>
                        )}
                      </div>
                      <div className="corte-hero-body">
                        <b className="corte-hero-nome">{o.def.nome}</b>
                        <span className="corte-papel">
                          {PAPEL_LENDARIO[o.def.efeito.tipo]} ·{" "}
                          {descreverBuffLendario(o.def.efeito.tipo, o.def.efeito.porNivel, 0)}
                        </span>
                        <span className="corte-hero-desc">{o.def.descricao}</span>
                        <button
                          className="corte-recrutar-btn"
                          disabled={!o.podeRecrutar}
                          onClick={() => recrutarLendario(o.def.id)}
                        >
                          Recrutar <span className="corte-preco">👑 {fmt(o.custoRecrutar)}</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <button
                  className="corte-reroll"
                  disabled={!corte.podeReroll}
                  onClick={() => rerollOferta()}
                >
                  🎲 Trocar oferta · 👑 {fmt(corte.custoReroll)}
                </button>
              </section>
            )}

            {/* Sua Corte — a tira de campeões recrutados */}
            {corte.recrutados.length > 0 && (
              <section className="corte-roster-sec">
                <h3 className="corte-h">Sua Corte · {corte.recrutados.length}</h3>
                <div className="corte-roster">
                  {corte.recrutados.map((r) => (
                    <article key={r.def.id} className="corte-champ">
                      <div className="corte-champ-art">
                        {artOfLendario(r.def.id) ? (
                          <img src={artOfLendario(r.def.id)} alt={r.def.nome} />
                        ) : (
                          <span className="corte-champ-emoji" aria-hidden="true">{r.def.emoji}</span>
                        )}
                        <span className="corte-nivel">nv {r.nivel}</span>
                      </div>
                      <b className="corte-champ-nome">{r.def.nome}</b>
                      <span className="corte-champ-buff">
                        {descreverBuffLendario(r.def.efeito.tipo, r.def.efeito.porNivel, r.nivel)}
                      </span>
                      <button
                        className="corte-up-btn"
                        disabled={!r.podeSubir}
                        onClick={() => subirNivelLendario(r.def.id)}
                        title="Subir nível"
                      >
                        ▲ 👑 {fmt(r.custoProxNivel)}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <button className="modal-ok" onClick={() => setCorteAberta(false)}>Fechar</button>
          </div>
        </div>
      )}

      <header className="hud">
        <div className="brand">
          <img className="brand-logo" src="/logo_lockup.png" alt="Fat Cat Empire" />
          <span className="tag">dev</span>
        </div>
        <div className="era-badge" title="A Era avança ao construir a Obra de cada Era (§4.6.9)">
          <span className="era-num">Era {romano(era.nivel)} · {era.escala}</span>
          <span className="era-nome">{era.nome}</span>
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
          {dinastias > 0 && (
            <div className="res res-dinastias" title="Nova Dinastias fundadas (§6)">
              <span className="res-ico res-seal" aria-hidden="true">🏅</span>
              <span className="res-txt"><span className="res-lab">Dinastias</span><b>{fmt(dinastias)}</b></span>
            </div>
          )}
          {temCorte && (
            <button
              className="corte-btn"
              onClick={() => setCorteAberta(true)}
              title="Corte Lendária — gaste Coroas em Gatos Lendários (§4.6.7)"
            >
              <span className="corte-btn-ico" aria-hidden="true">🐈‍⬛</span>
              <span className="corte-btn-txt">
                <b>Corte Lendária</b>
                <span>{corte.recrutados.length} gato{corte.recrutados.length === 1 ? "" : "s"}</span>
              </span>
            </button>
          )}
          {podeDinastia && (
            <button
              className="dynasty-btn"
              onClick={() => setConfirmandoDinastia(true)}
              title="Reinicia a run em troca de Coroas permanentes (§6)"
            >
              <span className="dynasty-ico" aria-hidden="true">👑</span>
              <span className="dynasty-txt">
                <b>Nova Dinastia</b>
                <span>+{fmt(coroasGanhasNaRun(gastos))} coroas</span>
              </span>
            </button>
          )}
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
            <p className="vitrine" title="Total de peixes já produzidos nesta run (estatística)">
              🐟 {fmt(lifetime)} pescados na run
            </p>
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
            const custo = custoDaCompra(gatos, lendarios, b.id, qty);
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
                  {b.id === "caixa_papelao" && temSelo && (
                    <span
                      className="lane-selo"
                      title="Selo Imperial — produção global ×1,5, permanente (§3.6)"
                    >
                      <img src="/favicon_king.png" alt="Selo Imperial" />
                    </span>
                  )}
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
                    {reveladorDoProximo
                      ? `Compre o 1º gato de ${reveladorDoProximo.nome} para revelar`
                      : "Compre o 1º gato para revelar o próximo prédio"}
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
