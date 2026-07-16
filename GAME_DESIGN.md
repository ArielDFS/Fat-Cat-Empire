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
| Progressão visível | O **mundo troca a cada Era** (§4.5) e as lanes enchem de gatos conforme o enxame cresce |
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
- 1 cenário base (o beco + as lanes); a **transformação visual** vem da **troca de mundo por Era**
  (§4.5/§4.6.5) — os "3 estágios do Beco" foram **cortados** (grelha)
- 2 recursos: **Peixes** (run) e **Coroas Felinas** (permanente)
- 4 **prédios fixos**, cada um hospedando **um tipo de gato**
- **Gatos** como a unidade que se compra em quantidade (o produtor)
- Sistema de **Habilidades**: passivas (produção) e ativas (burst de clique)
- 3 gatos alocáveis ~~(removido — ver §4)~~
- 1 evento aleatório (Festival da Sardinha)
- 1 ciclo de prestígio (Nova Dinastia)
- **Eras do Império** — grau de **escala** civilizacional por run, dirigido pelo lifetime (ver §4.5); a escada beco → galáxia comprimida em 6 degraus
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

> **✅ Escada completa + motor migrado (2026-07-16):** `data/buildings.ts` tem os **36 prédios**
> (6 Eras × 6, o 6º = Obra `ehObra`), curva travada da §4.6.3, campos `era`/`ehObra`. O **motor roda
> no modelo v0.6** (§4.6.9): unlock por **cadeia de compra** (deriva de `gatos`), Era por **Obra**,
> Coroa por **gastos**. A coluna "Desbloqueio (peixes acum.)" e o campo `desbloqueio` **caíram**.
> Passivas dos 32 prédios novos são placeholders ("Melhoria N") por fallback; arte cai na Caixa.
> Nomes/tipos = camada de humor, editáveis.

> **⚠️ Modelo de desbloqueio revisto (§4.6.9, ADR-0003):** o "desbloqueio por peixes acumulados
> (`lifetime`)" acima é o modelo **atual do slice**. O alvo é **cadeia de compra** (comprar o 1º gato
> revela o próximo prédio) — sem `lifetime`. A coluna "Desbloqueio (peixes acum.)" cai na migração; o
> gate passa a ser o custo do 1º gato. Estrutura de endgame: 6 Eras × 6 prédios (o 6º é a **Obra**).

### 3.4 Marcos e Habilidades passivas

A cada marco de gatos **do mesmo prédio**, **destrava uma Habilidade passiva** daquele prédio — uma
melhoria **comprável** (com peixes): o marco *abre*, o jogador *compra* (modelo Cookie Clicker/
Clicker Heroes).

```
marcos = [10, 25, 50, 100]
```

As passivas vêm em **dois sabores que competem pelos mesmos peixes** (ver [ADR-0002](docs/adr/0002-passiva-de-clique.md)):
- **Passiva de Produção** — buffa a produção idle daquele prédio. Rende presente **e** ausente.
  Motor da **Build idle**.
- **Passiva de Clique** — aumenta o **poder de clique** (efeito global, apesar de morar no prédio).
  **Invisível offline** (não rende ausente). Motor da **Build ativa**.

> **Mudança visual do prédio por marco — CORTADA (grelha):** o marco **não** muda mais o sprite do
> prédio (o antigo "nível 1 → 2 → 3" saiu). A **progressão visível** (pilar §1) fica na **troca de
> mundo por Era** (§4.5/§4.6.5) + o **enxame enchendo a lane**. Motivo: 2–3 sprites por prédio é caro
> e de baixo retorno no modelo empilhado com dezenas de prédios (§4.6.4). O marco hoje faz **só** uma
> coisa — abrir a passiva.

> **Decisão de design (v0.2):** o sistema de passivas **funde** os antigos "Upgrades" (§3.6 do v0.1) e
> o antigo "dobra automática por marco" (§3.4 do v0.1) num **único** sistema — habilidade passiva
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

Poucas, especiais, que afetam tudo. Diferente das Passivas de Prédio (§3.4), a Habilidade global
**não se compra com peixes nem mora num prédio**: é **concedida** por um marco do meta-jogo e
**sobrevive à Nova Dinastia** (§6) — a única categoria de habilidade que atravessa a Run.

