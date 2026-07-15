# GAME_DESIGN.md — Fat Cat Empire (Vertical Slice v0.2)

> **Título público:** *Fat Cat Empire* · **codinome interno** (docs/código): *Império Felino*.
>
> **Este documento é a fonte da verdade.** Se o código discordar dele, o código está errado.
> Se uma ideia não está aqui, ela **não entra no slice** — vai para o backlog (§13).
> Números marcados como `[TRAVADO]` só mudam via decisão explícita registrada no changelog.
> Vocabulário canônico em [`CONTEXT.md`](CONTEXT.md); decisões estruturais em [`docs/adr/`](docs/adr/).

---

## 1. Pitch e pilares

Idle **incremental híbrido** (idle + clicker) de humor cartunesco: gatos de rua transformam um
beco num império absurdo, movidos a peixes, ronrons e ambição desproporcional.

| Pilar | Como se manifesta no slice |
|---|---|
| Progressão visível | O beco muda visualmente conforme os prédios sobem de nível e as lanes enchem de gatos |
| Humor constante | Todo nome de prédio, tipo de gato, habilidade e conquista é uma piada curta |
| Decisão real | **Build ativa (clique) vs. build idle (passiva)** — o jogador escolhe em que eixo investir cada Dinastia |
| Recompensa frequente | Números subindo, habilidade nova a cada poucos minutos, evento surpresa |

**Antipilar:** quantidade de sistemas. O slice existe para responder **uma** pergunta:
*"depois de 20 minutos, o jogador quer esperar mais 5 para comprar a próxima coisa?"*

> **Sobre o gênero (ver [ADR-0001](docs/adr/0001-idle-clicker-hibrido.md)):** este jogo mescla
> Cookie Clicker (produção passiva) e Clicker Heroes (clique como build legítima). O clique
> **não** é vestigial. Mas continua sendo um idle no coração: quem joga em segundo plano nunca
> pode ficar preso atrás de quem clica.

---

## 2. Escopo travado do slice

### Dentro
- 1 cenário (Beco Inicial), com transformação visual em 3 estágios
- 2 recursos: **Peixes** (run) e **Coroas Felinas** (permanente)
- 4 **prédios fixos**, cada um hospedando **um tipo de gato**
- **Gatos** como a unidade que se compra em quantidade (o produtor)
- Sistema de **Habilidades**: passivas (produção) e ativas (burst de clique)
- 3 gatos alocáveis ~~(removido — ver §4)~~
- 1 evento aleatório (Festival da Sardinha)
- 1 ciclo de prestígio (Nova Dinastia)
- **Eras do Império** — grau civilizacional por run, dirigido pelo lifetime (ver §4.5); só as Eras do Beco
- Save local + progresso offline
- 8 conquistas

### Fora (não negociável até o slice ser validado)
Multiplayer · backend · login · monetização · som (além de 3 SFX de placeholder) ·
Miadópolis, Praça Imperial, Domínio Cósmico · Ronrons, Influência, Sardinhas Cósmicas ·
**Artefatos** (árvore de endgame, ver §13) · raridades · árvore de legado ·
animações além de idle/trabalho.

---

## 3. Modelo econômico `[TRAVADO]`

### 3.1 Constantes globais

| Constante | Valor | Nota |
|---|---|---|
| `TICK_MS` | 100 | Lógica roda por delta real, não por contagem de ticks |
| `COST_GROWTH` | 1.15 | Crescimento exponencial do custo por **gato** |
| `CLICK_FACTOR` | 0.01 | Peixes por clique = produção/s × isto (mín. 1) |
| `OFFLINE_RATE` | 0.50 | 50% da produção normal |
| `OFFLINE_CAP_H` | 8 | Teto de horas acumuladas |
| `PRESTIGE_DIVISOR` | 1e6 | Escala da fórmula de coroas |
| `CROWN_BONUS` | 0.02 | +2% de produção global por coroa |

### 3.2 Custo

```
custo(n) = ceil( custo_base * COST_GROWTH^n )   // n = GATOS já comprados NAQUELE prédio
```

Curva derivada da progressão clássica de Cookie Clicker/Clicker Heroes (proporção custo/produção
validada por ~15 anos de gênero). Não invente uma nova antes de provar que a clássica não serve.
A única mudança em relação ao v0.1: a contagem é de **gatos dentro do prédio**, não de cópias do
prédio. É a mesma matemática, com ficção coerente (1 prédio cheio, não 400 prédios iguais).

### 3.3 Prédios

Cada prédio é **fixo, desbloqueado uma vez** ao acumular peixes na run (`desbloqueio`). Depois,
o jogador compra **gatos** dentro dele. Os prédios diferem pela **produção por gato**.

