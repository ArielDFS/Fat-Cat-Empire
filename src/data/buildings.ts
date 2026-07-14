/**
 * CONTEÚDO — prédios. Só dados, zero lógica (GAME_DESIGN.md §9).
 *
 * O `id` bate com o nome dos assets em `src/assets/` (ART_STYLE.md §7).
 * Os 4 prédios e seus números vêm da tabela §3.3. Custo base, produção/gato e limiar de
 * desbloqueio são alvo de balanceamento (§8) — mexer aqui é o jeito certo de ajustar o ritmo,
 * ao contrário das constantes `[TRAVADO]` de §3.1.
 */

export type TipoGato = "rua" | "pescador" | "peixeiro" | "banqueiro";

export interface Building {
  /** Casa com o nome dos assets (ex.: bld_caixa_n1.png, cat_rua.png). */
  readonly id: string;
  readonly nome: string;
  readonly descricao: string;
  readonly tipoGato: TipoGato;
  /** Custo do 1º gato (peixes). */
  readonly custoBasePorGato: number;
  /** Produção de 1 gato (peixes/s). */
  readonly producaoPorGato: number;
  /** Peixes acumulados na run para o prédio aparecer. */
  readonly desbloqueio: number;
  /** Marcos de gatos que destravam habilidades / mudança visual. */
  readonly marcos: readonly number[];
}

export const BUILDINGS: readonly Building[] = [
  {
    id: "caixa_papelao",
    nome: "Caixa de Papelão",
    descricao: "O berço de toda grande civilização felina.",
    tipoGato: "rua",
    custoBasePorGato: 15,
    producaoPorGato: 0.1,
    desbloqueio: 0,
    marcos: [10, 25, 50, 100],
  },
  {
    id: "barraca_peixe",
    nome: "Barraca de Peixe",
    descricao: "Onde os gatos descobriram que peixe também vem de fora do lixo.",
    tipoGato: "pescador",
    custoBasePorGato: 100,
    producaoPorGato: 1,
    desbloqueio: 250,
    marcos: [10, 25, 50, 100],
  },
  {
    id: "peixaria_beco",
    nome: "Peixaria do Beco",
    descricao: "Atacado de sardinha. Cheiro forte, lucro mais forte.",
    tipoGato: "peixeiro",
    custoBasePorGato: 1_100,
    producaoPorGato: 8,
    desbloqueio: 8_000,
    marcos: [10, 25, 50, 100],
  },
  {
    id: "banco_atum",
    nome: "Banco do Atum",
    descricao: "Guardam atum em cofres. Ninguém sabe por quê, mas rende.",
    tipoGato: "banqueiro",
    custoBasePorGato: 12_000,
    producaoPorGato: 47,
    desbloqueio: 120_000,
    marcos: [10, 25, 50, 100],
  },
] as const;