- **Selo Imperial na Caixa** — **concedido** (não comprado) na **1ª Nova Dinastia**: **produção
  global ×1,5**, permanente. Entra como fator multiplicativo em `habilidades_globais` (§3.7), **fora**
  do colchete das coroas. Por ser de **produção**: (a) **rende offline** (§7) — ao contrário da Passiva
  de Clique — e (b) **levanta o clique junto**, de graça, porque o clique é uma fração da produção
  (§3.5); não é caso especial, cai da fórmula. **Modelado como um flag** no slice (só há uma global);
  vira `string[]` se um dia houver várias. O ×1,5 **nunca empilha** entre Dinastias — quem cresce por
  Dinastia é a Coroa.
- **Carinho Ergonômico** — melhoria do poder de clique base (eixo ativo). **Backlog** — sem gatilho
  definido; entra numa sessão futura.

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

## 4.5 Eras do Império — o eixo civilizacional `[decisão v0.3 — driver revisto pela v0.6]`

> **⚠️ Revisto e ✅ IMPLEMENTADO (§4.6.9, ADR-0003, 2026-07-16):** "Era = função pura de `lifetime`"
> **caiu**. A Era agora vira ao **construir uma Obra** (o prédio-virada da Era); é derivada de `gatos`
> (Era = 1 + nº de Obras construídas), não do `lifetime`. O texto abaixo descreve o **modelo antigo**
> (dirigido por `lifetime`) — mantido como histórico. Título, mundo bespoke, fanfarra e lump
> sobreviveram; só o **gatilho** mudou (de cruzar limiar → construir a Obra).

**Problema que resolve:** desbloquear prédios um após o outro dá progressão, mas não dá a *sensação
de civilização evoluindo*. As **Eras** são essa camada — **sem** adicionar uma economia paralela
(respeita o antipilar, §1).

**O que é.** Um **grau de escala civilizacional nomeado**, percorrido **dentro da run**, dirigido
pelo `lifetime` de peixes. As Eras **sobem de escala** — não são seis sabores do mesmo beco, e sim
**beco → vila → cidade → metrópole → império → galáxia** (é o arco do §1, "gatos de rua viram um
império absurdo", do início ao fim). Cada Era carrega **dois rótulos**: a `escala` (o degrau
legível, que o jogador sente subir) e o `nome` próprio (o trocadilho — o pilar do humor §1). Ao
cruzar o limiar de uma Era:

1. **título** novo no HUD ("Era III · Cidade — Gatópolis");
2. **lump único de peixes** — um empurrão comemorativo (não um multiplicador; ver balanceamento).
   Entra **só em peixes, não no `lifetime`** — assim o presente não empurra a run pra próxima Era de
   graça (o lifetime segue sendo produção genuína, base honesta da escada e do prestígio);
3. **fanfarra** — o momento (a tela comemora) e a **troca do mundo de fundo** (§4.6.5: cada Era = 1
   backdrop bespoke que troca a viewport inteira).

**Por que não fura o antipilar.** Não é recurso novo nem eixo novo: a Era é **derivada do
`lifetime`** (que já existe e é monotônico), e o lump é peixe (recurso da run). O único estado novo
é **um inteiro** — a Era mais alta já atingida na run — pra não repagar o lump ao recarregar.
Reseta na **Nova Dinastia** (volta à Era 1), coerente com o ciclo (§6).

**Escopo — a escada de escala inteira, comprimida no slice `[revisto 2026-07-15]`.** Decisão de
direção: em vez de o slice ficar preso em "seis Eras do Beco" e deixar os distritos (Miadópolis,
galáctico…) só no §13, o slice **já traça a escada de escala inteira** (beco → galáxia) em 6
degraus. Isso **puxa os antigos "distritos" do §13 pra dentro da escada de Eras**: Miadópolis e o
nível galáctico agora são **Eras do slice**, não horizonte distante. No jogo completo a escada
**estica** (mais degraus *entre* estes), não ganha um teto novo.

### Escada do slice (escala inteira, comprimida)

| # | Escala | Nome (piada) | Limiar `lifetime` (peixes) | Céu |
|---|---|---|---|---|
| 1 | Beco | Beco Esquecido | 0 (início) | `sky_beco.png` ✅ |
| 2 | Vila | Vila do Ronrom | ~1.500 | pendente |
| 3 | Cidade | Gatópolis | ~8.000 | pendente |
| 4 | Metrópole | Miadópolis | ~40.000 | pendente |
| 5 | Império | Império dos Bigodes | ~120.000 | pendente |
| 6 | Galáxia | Via-Láctea Felina | ~600.000 | pendente |