| # | Prédio | Tipo de gato | Custo base/gato | Produção/gato (peixes/s) | Desbloqueio (peixes acum.) |
|---|---|---|---|---|---|
| 1 | Caixa de Papelão | gatos de rua | 15 | 0,1 | 0 (inicial) |
| 2 | Barraca de Peixe | peixeiros | 100 | 1 | 250 |
| 3 | Miaurcado | feirantes | 1.100 | 8 | 8.000 |
| 4 | Píer de Pesca | pescadores | 12.000 | 47 | 120.000 |

> Limiares de desbloqueio são alvo de balanceamento (§8), não sagrados como as constantes de §3.1.
> Os 4 prédios acima são **pilotos** — o plano é acrescentar muitos mais em ordem de custo crescente
> (o Píer, ex-Banco do Atum, não é o teto da escada). Ver ART_STYLE §2C.

### 3.4 Marcos e Habilidades passivas

A cada marco de gatos **do mesmo prédio**, duas coisas acontecem:

```
marcos = [10, 25, 50, 100]
```

1. **Destrava uma Habilidade passiva** daquele prédio — uma melhoria **comprável** (com peixes):
   o marco *abre*, o jogador *compra* (modelo Cookie Clicker/Clicker Heroes). As passivas vêm em
   **dois sabores que competem pelos mesmos peixes** (ver [ADR-0002](docs/adr/0002-passiva-de-clique.md)):
   - **Passiva de Produção** — buffa a produção idle daquele prédio. Rende presente **e** ausente.
     Motor da **Build idle**.
   - **Passiva de Clique** — aumenta o **poder de clique** (efeito global, apesar de morar no prédio).
     **Invisível offline** (não rende ausente). Motor da **Build ativa**.
2. **Dispara a mudança visual** do prédio: nível 1 → 2 em 25 gatos, nível 2 → 3 em 100.

> **Decisão de design (v0.2):** isto **funde** os antigos "Upgrades" (§3.6 do v0.1) e o antigo
> "dobra automática por marco" (§3.4 do v0.1) num **único** sistema — habilidade passiva
> comprável, destravada por marco. Um sistema a menos.

**Arquétipos no slice (4)** — a variedade vem daqui, não de "todas ×2" (ADR-0002):

| Cód | Pool | Efeito | Inspiração |
|---|---|---|---|
| P1 | Produção | Multiplicador do prédio (×1,2 / ×1,5 / ×2) | CC — upgrades de prédio |
| P2 | Produção | Escala com o enxame (+X% de produção por gato daquele prédio) | CC — "Thousand Fingers"/"Fortune" |
| C1 | Clique | Multiplicador de clique (×1,5 / ×2, global) | CH — click damage |
| C2 | Clique | Clique colhe +X% da produção/s (sobe o `CLICK_FACTOR` efetivo) | CC — "clicking gains +% of CpS" |

> **Fora do slice (backlog §13):** sinergia entre prédios (P3) e clique crítico (C3) — cada um é
> "mais um sistema", adiado pelo antipilar (§1). Valores dos 4 arquétipos são balanceamento (§8).

**Distribuição pelos 16 slots (§8, ajustável no playtest):** meta **8 Produção / 8 Clique** —
- **Clique lidera:** a 1ª passiva do jogo (Caixa m10) é de Clique, "presenteando" o clique de
  bootstrap (§8: ~20 cliques pro 1º gato) e fazendo o eixo ativo aparecer **antes** da 1ª parede.
- **Idle nunca fica com marco morto:** todo prédio tem uma Passiva de Produção até o m25 (a de
  Clique não rende offline, então não pode ser a única recompensa cedo de um prédio).
- **Personalidade de prédio:** Miaurcado puxa idle, Píer puxa clique — a escolha de *onde* investir
  vira parte do build.

### 3.5 Clique e Habilidades ativas — o eixo *clicker*

O clique é um **eixo de progressão legítimo** (ADR-0001), não mais um resíduo. Base:

```
peixes_por_clique = max(1, prod_por_segundo * CLICK_FACTOR_efetivo * mult_clique)
CLICK_FACTOR_efetivo = CLICK_FACTOR + Σ bônus_de_colheita (C2)
mult_clique          = Π multiplicadores das Passivas de Clique compradas (C1)
```

O clique é **sempre uma fração da produção**, nunca um "+N fixo" — é isso que o impede de ficar
obsoleto conforme a produção cresce (ADR-0002). As **Passivas de Clique** (C1, C2, §3.4) são a via
*passiva* de escalar o clique; elas só valem **presente** (invisíveis offline, §7), então mantêm a
build ativa lastreada em produção sem quebrar "idle rende melhor ausente".

