/**
 * CONTEÚDO — prédios (GAME_DESIGN.md §9). Só dados, zero lógica de jogo.
 *
 * ## A escada completa: 6 Eras × 6 prédios = 36 (§4.6.9)
 *
 * Cada Era (§4.5) é uma cadeia de 6 prédios cujo **último é a Obra** (`ehObra`) — o prédio-virada
 * que inaugura a Era seguinte (CONTEXT: "Obra"). Beco → Vila → Cidade → Metrópole → Império → Galáxia.
 *
 * ## A curva `[v0.7 — suavizada, §4.6.3]`
 *
 * Os números NÃO saem do feeling caso a caso. Os **4 pilotos (i=0..3) são os valores canônicos do
 * Cookie Clicker** (15/0,1 · 100/1 · 1.100/8 · 12.000/47 — §3.2, ritmo do §8 validado sobre eles).
 * Do **i=4 em diante** a escada é geométrica **suavizada**, re-ancorada no Píer (i=3):
 *
 *     custoBasePorGato(i≥4) = 12.000 · 4,5^(i-3)     (custo ×4,5/prédio)
 *     producaoPorGato(i≥4)  = 47     · 4,0^(i-3)     (produção ×4,0/prédio)
 *
 * **Por que ×4,5 (e não o ×9,283 canônico do CC):** o alvo é o modelo **híbrido tipo Cookie Clicker
 * — campanha finita + motor endless** (ver §4.6). Curva suave = mais prédios por faixa de magnitude,
 * prédios antigos relevantes por mais tempo, progressão granular (não "one-shot"). O 36º custa
 * ~9,6e24 (24 ordens de grandeza vs 34 no ×9,283); 22 prédios cabem no inteiro exato do float64
 * (9e15), então `break_infinity.js` só é preciso muito além do fim da campanha (§9/§13, adiado).
 * A razão custo/produção sobe de ~150 a ~8.000 de propósito (a "eficiência decrescente" que empurra
 * pro prestígio); quem a restaura é o vetor permanente (Lendários, §4.6.7) e o multiplicador de Era.
 * Há um degrau proposital no i=3→4 (do ×9,283 dos pilotos pro ×4,5): pilotos preservados, cauda suave.
 *
 * ## Progressão (motor v0.6, ADR-0003)
 *
 * A **ordem do array É a cadeia de compra**: comprar o 1º gato de um prédio revela o próximo
 * (`predioDesbloqueado` em `state/store.ts` deriva o unlock de `gatos`, sem flag persistido). Não há
 * mais `desbloqueio` (limiar de `lifetime`) — o gate é o custo crescente do 1º gato (auto-pacing).
 * A **Obra** (`ehObra`, o 6º de cada Era) é o prédio-virada: construí-la sobe a Era (§4.6.9). Manter
 * o array em **ordem de custo crescente** é obrigatório (a cadeia e a curva assumem isso).
 *
 * Custo base e produção/gato são alvo de balanceamento (§8) — não `[TRAVADO]` como §3.1.
 * Nomes/tipos são a camada de humor (§1). Arte (ícone/lane/gato) mora em `ui/buildingArt.ts`
 * (id → asset), com fallback: só os 4 pilotos têm PNG hoje (ART_STYLE, pipeline à mão).
 */

/** Tipo (espécie) de gato de um prédio — dá sabor ao enxame. Livre (um por prédio); ver CONTEXT. */
export type TipoGato = string;

export interface Building {
  /** Casa com o nome dos assets em `ui/buildingArt.ts`. */
  readonly id: string;
  readonly nome: string;
  readonly descricao: string;
  readonly tipoGato: TipoGato;
  /** Era (1..6) à qual o prédio pertence (§4.5/§4.6.1). */
  readonly era: number;
  /** É a Obra (prédio-virada, último da cadeia da Era)? Construí-la vira a Era (§4.6.9). */
  readonly ehObra: boolean;
  /** Custo do 1º gato (peixes). Curva geométrica no índice global (topo do arquivo). */
  readonly custoBasePorGato: number;
  /** Produção de 1 gato (peixes/s). Curva geométrica no índice global. */
  readonly producaoPorGato: number;
  /** Marcos de gatos que destravam as Habilidades passivas do prédio (§3.4). */
  readonly marcos: readonly number[];
}

/** Todo prédio tem os mesmos 4 marcos de gatos (§3.4). */
const MARCOS = [10, 25, 50, 100] as const;