> As **6 Eras são mais granulares que os 4 prédios** de propósito: criam beats de "civilização
> avançou" **entre** os desbloqueios (prédios em `lifetime` 0 / 250 / 8.000 / 120.000, §3.3). É isso
> que mata o vazio entre um prédio e o próximo. Os limiares e os nomes são **alvo de balanceamento /
> polimento (§8)**, não sagrados como as constantes de §3.1. Cada Era = **1 céu bespoke** (§4.6.5);
> hoje só a Era 1 tem asset, as demais caem no fallback `sky_beco.png` até serem geradas.

### O lump de peixes `[balanceamento]`

Empurrão **pequeno e único** por Era — alvo: **~30 s da produção passiva no momento do cruzamento**
(com um piso pra não ser irrelevante cedo). **Nunca** um multiplicador permanente: isso viraria um
2º eixo de prestígio dentro da run e distorceria §4 e §8. Calibrar contra os alvos de ritmo (§8).

> **⚠️ Revisto no jogo completo (§4.6, v0.5):** no *slice* a Era dá **lump** (acima). Na visão do
> **jogo completo**, cruzar Era dá **multiplicador global temporário** (perdido na Dinastia), porque
> num economia empilhada o lump aditivo vira pó. O lump fica valendo só enquanto o slice não tem o
> modelo empilhado. Ver §4.6.

### Notas de implementação

- **Era atual = função pura de `lifetime`** (vive em `domain/era.ts`, testável). Sem novo recurso.
- Persistir só `eraMaisAlta` (um inteiro) no save — evita repagar o lump ao recarregar; quem paga é
  o **cruzamento ao vivo**, não a hidratação (a hidratação sincroniza a Era **em silêncio**, sem lump
  nem fanfarra, mesmo que o offline tenha cruzado Eras).
- **Evolução visual = troca do mundo inteiro por Era** (§4.6.5): cada Era troca o backdrop fixo da
  viewport (`--sky`). Substitui os "3 estágios do Beco" do §2 — não é o beco que melhora, é a escala
  que sobe.
- Reset na **Nova Dinastia** (§6): `eraMaisAlta` volta a 1 (pendente — a Nova Dinastia é o passo 7).
- **Implementado (v0.5, passo 5):** `domain/era.ts` (+ testes), `data/eras.ts`, wiring na store
  (`aplicarGanhoLifetime`), save (`eraMaisAlta` opcional, sem bump de versão), HUD + fanfarra + céu.

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

### 4.6.3 Fórmula global de curva `[travado 2026-07-16 — implementada em data/buildings.ts]`
- Como tudo produz ao mesmo tempo pra sempre, a produção total é a **soma de exponenciais**. Os
  números de cada prédio (custo/gato, produção/gato, limiar) **saem de uma fórmula** função da
  posição na escada — **não** do feeling caso a caso.
- "Desenhar aos poucos" vale pra **quais prédios existem e a arte deles**, **nunca** pros números.
  Fixar a **forma da curva** é pré-requisito antes de ~5 prédios; senão cada prédio novo re-tuna
  todos os anteriores.
- Serve os alvos "início mais rápido, fim mais duro": é **tuning da curva + multiplicadores de Era**,
  não da contagem de prédios.

**A curva (escada de 36 = 6 Eras × 6) `[v0.7 — suavizada 2026-07-16]`:** geométrica no índice
global `i`, com os **pilotos i=0..3 canônicos do Cookie Clicker** (15/0,1 · 100/1 · 1.100/8 ·
12.000/47 — §3.2; §8 validado) e o resto **suavizado**, re-ancorado no Píer:

```
custoBasePorGato(i≥4) = 12.000 · 4,5^(i-3)     (custo ×4,5/prédio)
producaoPorGato(i≥4)  = 47     · 4,0^(i-3)     (produção ×4,0/prédio)
```