O **pico** do clique ganha vida através de **Habilidades ativas**: efeitos acionáveis, com cooldown,
hospedados em **prédios específicos**, que dão um *burst* de peixes por clique numa janela curta.

Exemplos (ajustáveis): **Maré de Peixe** (Barraca — clique ×5 por 15s, cooldown 90s).

**Regras duras do clique `[TRAVADO]`:**
- **Burst, não marreta.** O valor do clique vem de *clicar forte em janelas*, não de frequência.
  O benefício por clique tem **retorno decrescente acima de ~um limite humano confortável** —
  um auto-clicker não pode dominar. Se dominar, é bug de design.
- **Idle nunca fica preso atrás do clique.** A build ativa dá o **pico** maior; a build idle rende
  **melhor ausente**. Nenhuma domina a outra (ver §4). Se uma dominar, rebalancear — não remover.

### 3.6 Habilidades globais

Poucas, especiais, que afetam tudo:
- **Selo Imperial na Caixa** — destravada na 1ª Nova Dinastia: **produção global ×1,5** (permanente).
- **Carinho Ergonômico** — melhoria do poder de clique base (eixo ativo).

### 3.7 Fórmula final de produção

```
prod_predio(i) = prod_por_gato(i) * qtd_gatos(i) * habilidades_passivas_mult(i)
prod_total     = Σ prod_predio(i) * global_mult
global_mult    = (1 + CROWN_BONUS * coroas_totais) * habilidades_globais * evento_mult
```

`habilidades_passivas_mult(i)` = produto dos multiplicadores das habilidades passivas **compradas**
daquele prédio. Ordem de aplicação **aditiva dentro da coroa, multiplicativa fora**. Não mude isso
sem recalcular o ritmo inteiro — é o que impede a inflação descontrolada nas primeiras runs.

---

## 4. A decisão real: Build ativa vs. Build idle `[TRAVADO]`

Esta é a **única decisão estratégica** do slice (substitui os 3 gatos alocáveis do v0.1, que
colapsavam para "booste o maior produtor"). Ela **não** é um botão de "escolha uma classe" — ela
**emerge** de onde o jogador gasta seus peixes e sua atenção:

- **Build idle** — investe em **Habilidades passivas** e em quantidade de gatos. Rende sozinha,
  ótima para quem joga em segundo plano. Melhor **enquanto ausente**.
- **Build ativa** — investe no eixo de **clique** e sincroniza **Habilidades ativas** com o
  **Festival da Sardinha** (§5) para picos enormes. Exige presença. Maior **pico**.

O balanceamento que torna isso uma decisão de verdade, e não uma resposta óbvia:
**ativa = pico maior · idle = melhor ausente · nenhuma domina a outra.** Se a curva não respeitar
isso, a decisão morre — e com ela o pilar. Rebalancear é a resposta; nunca "simplificar" removendo
um dos eixos.

> Realocação/rebuild entre Dinastias é livre: cada Nova Dinastia é uma chance de tentar o outro eixo.

---

## 4.5 Eras do Império — o eixo civilizacional `[decisão v0.3]`

**Problema que resolve:** desbloquear prédios um após o outro dá progressão, mas não dá a *sensação
de civilização evoluindo*. As **Eras** são essa camada — **sem** adicionar uma economia paralela
(respeita o antipilar, §1).

**O que é.** Um **grau civilizacional nomeado**, percorrido **dentro da run**, dirigido pelo
`lifetime` de peixes. Ao cruzar o limiar de uma Era:

1. **título** novo no HUD ("Beco Próspero");
2. **lump único de peixes** — um empurrão comemorativo (não um multiplicador; ver balanceamento);
3. **fanfarra** — o momento (a tela comemora); e em Eras marcadas, dispara a **transformação
   visual do Beco** (§2, os 3 estágios).

**Por que não fura o antipilar.** Não é recurso novo nem eixo novo: a Era é **derivada do
`lifetime`** (que já existe e é monotônico), e o lump é peixe (recurso da run). O único estado novo
é **um inteiro** — a Era mais alta já atingida na run — pra não repagar o lump ao recarregar.
Reseta na **Nova Dinastia** (volta à Era 1), coerente com o ciclo (§6).

**Escopo — escada desenhada longa, slice constrói curto.** A escada é a espinha civilizacional do
jogo **inteiro** e **unifica os distritos do §13**: os distritos são os *grandes saltos* dela. O
**slice implementa só as Eras do Beco**; o resto fica travado como horizonte (§13).

### Escada (vision completa)

