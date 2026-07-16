/**
 * Gatos Lendários (Corte Lendária) — a parte PURA (GAME_DESIGN.md §4.6.7, ADR-0004).
 *
 * Não importa nada de `ui/`, `state/` nem `data/` (a regra de ouro de `production.ts`). O *conteúdo*
 * (elenco, papéis, tiers, constantes de custo) mora em `data/legendaries.ts`; aqui fica só a
 * matemática testável: o buff de um Lendário por nível, como os buffs se combinam, os custos em
 * Coroas (recrutar / subir nível / reroll) e o sorteio da oferta do draft.
 *
 * O tipo de efeito é um **espelho estrutural** de `EfeitoLendario` em `data/` — replicado de
 * propósito pra não quebrar a regra de ouro. A store faz a ponte (lê o elenco + os níveis e monta
 * a lista de efeitos ativos que estas funções consomem).
 */

/** Papel de um Lendário. Cada um mexe num eixo do jogo. */
export type TipoEfeitoLendario =
  | "producaoMult" // ×fator na produção global (o quebra-parede)
  | "cliqueMult" // ×fator no poder de clique (global)
  | "offlineMult" // ×fator no ganho offline
  | "lumpMult" // ×fator no lump de virada de Era (adianta-Era)
  | "custoReducao"; // −fração no custo dos gatos (multiplicador < 1, com piso)

/** Piso do multiplicador de custo — a redução (`custoReducao`) nunca leva o custo abaixo disto. */
export const PISO_CUSTO = 0.1;

/**
 * Buff **multiplicativo** de um Lendário no nível `nivel` (≥ 0). Nível 0 = não recrutado ⇒ neutro.
 *
 * - Papéis de bônus (produção/clique/offline/lump): `porNivel ^ nivel` (composto — nível 1 já dá
 *   `porNivel`). É o que faz o vetor permanente furar paredes exponenciais (ADR-0004).
 * - `custoReducao`: multiplicador de custo `(1 − porNivel)^nivel`, clampado ao `PISO_CUSTO` (o custo
 *   nunca vira grátis).
 */
export function buffNoNivel(tipo: TipoEfeitoLendario, porNivel: number, nivel: number): number {
  const n = Math.max(0, Math.floor(nivel));
  if (n === 0) return 1;
  if (tipo === "custoReducao") {
    return Math.max(PISO_CUSTO, Math.pow(1 - porNivel, n));
  }
  return Math.pow(porNivel, n);
}

/** Um Lendário recrutado, achatado pra o domain (a store monta a partir de `data/` + níveis). */
export interface EfeitoAtivo {
  readonly tipo: TipoEfeitoLendario;
  readonly porNivel: number;
  readonly nivel: number;
}

/** Os multiplicadores globais que a Corte concede, por eixo. Tudo 1 = nenhum Lendário. */
export interface MultsLendarios {
  readonly producao: number;
  readonly clique: number;
  readonly offline: number;
  readonly lump: number;
  readonly custoGatos: number;
}

/** Combina os buffs de todos os Lendários recrutados (produto por eixo). */
export function multiplicadoresLendarios(efeitos: readonly EfeitoAtivo[]): MultsLendarios {
  const m = { producao: 1, clique: 1, offline: 1, lump: 1, custoGatos: 1 };
  for (const e of efeitos) {
    const f = buffNoNivel(e.tipo, e.porNivel, e.nivel);
    switch (e.tipo) {
      case "producaoMult":
        m.producao *= f;
        break;
      case "cliqueMult":
        m.clique *= f;
        break;
      case "offlineMult":
        m.offline *= f;
        break;
      case "lumpMult":
        m.lump *= f;
        break;
      case "custoReducao":
        m.custoGatos *= f;
        break;
    }
  }
  return m;
}

/** Custo em Coroas pra subir do nível `nivelAtual` para o próximo. `nivelAtual` 0 = recrutar (nível 1). */
export function custoSubirNivel(nivelAtual: number, base: number, growth: number): number {
  return Math.ceil(base * Math.pow(growth, Math.max(0, nivelAtual)));
}

/** Custo em Coroas pra recrutar o (`nJaRecrutados`+1)-ésimo Lendário — cresce com a coleção. */
export function custoRecrutar(nJaRecrutados: number, base: number, growth: number): number {
  return Math.ceil(base * Math.pow(growth, Math.max(0, nJaRecrutados)));
}

/**
 * Custo em Coroas do próximo reroll da oferta. `nRerollsFeitos` conta os rerolls desde o último
 * recrutamento (zera ao recrutar) — o custo sobe pra o reroll não virar treadmill (§4.6.8, o piso).
 */
export function custoReroll(nRerollsFeitos: number, base: number, growth: number): number {
  return Math.ceil(base * Math.pow(growth, Math.max(0, nRerollsFeitos)));
}

/**
 * Sorteia `k` ids distintos de `idsDisponiveis` (Fisher-Yates parcial) usando `rng` (`() => [0,1)`).
 * A impureza do RNG fica FORA (a store passa `Math.random`); aqui é determinístico dado o `rng`,
 * então testável com um mock. Se o pool tem menos que `k`, devolve todos (embaralhados).
 */
export function sortearOferta(
  idsDisponiveis: readonly string[],
  k: number,
  rng: () => number,
): string[] {
  const copia = [...idsDisponiveis];
  const out: string[] = [];
  for (let i = 0; i < k && copia.length > 0; i++) {
    const j = Math.min(copia.length - 1, Math.floor(rng() * copia.length));
    out.push(copia.splice(j, 1)[0]!);
  }
  return out;
}