**Por que ×4,5 e não o ×9,283 canônico:** o alvo virou o **híbrido tipo Cookie Clicker — campanha
finita + motor endless** (ver visão em §4.6.6/§13). Curva suave = mais prédios por faixa de
magnitude, prédios antigos relevantes por mais tempo, progressão **granular** (não "one-shot" no
late-game). O 36º custa **~9,6e24** (24 ordens de grandeza, vs 34 no ×9,283); **22 prédios cabem no
inteiro exato do float64** (9e15), então `break_infinity.js` só é preciso muito além do fim da
campanha (§9/§13, adiado — e "endless tipo CC" nem exige, já que o CC vive dentro do float64 com
notação nomeada). A razão custo/produção sobe de ~150 a ~8.000 de propósito (eficiência decrescente
que empurra pro prestígio); quem a restaura é o **vetor permanente** (Lendários, §4.6.7). Há um
degrau proposital no i=3→4 (×9,283 → ×4,5): pilotos preservados, cauda suave. Função de `i` ⇒ robusta
a **inserir prédios no meio** (§4.6.9 ponto 4).

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
> **Gatilho revisto (§4.6.9, ADR-0003):** o que dispara "cruzar Era" deixa de ser o `lifetime` cruzar
> um limiar e passa a ser **construir a Obra** daquela Era. Os efeitos abaixo (multiplicador, mundo,
> desbloqueio das lanes) seguem — só a **causa** muda. "Desbloqueia as próximas lanes" agora é
> **emergente**: a 1ª compra da Obra revela o 1º prédio da Era seguinte (cadeia de compra).
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

> **✅ RESOLVIDO em grelha (2026-07-16, [ADR-0004](docs/adr/0004-corte-lendaria-e-rumo-hibrido.md)):**
> a aquisição é a **Corte Lendária** — não gacha puro. **Draft de 3** do pool (por tiers de Era) →
> recrutar 1 (Coroas) → **reroll** da oferta paga Coroas, com **piso** (o pool encolhe ao coletar, o
> reroll nunca vira puzzle — antipilar §1). O RNG afeta só *qual* entra, **nunca os stats**. O
> **poder é determinístico**: cada Lendário sobe de **nível** (custo crescente; buff `×~1,15`/nível),
> e M = produto dos buffs (multiplicativo — quebra as paredes exponenciais; um aditivo estagnaria).
> A **Coroa é a moeda** (gastável, `cbrt(gastos/DIV)` — some o `+2%` do §6). O **Selo Imperial vira o
> Lendário #0** (grátis na 1ª Dinastia). Loop validado por simulação: ~16 dinastias pra 36 prédios,
> sem travar; nº de dinastias sintoniza pelo DIVISOR. Números → §8. **A implementar** (sessão dedicada).
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

### 4.6.8 Pendências dos Gatos Lendários — ✅ RESOLVIDAS ([ADR-0004](docs/adr/0004-corte-lendaria-e-rumo-hibrido.md), 2026-07-16)
Resolvidas na grelha (a **forma**; os números finos são §8):
- **Moeda:** ✅ a **Coroa vira gastável** (`cbrt(gastos/DIV)`); morre o `+2%` do §6; **não há Legado
  separado**. Selo Imperial → **Lendário #0**.
- **Aquisição:** ✅ **Corte Lendária** — draft de 3 + reroll com **piso** (o pool encolhe ao coletar),
  RNG só na oferta, **nunca nos stats**; poder determinístico por **nível** (buff `×~1,15`/nível,
  multiplicativo).
- **Papéis:** ✅ ~5 — produção global, clique, corte de custo, ganho offline, adianta-Era.
- **Ainda a afinar (§8, na implementação):** tamanho exato do elenco (~12, 3 tiers), curva de custo de
  nível e de reroll, e o DIVISOR da coroa (sintoniza o nº de dinastias da campanha, ~15–25).

### 4.6.9 A espinha de progressão: Obras e cadeia de compra `[decisão v0.6, ADR-0003]`

**Revê o §4.5 (Era = função pura de `lifetime`), a base da Coroa do §6 e o gatilho do §4.6.5.** O
`lifetime` **deixa de dirigir qualquer mecânica** — a progressão passa a ser conduzida por **atos
concretos e visíveis** (construir prédios), não por um odômetro invisível. Ver [ADR-0003](docs/adr/0003-progressao-por-obras.md).

> **✅ IMPLEMENTADO (2026-07-16).** Motor migrado: cadeia de compra (unlock deriva de `gatos`, sem
> flag), Era = 1 + Obras construídas (`domain/era.ts eraDeObras`, derivada de `gatos` — **sem estado
> separado**: `gatos` já É o registro dos atos), fanfarra + lump ao construir a Obra (`comprarGatos`),
> Coroa por `gastos` (`sqrt(gastos/DIV)`), `lifetime` vira vitrine. Save **v2** com migração v1→v2
> (`gastos ≈ lifetime`). Removidos: `nivelDaEra`/`LIMIARES`, `Building.desbloqueio`, `Era.limiar`,
> `eraMaisAlta`. tsc + 88 testes + build verdes.