| # | Era | Limiar `lifetime` (peixes) | No slice? | Dispara estágio do Beco |
|---|---|---|---|---|
| 1 | Beco Esquecido | 0 (início) | ✅ | estágio 1 |
| 2 | Beco Movimentado | ~1.500 | ✅ | — |
| 3 | Beco Próspero | ~8.000 | ✅ | estágio 2 |
| 4 | Beco Notável | ~40.000 | ✅ | — |
| 5 | Beco Imperial | ~120.000 | ✅ | estágio 3 |
| 6 | Beco Lendário | ~600.000 | ✅ | — |
| 7+ | Miadópolis · Praça Imperial · Domínio Cósmico · … · Império Interplanetário | — | ❌ backlog §13 | — |

> As **6 Eras do Beco são mais granulares que os 4 prédios** de propósito: criam beats de
> "civilização avançou" **entre** os desbloqueios (prédios em `lifetime` 0 / 250 / 8.000 / 120.000,
> §3.3). É isso que mata o vazio entre um prédio e o próximo. Os limiares são **alvo de
> balanceamento (§8)**, não sagrados como as constantes de §3.1.

### O lump de peixes `[balanceamento]`

Empurrão **pequeno e único** por Era — alvo: **~30 s da produção passiva no momento do cruzamento**
(com um piso pra não ser irrelevante cedo). **Nunca** um multiplicador permanente: isso viraria um
2º eixo de prestígio dentro da run e distorceria §4 e §8. Calibrar contra os alvos de ritmo (§8).

> **⚠️ Revisto no jogo completo (§4.6, v0.5):** no *slice* a Era dá **lump** (acima). Na visão do
> **jogo completo**, cruzar Era dá **multiplicador global temporário** (perdido na Dinastia), porque
> num economia empilhada o lump aditivo vira pó. O lump fica valendo só enquanto o slice não tem o
> modelo empilhado. Ver §4.6.

### Notas de implementação

- **Era atual = função pura de `lifetime`** (vive em `domain/`, testável). Sem novo recurso.
- Persistir só `eraMaisAlta` (um inteiro) no save — evita repagar o lump ao recarregar; quem paga é
  o **cruzamento ao vivo**, não a hidratação.
- Casa com a **evolução visual** (§10): as Eras marcadas disparam os estágios do Beco (com os marcos, §3.4).
- Reset na **Nova Dinastia** (§6): `eraMaisAlta` volta a 1.

---

## 4.6 Arquitetura de progressão do jogo completo (pós-slice) `[decisão v0.5]`

O slice tem 4 prédios; o **jogo completo** cresce muito além disso. Esta seção trava a **arquitetura
de longevidade** — decidida numa sessão de grelha (2026-07-15). Onde ela **revê** uma decisão travada
do slice, está marcado. O slice não precisa implementar isto ainda; é o mapa do que vem depois.

**Objetivo do jogador = espetáculo, não puzzle de otimização.** Assistir um império de gatos crescer
da caixa de papelão ao intergalático. Toda decisão abaixo serve a isso.

### 4.6.1 Prédios ≠ Eras (a separação-mãe)
- **Prédio** = *onde o gato trabalha* (unidade de trabalho; você compra N gatos dentro). É `data/`.
- **Era** = *o avanço civilizacional* (a escada de escala caixa→galáxia, §4.5).
- Os dois eixos **não** contam a mesma história. Nomes como "nação", "império intergalático" são
  **Eras**, não prédios. Prédios vivem **dentro** de uma Era.

### 4.6.2 Modelo empilhado (A) — nada some durante a run
- Ao desbloquear prédios novos, os antigos **continuam na tela, produzindo** (a Caixa de Papelão
  cospe migalha até a Era Galáctica). **Todas as lanes visíveis** — o apelo é visual/acúmulo.
- Consequência de UI: com dezenas de lanes, elas colapsam/rolam (detalhe pra depois), mas **existem**.
- É o modelo Cookie Clicker / AdVenture Capitalist. "Nada some" vale **na run** — a **Dinastia**
  (§4.6.5) reseta tudo, e isso é outro escopo.

### 4.6.3 Fórmula global de curva
- Como tudo produz ao mesmo tempo pra sempre, a produção total é a **soma de exponenciais**. Os
  números de cada prédio (custo/gato, produção/gato, limiar) **saem de uma fórmula** função da
  posição na escada — **não** do feeling caso a caso.
- "Desenhar aos poucos" vale pra **quais prédios existem e a arte deles**, **nunca** pros números.
  Fixar a **forma da curva** é pré-requisito antes de ~5 prédios; senão cada prédio novo re-tuna
  todos os anteriores.
- Serve os alvos "início mais rápido, fim mais duro": é **tuning da curva + multiplicadores de Era**,
  não da contagem de prédios.

### 4.6.4 Decoração-fundo + arquétipos (o antídoto ao enchimento)
- Prédio é **único na arte, no flavor e no papel**; mecanicamente é **clone escalado** (a matemática
  sai da fórmula). Isso é honesto e barato, e casa com o espetáculo. Enchimento se combate com
  **arte + pacing + papel legível**, não com mecânica única por prédio (isso seria puzzle de
  otimização — rejeitado — e estrangularia a produção de conteúdo).
