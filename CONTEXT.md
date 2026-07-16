# Fat Cat Empire (codinome: Império Felino)

Idle incremental de humor cartunesco: gatos de rua transformam um beco num império absurdo.
**Fat Cat Empire** é o título público; **Império Felino** é o codinome interno usado nos docs e no código.
Este documento é o **glossário** do projeto — a linguagem canônica. Não é spec nem lista de
decisões (essas moram em `GAME_DESIGN.md` e em `docs/adr/`). Se um termo aqui conflita com o
que você ia escrever, use o daqui ou mude aqui primeiro.

## Gênero

**Incremental híbrido** (idle + clicker): mescla Cookie Clicker (produção passiva) e
Clicker Heroes (clique como build legítima). O jogador aumenta a **quantidade** de gatos em
poucos Prédios e vê o número subir sozinho, **e** pode investir num eixo de **clique** ativo.
Ver [ADR-0001](docs/adr/0001-idle-clicker-hibrido.md).
_Não é_ um **idle de coleção / gacha** (AFK Arena): não se colecionam personagens individuais.
_Não é_ mais um idle puro (o clique deixou de ser vestigial).

**Build ativa** vs. **Build idle**:
As duas maneiras de investir uma Run — no eixo de **clique** (rende presente) ou de **produção
passiva** (rende ausente). A escolha entre elas é a principal decisão estratégica do jogo.
_Avoid_: DPS, playstyle.

## Mundo

**Beco**:
O cenário único do slice, que se transforma visualmente conforme o império cresce.
_Avoid_: mapa, fase, level, cenário.

## Produção

**Prédio**:
Uma estrutura **fixa**, desbloqueada uma única vez, que hospeda **um tipo de gato**. É o *lugar*,
não a unidade que se multiplica. Ex.: Caixa de Papelão, Barraca de Peixe. Prédios se destravam em
**cadeia**: comprar o 1º gato de um Prédio revela o próximo.
_Avoid_: negócio, empresa, estação, slot.

**Obra**:
O **prédio-virada** de uma Era: um Prédio produtor normal (hospeda gatos, tem custo/produção) que é
o **último da cadeia** daquela Era. **Construí-la pela primeira vez** (o 1º gasto de peixes nela) é o
**ato que vira a Era** — troca o mundo, dá a fanfarra e revela o 1º Prédio da Era seguinte. Ex.:
Prefeitura (vira para a Vila), Centro de Pesquisas Espaciais (vira para a Galáxia). "Obra" = a grande
construção civil que inaugura a era, não obra de arte. Ver GAME_DESIGN §4.5.
_Avoid_: monumento (a Obra **produz**), marco (isso é o marco de gatos, §3.4), landmark.

**Gato**:
O **trabalhador anônimo** de um Prédio — a unidade que o jogador compra em **quantidade** e que
gera Peixes. Não tem identidade individual; sua identidade é o **tipo**, dado pelo Prédio que o
hospeda (gato de rua, gato peixeiro, gato pescador…).
_Avoid_: unidade, worker, funcionário, personagem, cópia.

**Tipo de gato**:
A espécie de Gato associada a um Prédio. Dá sabor e nome ao enxame daquele Prédio.
_Avoid_: classe, raça, categoria.

**Artefato**:
Item de **endgame** — a árvore de **meta-progressão permanente**, comprada com Coroas Felinas,
no espírito dos *Ancients* do Clicker Heroes. **Fora do vertical slice** (ver backlog); existe no
glossário para que a linguagem não seja reinventada quando chegar a hora.
_Avoid_: upgrade, buff, habilidade (Habilidade é sistema de slice, por Prédio; Artefato é endgame, global).

## Habilidades

**Habilidade ativa**:
Efeito **acionável, com cooldown**, hospedado em **Prédios específicos**. Dá um *burst* de Peixes
por clique numa janela curta. É o motor da **Build ativa**.
_Avoid_: skill, magia, spell, poder, ability.

**Habilidade passiva**:
Melhoria **permanente e comprável** destravada ao atingir um **marco de gatos** num Prédio. Vem em
dois sabores — **Passiva de Produção** e **Passiva de Clique** — que competem pelos mesmos Peixes.
Não é mais sinônimo de "Build idle": a de Produção alimenta a idle, a de Clique alimenta a ativa.
_Avoid_: upgrade (ambíguo com o sistema antigo do v0.1), buff.

**Passiva de Produção**:
Habilidade passiva que multiplica a **produção passiva** daquele Prédio (idle). Rende presente **e**
ausente. É o motor da **Build idle**. Ver [ADR-0002](docs/adr/0002-passiva-de-clique.md).
_Avoid_: passiva de idle, upgrade de produção.

**Passiva de Clique**:
Habilidade passiva que aumenta o **poder de clique** (efeito **global**, apesar de morar num Prédio).
**Invisível offline** — não rende ausente —, o que a mantém no eixo ativo sem quebrar "idle rende
melhor ausente". É um dos motores da **Build ativa**. Ver [ADR-0002](docs/adr/0002-passiva-de-clique.md).
_Avoid_: buff de clique, upgrade de clique.