1. **Cadeia de compra.** Comprar o **1º gato** de um prédio (1º gasto de peixes nele) **revela o
   próximo prédio**. O gate é o **custo crescente** do 1º gato — que já exige produção acumulada, então
   se auto-pacinga sem `lifetime`. Regra **única** pra todos os prédios.
2. **Obra = o prédio-virada.** Cada Era é uma cadeia que **termina numa Obra** (CONTEXT): um prédio
   **produtor normal** (hospeda gatos, tem custo/produção) cuja **1ª construção vira a Era** — troca o
   mundo (§4.6.5), dá a fanfarra e revela o 1º prédio da Era seguinte. É naturalmente o prédio **mais
   caro** da Era, então o "juntar pra erguê-la" já é o peso da virada. Ex.: Prefeitura (→ Vila),
   Centro de Pesquisas Espaciais (→ Galáxia).
3. **Era vira estado guardado**, não derivada do `lifetime`: a Era atual = quantas Obras foram
   construídas. Persistida no save (o `predioDesbloqueado`/`nivelDaEra` derivados do `lifetime` saem).
4. **Estrutura de endgame: 6 Eras × 6 prédios = 36.** As 6 escalas nomeadas (beco → galáxia), cada
   uma com **6 prédios** (o 6º é a Obra). O "6 por Era" é um **alvo extensível** — a fórmula de curva
   (§4.6.3) tem que aguentar **inserir prédios no meio** de uma Era. Esticar a escada (mais Eras, §4.5)
   segue como alavanca pós-lançamento.
5. **Coroa escala pelos peixes gastos na run** (§6): `sqrt(gastos / DIVISOR)`, não mais `lifetime`.
   `gastos` = tudo que sai do saldo (gatos + passivas + Obras). Como `gastos ≈ produção`, o ritmo do
   §8 aproximadamente sobrevive. (O **Legado** do §4.6.6, moeda do endgame, segue por Era — moeda distinta.)
6. **`lifetime` sobrevive só como estatística de vitrine** (exibido, dirige zero mecânicas).

> **Por que "Obra" e não "Marco":** "marco" já é o marco de *gatos* que abre passivas (§3.4). A Obra
> é o prédio-virada — outro conceito. Ver CONTEXT.

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

A **base da coroa é o `lifetime`** (produção genuína da run) — que **exclui os lumps de Era** (§4.5,
por decisão): o presente comemorativo não infla o prestígio, do mesmo jeito que não empurra Era de
graça. Coroa mede mérito; lump é peixe pra gastar.

> **✅ Base revista e IMPLEMENTADA (§4.6.9, ADR-0003, 2026-07-16):** com o `lifetime` removido como
> driver, a Coroa escala pelos **peixes gastos na run** — `coroas = floor(sqrt(gastos / PRESTIGE_DIVISOR))`,
> onde `gastos` = tudo que sai do saldo (gatos + passivas + Obras). Como `gastos ≈ produção`, os alvos
> do §8 aproximadamente sobrevivem e o `CROWN_BONUS` não mudou. A preocupação "lump não pode inflar o
> `lifetime`" **evaporou** (o `lifetime` é só vitrine agora). A tabela abaixo lê "peixes **gastos** na
> run" na 1ª coluna. O reset da run zera `gastos` junto com peixes/gatos/habilidades.

**Reseta:** peixes, gatos, prédios desbloqueados, habilidades compradas (exceto Selo Imperial), Era
(volta ao Beco). Tudo isso **cai em cascata de `lifetime → 0`**: prédios re-travam e a Era volta à I
(Beco) porque ambos derivam do lifetime — não há flags separados a zerar. As coroas ganhas são
calculadas **antes** do reset (do lifetime da run que está acabando). O relógio da run (`runInicioTs`,
base da conquista "Dinastia Descartável", §12) é **re-armado** no ato.
**Mantém:** coroas, bônus global, **Selo Imperial** (concedido na 1ª Dinastia, mantido nas
seguintes), conquistas, estatísticas vitalícias.

As **Coroas persistem como contagem** (não são "gastas") — dão bônus passivo hoje e, no endgame,
serão também a moeda dos **Artefatos** (§13). Não modele coroa como recurso consumível.