- **Arquétipos (~4-5 papéis)** dão variedade *percebida* sem custo por-prédio. Cada prédio recebe
  **um papel**; o papel decide qual efeito-molde ele usa (fórmula global intacta):
  - **Produtor** (foco idle) · **Clicker** (foco clique) · **Sinérgico** (buffa vizinhos / a Era) ·
    **Conversor** (mexe recurso, ex.: colheita por clique).
  - É o instinto que o slice já teve ("Miaurcado puxa idle, Píer puxa clique", §3.4).

### 4.6.5 Era = multiplicador global temporário + fundo bespoke `[revê o lump do §4.5]`
- No jogo completo, cruzar Era dá: **multiplicador global** (temporário, **perdido** na Dinastia) +
  **novo fundo de mundo** (ver visual abaixo) + **desbloqueia as próximas lanes** + **destrava faixas
  do pool de Lendários** (§4.6.7) + escala o **Legado** ganho.
- **Pacing vira serrote** (não rampa lisa): cada Era = *explode e avança rápido → bate no muro →
  grinda → próxima Era*, com amplitude crescente. É o ritmo desejado.
- Revê o §4.5: o **lump** aditivo é pó numa economia exponencial-empilhada; por isso vira
  **multiplicador**. (No slice sem empilhamento, o lump ainda serve.)

**Modelo visual da Era `[decidido 2026-07-15, validado no app]`:**
- **Mundo de fundo FIXO.** O cenário da Era é uma imagem que preenche a viewport, **fixa** atrás de
  tudo (`.skybg`, `position: fixed`). A página rola normal (scroll único, natural); o mundo fica
  parado. Os cartões de UI (HUD, botões, passivas, o peixe) **flutuam por cima** como chrome claro —
  é "mundo escuro do beco + UI clara", **não** um app claro com um cartão escuro no meio (essa versão
  foi testada e **rejeitada** por destoar). Primeiro asset entregue: `sky_beco.png` (Era 1).
- **Uma imagem bespoke e detalhada POR ERA.** Cruzar uma Era **troca o mundo inteiro** — esse é o
  espetáculo. Sem estágios parciais, sem faixa separada. Custo de arte: **1 fundo detalhado por Era**
  (mais que "1 por distrito", mas o usuário priorizou espetáculo sobre economia de arte, e tem fôlego).
- **Props ABANDONADOS.** A ideia de props que acumulavam por Era (overlays na moldura/faixa) foi
  **prototipada no app e descartada** — a troca do fundo inteiro por Era já carrega o espetáculo, e
  uma faixa de props comia tela (pior no mobile) sem ganhar o suficiente.
- **Sob o modelo X (scroll único, §4.6.2):** o mundo mostra a Era **de pico** atual. Não se "volta"
  pra rever o céu do Beco durante o jogo (isso era do modelo paginado, descartado); o espetáculo é
  *tudo sob o teu mundo mais grandioso*. Reseta ao Beco na Dinastia.
- **Pendência de código** (quando houver Era-detection no `domain/`): mapear Era → imagem e trocar
  o `--sky` do `.skybg`. Hoje está fixo em `sky_beco.png`.

### 4.6.6 Dinastia = reset-com-recompensa (o endgame) `[estende §6]`
- É o prestígio (Nova Dinastia, §6) na sua forma completa: **progressão-replay**, não
  variedade-replay. Cada run é **a mesma subida, mais rápida e mais longe** (modelo Clicker Heroes /
  Tap Titans). Runs **não** divergem — o jogador não quer variedade de *run*, quer variedade de
  *elenco* (§4.6.7).
- Ascender reseta a run (volta à Caixa, Era 1) e concede **Legado** (moeda meta, escala pela **Era
  mais alta** atingida — o `eraMaisAlta` que o §4.5 já persiste).

### 4.6.7 Gatos Lendários = a coleção meta (a forma concreta dos "Artefatos" do §6/§13)
- **O que são:** gatos **com nome, rosto e arte única** (o oposto do trabalhador anônimo). **Não
  quebram** a ficção anônima — **dependem** dela: o enxame sem rosto é o que faz o Lendário saltar.
- **Elenco grande** (muito mais que o nº de Eras — a variedade que o jogador quer é de **elenco**).
- **Coleção convergente:** todo mundo junta todos no fim; o que muda entre jogadores é só a
  **ordem/ritmo** de aquisição → é elenco, **não** divergência de run.
