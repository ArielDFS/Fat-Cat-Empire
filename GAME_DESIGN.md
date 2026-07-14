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
| 2 | Barraca de Peixe | pescadores | 100 | 1 | 250 |
| 3 | Peixaria do Beco | peixeiros | 1.100 | 8 | 8.000 |
| 4 | Banco do Atum | banqueiros | 12.000 | 47 | 120.000 |

> Limiares de desbloqueio são alvo de balanceamento (§8), não sagrados como as constantes de §3.1.

### 3.4 Marcos e Habilidades passivas

A cada marco de gatos **do mesmo prédio**, duas coisas acontecem:

```
marcos = [10, 25, 50, 100]
```

1. **Destrava uma Habilidade passiva** daquele prédio — uma melhoria **comprável** (com peixes)
   que multiplica a produção do prédio (tipicamente ×2). É o modelo Cookie Clicker/Clicker Heroes:
   o marco *abre* o upgrade, o jogador *compra*. Teto no slice: ×16 por prédio (4 marcos).
2. **Dispara a mudança visual** do prédio: nível 1 → 2 em 25 gatos, nível 2 → 3 em 100.

> **Decisão de design (v0.2):** isto **funde** os antigos "Upgrades" (§3.6 do v0.1) e o antigo
> "dobra automática por marco" (§3.4 do v0.1) num **único** sistema — habilidade passiva
> comprável, destravada por marco. Um sistema a menos.

Exemplos de Habilidade passiva (nomes/valores ajustáveis):
Papelão Reforçado · Isca Premium · Gerente Sonolento · Reunião que Poderia Ser um Miado.

### 3.5 Clique e Habilidades ativas — o eixo *clicker*

O clique é um **eixo de progressão legítimo** (ADR-0001), não mais um resíduo. Base:

```
peixes_por_clique = max(1, producao_por_segundo * CLICK_FACTOR)
```

O poder do clique ganha vida através de **Habilidades ativas**: efeitos acionáveis, com cooldown,
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
| UI | React + CSS Modules | Idle é HUD + números. Phaser é overkill agora. |
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
5. Os 4 prédios (desbloqueio em cascata), as habilidades passivas, os marcos.
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

**Artefatos** — árvore de meta-progressão de endgame comprada com Coroas Felinas, no espírito dos
*Ancients* do Clicker Heroes (é o lar dos "gatos nomeados" e itens colecionáveis). ·
Miadópolis e demais distritos · Ronrons e Influência (só se virarem decisão, não número) ·
raridades · árvore de legado · mais eventos e habilidades ativas · som ·
animações de trabalho e celebração · migração para Phaser/Canvas se as lanes exigirem.

---

## Changelog

| Data | Mudança | Motivo |
|---|---|---|
| 2026-07-13 | v0.1 — escopo travado do slice | Documento inicial derivado do plano conceitual |
| 2026-07-13 | **v0.2 — reestruturação do modelo** | Grelha: prédios fixos + gatos como unidade comprável; híbrido idle+clicker (ADR-0001); sistema único de Habilidades (passiva/ativa) funde upgrades e marcos; decisão real vira build ativa-vs-idle; artefatos → endgame; layout de lanes estilo Cookie Clicker; §8 revisado |
