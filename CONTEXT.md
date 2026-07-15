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
não a unidade que se multiplica. Ex.: Caixa de Papelão, Barraca de Peixe.
_Avoid_: negócio, empresa, estação, slot.

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

## Recursos

**Peixe**:
O recurso da **run** — produzido pelos Gatos, gasto para comprar Gatos e desbloquear Prédios.
Zera na Nova Dinastia.
_Avoid_: moeda, dinheiro, ouro, comida.

**Coroa Felina**:
O recurso **permanente**, ganho ao fundar uma Nova Dinastia. No slice, concede bônus global que
atravessa runs; no endgame, será também a moeda que compra Artefatos. Deve **persistir como contagem**
(não some ao ser "gasta"), para continuar dando o bônus passivo mesmo depois de virar moeda.
_Avoid_: prestígio (isso é o ato), gema, cristal, ponto.

## Ciclo

**Run**:
Uma partida do começo até fundar a próxima Nova Dinastia. Tudo o que é de run (Peixes, Gatos,
Prédios) zera ao final; só o permanente sobrevive.
_Avoid_: sessão, tentativa, ciclo, jogo.

**Nova Dinastia**:
O ato de **prestígio**: reseta a run em troca de Coroas Felinas e um bônus global permanente.
_Avoid_: prestígio (use "Nova Dinastia" para o ato; "prestígio" só como termo de gênero), rebirth, reset.

**Era**:
O **grau civilizacional** da run — um degrau **nomeado** (Beco Esquecido → … → Beco Imperial) que o
império sobe conforme o lifetime de peixes cresce. Cruzar uma Era dá **título**, um **empurrão de
peixes** e a **fanfarra**; algumas disparam a transformação visual do **Beco**. Reseta na **Nova
Dinastia**. A escada completa vai até o interplanetário — os **distritos** são seus grandes saltos
(backlog). Ver GAME_DESIGN.md §4.5.
_Avoid_: nível, fase, tier; **estágio** (estágio é o visual do Beco/prédio; Era é o grau civilizacional).