- **Aquisição:** gasta **Legado** → **sorteio** de um Lendário do pool → **reroll** muda a oferta →
  **upgrade** com mais Legado. As **Eras destravam faixas do pool** (Lendários "galácticos" só saem
  depois de tocar a Era Galáctica).
- **Função:** cada Lendário = um **perk global permanente**, de **papel variado** (idle, clique,
  corte de custo, ganho offline, adianta-Era…). "Único" = **papel diferente**, não número diferente.
- **Concretiza** os "Artefatos (§13)" que o §6 já prometia como o endgame das Coroas.
- **Custo consciente:** o endgame ganha uma **camadinha de otimização** (qual puxar, qual upgradar).
  Aceito **de olho aberto** — é otimização **por cima** do espetáculo, só no endgame, não no corpo.

### 4.6.8 Pendências travadas pra sessão dedicada (Gatos Lendários)
Não resolver de improviso — merecem grelha própria:
- Tamanho do elenco · lista de perks e seus papéis · tiers do pool por Era.
- Custo de reroll · curva de upgrade · piso pra o reroll não virar o puzzle que foi rejeitado.
- **Moeda:** o §6 diz que Coroas "não são gastas" (contagem, bônus passivo). Os Lendários são
  **comprados** (gasto). Reconciliar: Coroas viram gastáveis? Legado é derivado das Coroas? Decidir
  na sessão dedicada.

---

## 5. Evento aleatório (1)

**Festival da Sardinha.** A cada 8–20 min (uniforme), um peixe dourado atravessa a tela por 12s.
Ao clicar: **produção ×7 por 30 segundos**, com feedback exagerado (confete, números grandes, o
cenário inteiro treme).

No híbrido, o Festival é também o **melhor momento da build ativa**: casar as Habilidades ativas
com a janela do Festival é o pico do jogo. Se o jogador ignorar, nada acontece. O evento **nunca**
pune ausência (a build idle continua rendendo).

---

## 6. Prestígio: Nova Dinastia `[TRAVADO]`

```
coroas_ganhas = floor( sqrt( peixes_lifetime_da_run / PRESTIGE_DIVISOR ) )
```

| Peixes na run | Coroas | Bônus global acumulado |
|---|---|---|
| 1.000.000 | 1 | +2% |
| 4.000.000 | 2 | +4% |
| 25.000.000 | 5 | +10% |
| 100.000.000 | 10 | +20% |

**Reseta:** peixes, gatos, prédios desbloqueados, habilidades compradas (exceto Selo Imperial).
**Mantém:** coroas, bônus global, conquistas, estatísticas vitalícias.

As **Coroas persistem como contagem** (não são "gastas") — dão bônus passivo hoje e, no endgame,
serão também a moeda dos **Artefatos** (§13). Não modele coroa como recurso consumível.

> **Endgame do jogo completo (§4.6.6–4.6.7, v0.5):** os "Artefatos" ganharam forma — são os **Gatos
> Lendários**, uma coleção convergente comprada com a moeda de prestígio (via sorteio + reroll +
> upgrade). A Dinastia é **progressão-replay** (a mesma subida, mais rápida). **Pendência:** os
> Lendários são *gastáveis*, mas aqui a Coroa é *contagem* — reconciliar a moeda na sessão dedicada
> (§4.6.8).

O botão só aparece quando `coroas_ganhas >= 1`. A tela de confirmação **obrigatoriamente** mostra:
o que se perde, o que se mantém, quantas coroas entram e o novo multiplicador.

---

## 7. Offline e save

- Save automático a cada 10s, em `visibilitychange` e em `beforeunload`.
- Chave: `imperio_felino_save_v1`. Formato: JSON serializado + versão de schema.
- Ao voltar: `ganho = prod_por_segundo * min(segundos_ausente, 8h) * 0.50` → modal com o total e
  o tempo considerado. (Offline é **produção passiva** — favorece naturalmente a build idle.)
- Import/export do save em base64 (botão nas configurações).
- **Anti-relógio:** se `agora < ultimo_save`, o ganho offline é zero. Não vale a pena fazer mais
  que isso num jogo single-player.

---

## 8. Alvos de ritmo — a definição de "está funcionando"

Estes números são o **critério de aceite do jogo**, não sugestões.

| Marco | Alvo | Falha se |
|---|---|---|
| 1ª compra (1º gato) | < 10s | o jogador precisa clicar mais de ~20 vezes |
| 1ª automação visível | < 1 min | o contador não sobe sozinho de imediato |
| 1º prédio novo desbloqueado | ~2–4 min | — |
| 1ª Habilidade ativa disponível | ~5–8 min | o eixo de clique não aparece antes da 1ª parede |
| 1ª "parede" (tédio proposital) | ~25 min | vem antes dos 15 min |
| 1º prestígio | 45–90 min | passa de 2h ou vem antes de 30 min |
| 2ª run até o mesmo ponto | 30–40% mais rápida | o jogador não sente aceleração |
| Diferença ativa vs idle | ambas viáveis | uma domina a outra em qualquer horizonte |

