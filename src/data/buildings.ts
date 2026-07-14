/**
 * CONTEÚDO — prédios. Só dados, zero lógica (GAME_DESIGN.md §9).
 *
 * O `id` bate com o nome dos assets em `src/assets/` (ART_STYLE.md §7).
 * No passo 2 do §10 existe **só a Caixa de Papelão** — os outros 3 entram no passo 5.
 * Como o resto do jogo é dirigido por esta lista, adicioná-los depois é só estender o array.
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
] as const;