> **✅ REVISTO ([ADR-0004](docs/adr/0004-corte-lendaria-e-rumo-hibrido.md), 2026-07-16):** a Coroa
> **deixa de dar bônus e vira moeda GASTÁVEL** — morre o `CROWN_BONUS` (`+2%/produção`); a Coroa é
> gasta na **Corte Lendária** (§4.6.7), que passa a ser o vetor de progresso permanente. A fórmula
> vira **`cbrt(gastos/DIVISOR)`** (era `sqrt`). O **Selo Imperial vira o Lendário #0**. **Decidido,
> a implementar** — o código ainda roda o modelo `sqrt` + `CROWN_BONUS` + Selo-flag até a migração.

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
    tipoGato: 'rua',
    custoBasePorGato: 15,
    producaoPorGato: 0.1,
    desbloqueio: 0,               // peixes acumulados na run
    marcos: [10, 25, 50, 100],
    // arte (ícone da lane, fundo, sprite do gato) mora em ui/buildingArt.ts (id → asset),
    // não aqui — nomes de arquivo são livres desde v0.5 (ART_STYLE §7). Prédio tem 1 ícone só.
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
**Esticar a escada de Eras** (§4.5): o slice comprime beco → galáxia em 6 degraus; o jogo completo
insere **mais Eras *entre* estes** (mais vilas/cidades/impérios intermediários), não um teto novo ·
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
| 2026-07-15 | **Eras do Império implementadas (passo 5, §4.5)** | Sistema completo: `domain/era.ts` (`nivelDaEra`, `lumpDaEra`, puros + testes), `data/eras.ts` (escada + limiares + constantes de lump), store (`aplicarGanhoLifetime` centraliza tick+clique, detecta cruzamento, paga lump, arma fanfarra), save (`eraMaisAlta` opcional, **sem bump de versão** — preserva saves), HUD (badge de Era), fanfarra que some sozinha, céu por Era (`ui/eraArt.ts`, fallback no `sky_beco`). Decisões de implementação: **lump entra só em peixes, não no `lifetime`** (não encadeia Era de graça; mantém a escada/prestígio dirigidos por produção genuína); **hidratação sincroniza a Era em silêncio** (sem lump/fanfarra) |
| 2026-07-15 | **Eras = escada de escala inteira, não "Eras do Beco"** | Direção do usuário: as Eras **sobem de escala** (beco → vila → cidade → metrópole → império → galáxia), não são seis sabores do beco. Puxa **Miadópolis e o nível galáctico do §13 pra dentro da escada do slice**; o backlog vira "esticar a escada" (mais Eras *entre* estas), não "distritos além do Beco". `Era` ganha campo `escala` (degrau legível) separado de `nome` (o trocadilho). Escada final: Beco Esquecido · Vila do Ronrom · Gatópolis · Miadópolis · Império dos Bigodes · Via-Láctea Felina. Revê §2, §4.5, §13. Prompts dos 5 céus entregues (bloco de mundo de fundo, variação do §5.3 do ART_STYLE) |
| 2026-07-15 | **Eras — arte ligada + polimento da fanfarra** | Os **5 céus das Eras 2–6** gerados (variam a hora do dia: amanhecer → dia → entardecer → crepúsculo → cósmico) e ligados no `ui/eraArt.ts` (arquivos vieram com prefixo `cat_*`, mapeados em código). Império **refeito** pra capital futurista planetária (não regredir a tecnologia depois da Metrópole — lição no ART_STYLE §5.5). **Scrim** no `.skybg` (degradê escuro topo/base) pra a UI clara ler sobre céus claros. **Fanfarra de troca de Era** ganhou VFX **em código** (raios dourados girando + burst de moedas/peixes/brilhos, reusando sprites — zero asset novo), memoizado por Era e respeitando `prefers-reduced-motion`. Só código/arte, sem mudança de regra |
| 2026-07-15 | **Mudança visual de prédio por marco — descontinuada (documentando decisão de grelha antiga)** | Registro de uma decisão de grelha que nunca tinha sido escrita: os marcos **não** mudam mais o sprite do prédio (o antigo "nível 1→2 em 25 gatos, 2→3 em 100" saiu), junto com os **"3 estágios do Beco"**. A progressão visível (pilar §1) passa a ser **troca de mundo por Era** (§4.5/§4.6.5) + enxame enchendo a lane. Motivo: sprites por-nível são caros e de baixo retorno no modelo empilhado (§4.6.4). Reconcilia §1, §2, §3.4, ART_STYLE §7, CONTEXT e README — que ainda descreviam a feature como ativa. O marco hoje faz **só** abrir a passiva |
| 2026-07-15 | **Nova Dinastia (passo 7) — grelha de prestígio** | Sessão de grelha do prestígio do slice (domain já pronto/testado; a grelha resolveu a *cola*). **Selo Imperial** concretizado: 1ª Habilidade global (§3.6), concedido na 1ª Dinastia, produção ×1,5, sobrevive ao reset; modelado como **flag boolean** no estado + **fator global opaco** no domain (`production` recebe o fator, sem saber que é "Selo"). **Reset** definido campo a campo, em cascata de `lifetime→0` (prédios re-travam, Era→Beco); coroa lê o `lifetime` (produção genuína, **exclui lumps de Era**), calculada antes do reset; Selo **não empilha**. **`runInicioTs`** plantado (relógio de parede) pra a conquista "Dinastia Descartável" — a *avaliação* fica no passo 8. Save ganha `seloImperial?` e `runInicioTs?` como **campos opcionais sem bump** (padrão do `eraMaisAlta`). Tela de confirmação enxuta (reusa `.modal`, mostra perde/mantém/coroas/multiplicador via `resumoNovaDinastia`); troca-pro-Beco é a comemoração; linha do Selo só na estreia. Botão no HUD, escondido até ≥1 coroa (placement provisório). CONTEXT: +**Selo Imperial**, +**Habilidade global** |
| 2026-07-15 | **Nova Dinastia — Selo visível + contador de Dinastias** | Ajuste de feedback após teste: (1) o Selo Imperial agora **aparece carimbado na placa da Caixa de Papelão** (sinete dourado com o gato-rei) quando concedido — antes o ×1,5 valia mas era invisível na tela principal, contrariando a promessa do modal; (2) novo estado permanente **`dinastias`** (contagem de fundações — não derivável das coroas, que crescem por valor), exibido no HUD após a 1ª e persistido como campo opcional sem bump. Só UI + um contador; nenhuma regra de economia muda |
| 2026-07-16 | **Curva travada (§4.6.3) + escada de 36 prédios em data/ (content-first)** | Grelha da §4.6.3: fórmula geométrica no índice global `i` — pilotos i=0..3 = valores canônicos do Cookie Clicker (§8 preservado), i≥4 = continuação `custo 15·9,283^i` / `prod 0,1·7,775^i` (emenda lisa no Píer, 2 alg. signif.). **Achado:** roda inteira em float64 (36º ~1,1e35 « overflow 1,8e308); >9e15 perde só exatidão de inteiro (invisível formatado) ⇒ `break_infinity` segue no backlog. `data/buildings.ts` reescrito com os **36 prédios** (6 Eras × 6, 6º = Obra), +campos `era`/`ehObra`, `tipoGato` relaxado p/ `string`. **Motor inalterado** (ainda `lifetime`/`desbloqueio`); passivas dos 32 novos = placeholder por fallback, arte cai na Caixa. Nomes/tipos = humor editável. tsc+83 testes+build verdes |
| 2026-07-16 | **v0.6 — progressão por Obras (cadeia de compra), `lifetime` removido como driver ([ADR-0003](docs/adr/0003-progressao-por-obras.md))** | Grelha da espinha de progressão até o endgame. **Revê §4.5 e a base da Coroa (§6), recém-implementadas.** O `lifetime` deixa de dirigir mecânica (vira estatística de vitrine). **Cadeia de compra:** 1º gato comprado revela o próximo prédio (gate = custo crescente, auto-pacing). **Obra** (termo novo no CONTEXT): prédio-virada produtor, último da cadeia de cada Era; construí-la vira a Era (mundo + fanfarra) e revela o 1º prédio da seguinte. **Era vira estado guardado** (Obras construídas), não derivada do `lifetime`. **Coroa escala por peixes gastos na run** (`sqrt(gastos/DIV)`), não `lifetime`. **Estrutura de endgame: 6 Eras × 6 prédios = 36** (o 6º de cada Era é a Obra), "6 por Era" extensível. Adiciona §4.6.9; notas de revisão em §3.3/§4.5/§4.6.5/§6; CONTEXT: +**Obra**, "Era" corrigida. **Decisão documentada; implementação (migração de save + estado novo) é sessão dedicada** — o slice roda no modelo `lifetime` até lá |
| 2026-07-16 | **✅ v0.6 — motor migrado (cadeia de compra + Era-por-Obra + Coroa-por-gastos + save v2)** | Implementação da espinha do ADR-0003/§4.6.9. **Unlock por cadeia:** `predioDesbloqueado(b, gatos)` = anterior tem ≥1 gato (1º prédio sempre visível); **sem flag persistido** — `gatos` já É o registro dos atos concretos. **Era-por-Obra:** `domain/era.ts` troca `nivelDaEra(lifetime)` por `eraDeObras(nObras)`; `eraAtual(gatos)`/`obrasConstruidas(gatos)` na store; construir a Obra (1º gato, `ehObra`) dispara fanfarra + lump em `comprarGatos` (nunca offline). Última Obra "aponta" p/ Era 7 (backlog) → sem fanfarra. **Coroa por `gastos`:** novo estado `gastos` (gatos+passivas+Obras); `coroasGanhasNaRun(gastos)` = `sqrt(gastos/DIV)`; math idêntica. **`lifetime` = vitrine** (exibido sob a taxa + no dev; dirige zero). **Save v2:** +`gastos`, −`eraMaisAlta`; migração v1→v2 semeia `gastos ≈ lifetime` (preserva prestígio). **Removidos:** `nivelDaEra`/`LIMIARES`/`Era.limiar`/`Building.desbloqueio`/`aplicarGanhoLifetime`/`eraMaisAlta`. DevPanel: "Construir próxima Obra", `gastos → N 👑`. Testes reescritos (era/store) + novo `save.test` (migração). tsc + **88 testes** + build verdes. **Pendências:** 4 passivas reais e arte por prédio novo; multiplicador global de Era do §4.6.5 (hoje ainda lump) segue fora de escopo |
| 2026-07-16 | **v0.7 — Corte Lendária + rumo híbrido registrados ([ADR-0004](docs/adr/0004-corte-lendaria-e-rumo-hibrido.md))** | Grelha dos Lendários (§4.6.8) fechada e registrada. **Rumo:** híbrido tipo Cookie Clicker (campanha finita bespoke + motor endless; "endless tipo CC" = replay + número dentro do float64, `break_infinity` adiado). **Coroa vira moeda GASTÁVEL** (`cbrt(gastos/DIV)`; morre o `CROWN_BONUS +2%`); é o que a **Corte Lendária** consome. **Corte Lendária** (revê o gacha do §4.6.7): draft de 3 + reroll com **piso** (RNG só na oferta, nunca nos stats — antipilar §1); poder **determinístico** por nível (buff ×~1,15/nível, **multiplicativo** — quebra paredes; aditivo estagnaria, provado por simulação). ~5 papéis (produção/clique/custo/offline/adianta-Era). **Selo → Lendário #0**. Loop **validado** (sim.: ~16 dinastias/36 prédios, sem travar; DIVISOR sintoniza). Reconcilia §4.6.7/§4.6.8/§6/CONTEXT (+**Gato Lendário**, Coroa e Selo redefinidos). **Decidido, NÃO implementado** — código ainda em `sqrt`+`CROWN_BONUS`+Selo-flag; migração é a próxima sessão (build grande: data/domain/estado/UI) |
| 2026-07-16 | **v0.7 — balanceamento: curva suavizada ×4,5 + passivas mais baratas + rumo híbrido (endless tipo CC)** | Grelha de balanceamento (pesquisa de gênero: Cookie Clicker/AdVenture Capitalist/Clicker Heroes/Antimatter/Egg Inc). **Decisão de rumo:** FCE mira o **híbrido tipo Cookie Clicker** — campanha finita e bespoke (6 Eras/36 prédios) + **motor endless** (Dinastia/Coroa/Lendários compõem sem teto; conteúdo por fórmula além da Era 6). "Endless tipo CC" ≠ conteúdo infinito nem nested layers: é replay + número-sobe **dentro do float64** (`break_infinity` só além de ~1e300 — segue adiado). **Curva suavizada (§4.6.3):** de ×9,283→**×4,5** custo / ×7,775→**×4,0** produção, re-ancorada no Píer (pilotos i0-3 mantidos). 36º custa ~9,6e24 (24 ordens vs 34); 22 prédios no inteiro exato; late-game granular (não one-shot). **Passivas:** `FATOR_CUSTO` 10→**4** (1ª passiva custava ~40 gatos; queixa "caras desde o prédio 1"). **Decidido em grelha, a implementar:** Coroa deixa de dar `+2%/produção` (mata `CROWN_BONUS`) e vira **moeda gastável dos Lendários** (resolve a moeda do §4.6.8); fórmula da Coroa `sqrt`→**`cbrt`** (Cookie Clicker, "8× pra dobrar", doma o "coroas escalonando muito"). Esses dois entram na **grelha dos Lendários** (o motor endless). Só dados tocados; tsc + 88 testes + build verdes |