**Se a curva não bate isso, ajuste `COST_GROWTH`, os custos base e os limiares — não adicione conteúdo.**

---

## 9. Arquitetura técnica

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | TypeScript (strict) | — |
| Build | Vite | — |
| UI | React + CSS global (`ui/styles.css`) | Idle é HUD + números. Phaser é overkill agora. |
| Estado | Zustand | Store única, fácil de serializar e testar |
| Render das lanes | **A decidir:** DOM/`<img>` com teto visual de sprites, ou Canvas | Muitos gatos × 4 lanes; com teto (~45/lane) DOM aguenta. Revisitar se travar. |
| Números | `number` (float64) | Exato até 9e15. Migrar p/ `break_infinity.js` só se o pós-slice passar disso |
| Save | LocalStorage | — |
| Testes | Vitest | Obrigatório em economia, offline e prestígio |
| Deploy | Cloudflare Pages ou Vercel | — |

### Estrutura de pastas

```
src/
  core/            # game loop, tick, tempo
  domain/          # economia PURA (funções sem React, 100% testável)
    cost.ts
    production.ts
    prestige.ts
    offline.ts
    click.ts       # clique + janelas de habilidade ativa
  data/            # CONTEÚDO — só dados, zero lógica
    buildings.ts   # prédio + tipo de gato + custo/produção por gato + limiar
    abilities.ts   # habilidades passivas e ativas por prédio (funde upgrades.ts)
    achievements.ts
  state/           # store Zustand + save/load
  ui/              # componentes (header de recursos, lanes, loja)
  scene/           # lanes, ícones de prédio, sprites de gato, fundos de lane
tests/
```

**Regra de ouro:** `domain/` não importa nada de `ui/` nem de `state/`. Se essa regra quebrar,
o balanceamento vira intestável e o projeto morre em duas semanas.

### Formato de conteúdo (exemplo)

```ts
// data/buildings.ts
export const BUILDINGS = [
  {
    id: 'caixa_papelao',
    nome: 'Caixa de Papelão',
    descricao: 'O berço de toda grande civilização felina.',
    tipoGato: 'gato_de_rua',
    custoBasePorGato: 15,
    producaoPorGato: 0.1,
    desbloqueio: 0,               // peixes acumulados na run
    marcos: [10, 25, 50, 100],
    icone: 'bld_caixa_n1.png',
    fundoLane: 'bg_lane_caixa.png',
    spriteGato: 'cat_rua.png',
  },
  // ...
] as const;
```

---

## 10. Ordem de implementação

1. `domain/` puro + testes: custo, produção, prestígio, offline, clique. **Sem UI.**
2. Loop de tick + store + 1 prédio + comprar gato + botão de clique (UI feia, sem arte).
3. **Sessão de teste de 30 min jogando o feio.** Se não dá vontade de esperar, volte ao passo 1.
4. Save + offline + modal de retorno.
5. Os 4 prédios (desbloqueio em cascata), as habilidades passivas, os marcos, as **Eras do Império** (§4.5).
6. Habilidades ativas + eixo de clique. Testar build ativa vs idle (§4, §8).
7. Prestígio + tela de confirmação.
8. Evento + conquistas.
9. Arte (ver `ART_STYLE.md`): lanes, ícones, sprites de gato, fundos de lane, feedback visual.
10. Balancear contra §8. Só então pensar em Miadópolis / Artefatos.

---

## 11. Regras para o agente de código (Claude Code)

- Uma tarefa = um sistema. Nunca "implemente o jogo".
- Toda tarefa declara: **objetivo, arquivos que pode tocar, critério de aceite, o que NÃO mudar.**
- Nenhum número mágico no código: tudo vem de `data/` ou das constantes de §3.1.
- Toda alteração em `domain/` exige teste novo ou atualizado.
- Se uma instrução conflitar com este documento ou com o `CONTEXT.md`, **pare e pergunte.**

**Modelo de tarefa:**

> Implemente `domain/offline.ts`. Função `calcularGanhoOffline(prodPorSegundo, msAusente)`
> (o `prodPorSegundo` já chega efetivo, com o bônus de coroas embutido — não reaplique coroas aqui).
> Limite a 8h, aplique 50% da taxa, retorne `{ peixes, segundosConsiderados, foiCapado }`.
> Se `msAusente < 0`, retorne zero. Crie testes cobrindo: ausência curta, ausência capada,
> relógio para trás, produção zero. **Não toque** em `state/`, `ui/` nem em `data/`.

---

## 12. Conquistas do slice (8)