**Habilidade global**:
Melhoria **permanente** de efeito **global** (multiplica a produção ou o clique do jogo inteiro),
que **sobrevive à Nova Dinastia** — a única categoria de habilidade que atravessa a Run. Não mora
num Prédio nem se compra com Peixes: é **concedida** por um marco do meta-jogo. Distinta da Passiva
de Clique (que é global no *efeito* mas é de Prédio, comprável e zera na Dinastia). Ver GAME_DESIGN §3.6.
_Avoid_: habilidade passiva (essa é de Prédio e zera), buff global.

**Selo Imperial**:
A primeira **Habilidade global** — o **carimbo imperial** estampado na Caixa de Papelão ao fundar a
**1ª Nova Dinastia**. Concede **produção global ×1,5**, permanente. É a primeira recompensa que não é
Coroa a atravessar a Dinastia (por isso o §6 reseta tudo *exceto* o Selo). "Selo" = sinete/carimbo do
império, não vedação nem selo postal. Ver GAME_DESIGN §3.6.
_Avoid_: selo de vedação, carimbo (use "Selo Imperial"), bônus de prestígio (isso é a Coroa).
> **Revisto ([ADR-0004](docs/adr/0004-corte-lendaria-e-rumo-hibrido.md)):** o Selo vira o **Gato
> Lendário #0** (recrutado de graça na 1ª Dinastia, ×1,5 produção) — unifica com a Corte Lendária,
> some o caso especial. Migração pendente.

## Recursos

**Peixe**:
O recurso da **run** — produzido pelos Gatos, gasto para comprar Gatos e desbloquear Prédios.
Zera na Nova Dinastia.
_Avoid_: moeda, dinheiro, ouro, comida.

**Coroa Felina**:
O recurso **permanente**, ganho ao fundar uma Nova Dinastia. É a **moeda gastável** da **Corte
Lendária** (recruta e sobe de nível os Gatos Lendários) — o vetor de progresso permanente do jogo.
Escala por `cbrt(peixes_gastos_na_run)`. Ver [ADR-0004](docs/adr/0004-corte-lendaria-e-rumo-hibrido.md).
_Avoid_: prestígio (isso é o ato), gema, cristal, ponto.
> **Histórico:** até a v0.6 a Coroa era **contagem não-gasta** que dava `+2%/produção` (`CROWN_BONUS`).
> O ADR-0004 a tornou gastável e matou o bônus (o buff agora vem dos Lendários). Migração pendente.

**Gato Lendário**:
Um gato **com nome, rosto e arte única** — o oposto do Gato trabalhador anônimo (e **depende** dele
pra saltar). Recrutado e melhorado na **Corte Lendária** com **Coroas Felinas**; cada um dá um **perk
global permanente** de papel próprio (produção, clique, custo, offline, adianta-Era). É a forma
concreta dos "Artefatos" do endgame. Coleção convergente (todos pegam todos no fim). Ver §4.6.7 e
[ADR-0004](docs/adr/0004-corte-lendaria-e-rumo-hibrido.md).
_Avoid_: herói, personagem jogável, unidade (o Lendário não trabalha na lane; é meta), gacha.

## Ciclo

**Run**:
Uma partida do começo até fundar a próxima Nova Dinastia. Tudo o que é de run (Peixes, Gatos,
Prédios) zera ao final; só o permanente sobrevive.
_Avoid_: sessão, tentativa, ciclo, jogo.

**Nova Dinastia**:
O ato de **prestígio**: reseta a run em troca de Coroas Felinas e um bônus global permanente.
_Avoid_: prestígio (use "Nova Dinastia" para o ato; "prestígio" só como termo de gênero), rebirth, reset.

**Era**:
O **grau de escala civilizacional** da run — um degrau que o império **sobe** ao **construir a Obra**
que inaugura a próxima Era: **beco → vila → cidade → metrópole → império → galáxia** (não são sabores
do mesmo beco). Cada Era tem uma **escala** (o degrau legível) e um **nome** próprio, o trocadilho
(Beco Esquecido, Vila do Ronrom, Gatópolis, Miadópolis, Império dos Bigodes, Via-Láctea Felina).
Cruzar uma Era dá **título**, um **empurrão de peixes** (lump), a **fanfarra** e **troca o mundo de
fundo inteiro**. Reseta na **Nova Dinastia**. O slice já traça a escada inteira comprimida em 6; o
jogo completo a **estica** (mais Eras entre estas). Ver GAME_DESIGN.md §4.5.
_Avoid_: nível, fase, tier, **estágio**. ("Estágio" foi aposentado: nem o prédio nem o beco têm mais
estágios visuais — ambos foram cortados em grelha; a evolução visual é a **troca de mundo por Era**.)

**Escala** (da Era):
O degrau **legível** de uma Era (Beco, Vila, Cidade, Metrópole, Império, Galáxia) — o que sobe de
propósito, para o jogador *sentir* a civilização crescer. Distinto do **nome** próprio da Era, que é
a piada. Ver GAME_DESIGN.md §4.5.
_Avoid_: usar "escala" para tamanho de asset (isso é o §4 do ART_STYLE); aqui é o degrau da Era.