export const BUILDINGS: readonly Building[] = [
  // ── Era 1 · Beco Esquecido ──────────────────────────────────────────────────────────────────
  {
    id: "caixa_papelao",
    nome: "Caixa de Papelão",
    descricao: "O berço de toda grande civilização felina.",
    tipoGato: "rua",
    era: 1,
    ehObra: false,
    custoBasePorGato: 15,
    producaoPorGato: 0.1,
    marcos: MARCOS,
  },
  {
    id: "barraca_peixe",
    nome: "Barraca de Peixe",
    descricao: "Onde os gatos descobriram que peixe também vem de fora do lixo.",
    tipoGato: "peixeiro",
    era: 1,
    ehObra: false,
    custoBasePorGato: 100,
    producaoPorGato: 1,
    marcos: MARCOS,
  },
  {
    id: "miaurcado",
    nome: "Miaurcado",
    descricao: "O mercado do beco: peixe, fruta e fofoca no mesmo balcão.",
    tipoGato: "feirante",
    era: 1,
    ehObra: false,
    custoBasePorGato: 1_100,
    producaoPorGato: 8,
    marcos: MARCOS,
  },
  {
    id: "pier_pesca",
    nome: "Píer de Pesca",
    descricao: "O beco chegou ao mar: gatos fisgando atum direto da fonte.",
    tipoGato: "pescador",
    era: 1,
    ehObra: false,
    custoBasePorGato: 12_000,
    producaoPorGato: 47,
    marcos: MARCOS,
  },
  {
    id: "latao_gourmet",
    nome: "Latão Gourmet",
    descricao: "O lixo de um gato é o banquete gourmet de outro.",
    tipoGato: "catador",
    era: 1,
    ehObra: false,
    custoBasePorGato: 54_000,
    producaoPorGato: 190,
    marcos: MARCOS,
  },
  {
    id: "prefeitura_vira_lata",
    nome: "Prefeitura de Vira-Lata",
    descricao: "O beco elege seu primeiro prefeito. Nasce a Vila.",
    tipoGato: "burocata",
    era: 1,
    ehObra: true,
    custoBasePorGato: 240_000,
    producaoPorGato: 750,
    marcos: MARCOS,
  },

  // ── Era 2 · Vila do Ronrom ──────────────────────────────────────────────────────────────────
  {
    id: "padaria_ronrom",
    nome: "Padaria Pão-de-Ronrom",
    descricao: "Croissants em formato de peixe, fresquinhos ao amanhecer.",
    tipoGato: "padeiro",
    era: 2,
    ehObra: false,
    custoBasePorGato: 1.1e6,
    producaoPorGato: 3_000,
    marcos: MARCOS,
  },
  {
    id: "moinho_bigodes",
    nome: "Moinho de Bigodes",
    descricao: "Mói ração premium ao sabor do vento e do ronrom.",
    tipoGato: "moleiro",
    era: 2,
    ehObra: false,
    custoBasePorGato: 4.9e6,
    producaoPorGato: 12_000,
    marcos: MARCOS,
  },
  {
    id: "chacara_catnip",
    nome: "Chácara de Catnip",
    descricao: "Plantação legalizada — e altamente lucrativa.",
    tipoGato: "fazendeiro",
    era: 2,
    ehObra: false,
    custoBasePorGato: 2.2e7,
    producaoPorGato: 48_000,
    marcos: MARCOS,
  },
  {
    id: "praca_ronrom",
    nome: "Praça do Ronrom",
    descricao: "Onde a vila inteira ronrona no mesmo tom.",
    tipoGato: "trovador",
    era: 2,
    ehObra: false,
    custoBasePorGato: 1e8,
    producaoPorGato: 190_000,
    marcos: MARCOS,
  },
  {
    id: "taverna_atum",
    nome: "Taverna do Atum",
    descricao: "Cerveja de peixe e causos até o amanhecer.",
    tipoGato: "taverneiro",
    era: 2,
    ehObra: false,
    custoBasePorGato: 4.5e8,
    producaoPorGato: 770_000,
    marcos: MARCOS,
  },
  {
    id: "portoes_gatopolis",
    nome: "Portões de Gatópolis",
    descricao: "A vila ergue muralhas e vira Cidade.",
    tipoGato: "guarda",
    era: 2,
    ehObra: true,
    custoBasePorGato: 2e9,
    producaoPorGato: 3.1e6,
    marcos: MARCOS,
  },

  // ── Era 3 · Gatópolis ───────────────────────────────────────────────────────────────────────
  {
    id: "miau_shopping",
    nome: "Miau-Shopping",
    descricao: "Três andares de arranhadores e comida importada.",
    tipoGato: "lojista",
    era: 3,
    ehObra: false,
    custoBasePorGato: 9.1e9,
    producaoPorGato: 1.2e7,
    marcos: MARCOS,
  },
  {
    id: "fabrica_racao",
    nome: "Fábrica de Ração",
    descricao: "Linha de montagem que cospe petisco sem parar.",
    tipoGato: "operario",
    era: 3,
    ehObra: false,
    custoBasePorGato: 4.1e10,
    producaoPorGato: 4.9e7,
    marcos: MARCOS,
  },
  {
    id: "banco_atum",
    nome: "Banco Central do Atum",
    descricao: "Guarda a fortuna felina em cofres refrigerados.",
    tipoGato: "banqueiro",
    era: 3,
    ehObra: false,
    custoBasePorGato: 1.8e11,
    producaoPorGato: 2e8,
    marcos: MARCOS,
  },
  {
    id: "arranha_ronrom",
    nome: "Arranha-Ronrom",
    descricao: "O primeiro arranha-céu com poste de arranhar em cada andar.",
    tipoGato: "executivo",
    era: 3,
    ehObra: false,
    custoBasePorGato: 8.3e11,
    producaoPorGato: 7.9e8,
    marcos: MARCOS,
  },
  {
    id: "radio_miau_fm",
    nome: "Rádio Miau FM",
    descricao: "Só toca miados — e o hit do momento.",
    tipoGato: "locutor",
    era: 3,
    ehObra: false,
    custoBasePorGato: 3.7e12,
    producaoPorGato: 3.2e9,
    marcos: MARCOS,
  },
  {
    id: "aeroporto_felino",
    nome: "Aeroporto Internacional Felino",
    descricao: "Decolam os primeiros voos; a cidade vira Metrópole.",
    tipoGato: "aviador",
    era: 3,
    ehObra: true,
    custoBasePorGato: 1.7e13,
    producaoPorGato: 1.3e10,
    marcos: MARCOS,
  },

  // ── Era 4 · Miadópolis ──────────────────────────────────────────────────────────────────────
  {
    id: "metro_miau",
    nome: "Metrô Miausubterrâneo",
    descricao: "Túneis que atravessam a metrópole num só miado.",
    tipoGato: "maquinista",
    era: 4,
    ehObra: false,
    custoBasePorGato: 7.5e13,
    producaoPorGato: 5e10,
    marcos: MARCOS,
  },
  {
    id: "bolsa_peixe",
    nome: "Bolsa do Peixe",
    descricao: "Compra atum na baixa, vende sardinha na alta.",
    tipoGato: "corretor",
    era: 4,
    ehObra: false,
    custoBasePorGato: 3.4e14,
    producaoPorGato: 2e11,
    marcos: MARCOS,
  },
  {
    id: "estudio_miaullywood",
    nome: "Estúdio Miaullywood",
    descricao: "Blockbusters onde o gato sempre cai de pé.",
    tipoGato: "ator",
    era: 4,
    ehObra: false,
    custoBasePorGato: 1.5e15,
    producaoPorGato: 8.1e11,
    marcos: MARCOS,
  },
  {
    id: "torre_ronron_tech",
    nome: "Torre Ronron-Tech",
    descricao: "Startups que prometem revolucionar o cochilo.",
    tipoGato: "programador",
    era: 4,
    ehObra: false,
    custoBasePorGato: 6.9e15,
    producaoPorGato: 3.2e12,
    marcos: MARCOS,
  },
  {
    id: "estadio_gatos",
    nome: "Estádio dos Gatos",
    descricao: "Cem mil gatos vaiando o juiz ao mesmo tempo.",
    tipoGato: "torcedor",
    era: 4,
    ehObra: false,
    custoBasePorGato: 3.1e16,
    producaoPorGato: 1.3e13,
    marcos: MARCOS,
  },
  {
    id: "palacio_imperial",
    nome: "Palácio Imperial dos Bigodes",
    descricao: "Coroado o imperador; a metrópole vira Império.",
    tipoGato: "nobre",
    era: 4,
    ehObra: true,
    custoBasePorGato: 1.4e17,
    producaoPorGato: 5.2e13,
    marcos: MARCOS,
  },

  // ── Era 5 · Império dos Bigodes ─────────────────────────────────────────────────────────────
  {
    id: "ministerio_ronrom",
    nome: "Ministério do Ronrom",
    descricao: "Burocracia imperial que carimba cada ronrom.",
    tipoGato: "ministro",
    era: 5,
    ehObra: false,
    custoBasePorGato: 6.3e17,
    producaoPorGato: 2.1e14,
    marcos: MARCOS,
  },
  {
    id: "legiao_bigodes",
    nome: "Legião dos Bigodes",
    descricao: "O exército felino marcha em perfeita sincronia.",
    tipoGato: "soldado",
    era: 5,
    ehObra: false,
    custoBasePorGato: 2.8e18,
    producaoPorGato: 8.3e14,
    marcos: MARCOS,
  },
  {
    id: "colonia_orbital",
    nome: "Colônia Orbital",
    descricao: "As primeiras casas de gato acima da atmosfera.",
    tipoGato: "colono",
    era: 5,
    ehObra: false,
    custoBasePorGato: 1.3e19,
    producaoPorGato: 3.3e15,
    marcos: MARCOS,
  },
  {
    id: "refinaria_antimateria",
    nome: "Refinaria de Antimatéria de Sardinha",
    descricao: "Extrai energia pura de uma única espinha.",
    tipoGato: "cientista",
    era: 5,
    ehObra: false,
    custoBasePorGato: 5.7e19,
    producaoPorGato: 1.3e16,
    marcos: MARCOS,
  },
  {
    id: "estaleiro_naves",
    nome: "Estaleiro de Naves-Peixe",
    descricao: "Constrói cruzadores em forma de atum.",
    tipoGato: "engenheiro",
    era: 5,
    ehObra: false,
    custoBasePorGato: 2.6e20,
    producaoPorGato: 5.3e16,
    marcos: MARCOS,
  },
  {
    id: "centro_pesquisas_espaciais",
    nome: "Centro de Pesquisas Espaciais",
    descricao: "O império rompe a órbita e alcança a Galáxia.",
    tipoGato: "astronauta",
    era: 5,
    ehObra: true,
    custoBasePorGato: 1.2e21,
    producaoPorGato: 2.1e17,
    marcos: MARCOS,
  },

  // ── Era 6 · Via-Láctea Felina ───────────────────────────────────────────────────────────────
  {
    id: "estacao_miaur",
    nome: "Estação Miaur",
    descricao: "A metrópole orbital de todos os felinos do sistema.",
    tipoGato: "cosmonauta",
    era: 6,
    ehObra: false,
    custoBasePorGato: 5.2e21,
    producaoPorGato: 8.5e17,
    marcos: MARCOS,
  },
  {
    id: "miau_buraco_negro",
    nome: "Miau-Buraco Negro",
    descricao: "Suga energia (e novelos) do horizonte de eventos.",
    tipoGato: "fisico",
    era: 6,
    ehObra: false,
    custoBasePorGato: 2.3e22,
    producaoPorGato: 3.4e18,
    marcos: MARCOS,
  },
  {
    id: "frota_interestelar",
    nome: "Frota Interestelar de Atum",
    descricao: "Mil naves caçando cardumes entre as estrelas.",
    tipoGato: "almirante",
    era: 6,
    ehObra: false,
    custoBasePorGato: 1.1e23,
    producaoPorGato: 1.4e19,
    marcos: MARCOS,
  },
  {
    id: "planeta_racao",
    nome: "Planeta-Ração",
    descricao: "Um mundo inteiro feito de petisco.",
    tipoGato: "terraformador",
    era: 6,
    ehObra: false,
    custoBasePorGato: 4.7e23,
    producaoPorGato: 5.4e19,
    marcos: MARCOS,
  },
  {
    id: "imperio_intergalactico",
    nome: "Império Intergaláctico",
    descricao: "Bandeira felina fincada em cada sistema estelar.",
    tipoGato: "imperador",
    era: 6,
    ehObra: false,
    custoBasePorGato: 2.1e24,
    producaoPorGato: 2.2e20,
    marcos: MARCOS,
  },
  {
    id: "trono_via_lactea",
    nome: "Trono da Via-Láctea",
    descricao: "O Gato Supremo reina sobre a galáxia. (E além? Em breve.)",
    tipoGato: "imperador_cosmico",
    era: 6,
    ehObra: true,
    custoBasePorGato: 9.6e24,
    producaoPorGato: 8.7e20,
    marcos: MARCOS,
  },
] as const;