Primeiro Ronrom · CEO de Papelão · A Reunião Terminou · Gato Muito Importante ·
Dinastia Descartável (prestigiar em < 40 min) · Ausente mas Presente (coletar offline capado) ·
Maré Alta (disparar uma Habilidade ativa durante o Festival) · Bigode Supremo (10 coroas).

---

## 13. Backlog pós-slice

**Artefatos → Gatos Lendários** — a meta-progressão de endgame ganhou forma na **§4.6.7 (v0.5)**:
os "gatos nomeados" **são** os Artefatos — coleção convergente de Lendários comprada com a moeda de
prestígio via sorteio + reroll + upgrade. Detalhes (elenco, perks, tiers, moeda) travados pra
**sessão de grelha dedicada** (§4.6.8). ·
Miadópolis e demais distritos (são os **grandes saltos da escada de Eras**, §4.5 — o trecho fora do Beco) ·
Ronrons e Influência (só se virarem decisão, não número) ·
raridades · árvore de legado · mais eventos e habilidades ativas · som ·
animações de trabalho e celebração · migração para Phaser/Canvas se as lanes exigirem ·
**arquétipos de passiva além dos 4 do slice (ADR-0002):** P3 **sinergia entre prédios** (prédio A
+X% por prédio B) e C3 **clique crítico** (chance de clique dar ×N).

---

## Changelog

| Data | Mudança | Motivo |
|---|---|---|
| 2026-07-13 | v0.1 — escopo travado do slice | Documento inicial derivado do plano conceitual |
| 2026-07-13 | **v0.2 — reestruturação do modelo** | Grelha: prédios fixos + gatos como unidade comprável; híbrido idle+clicker (ADR-0001); sistema único de Habilidades (passiva/ativa) funde upgrades e marcos; decisão real vira build ativa-vs-idle; artefatos → endgame; layout de lanes estilo Cookie Clicker; §8 revisado |
| 2026-07-14 | **v0.3 — + §4.5 Eras do Império** | Grelha: sensação de avanço civilizacional sem economia nova. Grau nomeado por run, dirigido pelo `lifetime`; cruzar Era dá título + lump de peixes + fanfarra e (em Eras marcadas) o estágio visual do Beco. Escada desenhada até o interplanetário, **unificando os distritos do §13**; slice constrói só as ~6 Eras do Beco (granulares > 4 prédios, pra beats entre desbloqueios). Entra no §2 (Dentro) e no §10 (passo 5) |
| 2026-07-14 | **v0.4 — Passivas de Clique (ADR-0002)** | Grelha: passivas de prédio deixam de ser idle-only e ganham 2 sabores (Produção / Clique) que competem pelos mesmos peixes; 4 arquétipos no slice (P1 mult prédio, P2 escala com enxame, C1 mult clique, C2 colheita de %prod), P3/C3 no backlog. Clique = %(produção) via `CLICK_FACTOR_efetivo × mult_clique`, nunca fixo; passiva de clique é invisível offline. Reescreve §3.4/§3.5, redefine "Habilidade passiva" no CONTEXT (Passiva de Produção / de Clique) |
| 2026-07-15 | **v0.5 — + §4.6 Arquitetura de progressão do jogo completo** | Grelha: como escalar dos 4 prédios-piloto pra um jogo longevo. **Prédios ≠ Eras** (prédio = trabalho; Era = escala). Modelo **empilhado (A)** (nada some na run, todas as lanes visíveis). **Fórmula global de curva** (números por função, não feeling). **Decoração-fundo + arquétipos** (~4-5 papéis; espetáculo, não puzzle). **Era vira multiplicador global temporário** (revê o lump do §4.5 no jogo completo; pacing serrote). **Dinastia = reset-com-recompensa** (progressão-replay). **Gatos Lendários** concretizam os Artefatos do §6/§13 (coleção convergente, sorteio+reroll+upgrade, perk permanente por papel, Eras destravam tiers do pool). Detalhes dos Lendários → sessão dedicada (§4.6.8). Notas de reference no §4.5, §6, §13 |
| 2026-07-15 | **Modelo visual da Era (§4.6.5) — mundo fixo + fundo bespoke por Era** | Testado no app real: **mundo escuro fixo** (`sky_beco.png` na viewport, `.skybg` fixed) com UI clara flutuando por cima; scroll único natural. Versão "app claro + moldura escura com scroll aninhado" foi **rejeitada** (destoava + scroll estranho). **Props abandonados** (prototipados e descartados — comiam tela, pior no mobile). Cada Era passa a ter **1 fundo detalhado bespoke** que troca o mundo inteiro ao cruzar. Código: `App.tsx` + `styles.css` (`.skybg`); pendente Era→imagem quando houver Era-detection |
