# Progressão dirigida por Obras (cadeia de compra), não por `lifetime`

---
Status: accepted (revê a decisão v0.3 do §4.5 — "Era = função pura de `lifetime`")
---

O `lifetime` (total de peixes produzidos na run) deixa de dirigir **qualquer** mecânica. A progressão
passa a ser conduzida por **atos concretos e visíveis** — construir prédios — em vez de um odômetro
invisível:

- **Prédios destravam em cadeia de compra:** comprar o 1º gato de um prédio revela o próximo.
- **A Era vira ao construir uma Obra** — um prédio-virada temático (Prefeitura → Vila; Centro de
  Pesquisas Espaciais → Galáxia) que é o **último prédio da cadeia** de cada Era. Construí-la pela 1ª
  vez troca o mundo, dá a fanfarra e revela o 1º prédio da Era seguinte. A Era deixa de ser função
  pura do `lifetime` e vira **estado guardado** (as Obras construídas).
- **O prestígio (Coroa) escala pelos peixes gastos na run** (`sqrt(gastos / DIVISOR)`), não pelo `lifetime`.
- **Estrutura de endgame:** 6 Eras (beco → galáxia) × 6 prédios (o 6º é a Obra) = **36 prédios**; o
  "6 por Era" é um alvo **extensível**.
- O `lifetime` sobrevive só como **estatística de vitrine** (exibido, dirige zero mecânicas).

## Por quê

Dirigir a Era por `lifetime` (§4.5) faz a civilização "subir" quando um número secreto cruza um
limiar — sem agência nem ficção. Amarrar a virada a **construir a Obra que a inaugura** dá o momento
de conquista ("juntei e ergui a Prefeitura → viramos uma Vila") e alinha **progressão, mundo e
prestígio a uma espinha só, visível**. O `lifetime` era ainda **parcialmente redundante**: o custo
crescente do 1º gato de cada prédio já exige produção acumulada, então a cadeia de compra se
auto-pacinga sem um segundo gate invisível.

## Consequências

- **Revê o §4.5** (Era = função pura de `lifetime`) e a base da Coroa do §6 (era `lifetime`, vira
  peixes-gastos). Ambas recém-implementadas (v0.5 / passo 7) — a **migração é uma sessão dedicada**
  (não feita aqui; só documentada). O slice segue rodando no modelo `lifetime` até lá.
- **Estado novo a guardar:** o conjunto de prédios desbloqueados e a Era atual deixam de ser
  deriváveis (eram função do `lifetime`) e passam a ser **persistidos**. Implica migração de save.
- **A fórmula de curva (§4.6.3)** precisa ser função da **posição na cadeia**, robusta a inserir
  prédios no meio de uma Era (o "6 por Era" é extensível).
- **Novo termo canônico "Obra"** (CONTEXT) — o prédio-virada produtor. Não confundir com "marco"
  (marco de gatos, §3.4).
- Some a maquinaria "lump não conta no `lifetime`" (§4.5) — sem `lifetime`, não há o que proteger.

## Alternativas rejeitadas

- **Era por `lifetime` (status quo v0.3).** Rejeitada: sem agência — a civilização sobe por um número
  secreto, não por um ato do jogador.
- **Obra como monumento improdutivo.** Rejeitada: conceito novo e caso especial na UI/código; a Obra
  produtora reusa todo o sistema de prédios e já é o prédio mais caro da Era (peso de virada de graça).
- **Coroa pela Era alcançada** (em vez de peixes-gastos). Rejeitada: teto de ~6 coroas/run no slice é
  pouco; peixes-gastos dá curva granular e suave, e aproveita que `gastos ≈ produção` (o ritmo do §8
  aproximadamente sobrevive). O **Legado** do §4.6.6 (moeda *do endgame*) segue escalando por Era —
  são moedas distintas.
