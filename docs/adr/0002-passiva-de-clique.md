# O poder de clique também vem de Habilidades passivas

---
Status: accepted
---

As Habilidades passivas de prédio (§3.4) deixam de ser exclusivas do eixo idle. Passam a vir em
**dois sabores** que competem pelos mesmos Peixes: **Passiva de Produção** (multiplica a produção
passiva do prédio) e **Passiva de Clique** (aumenta o poder de clique). Isso importa a variedade de
upgrades do gênero (Cookie Clicker: *"clicking gains +% of your CpS"*; Clicker Heroes: *click damage*
como eixo próprio) sem inventar um sistema novo — é o mesmo sistema de passivas, com dois efeitos.

## Por quê

O ADR-0001 estabeleceu clique e produção como dois eixos legítimos, e o §4 os transformou na única
decisão real do jogo (idle vs. ativa vs. híbrida). Mas os §3.4/§3.5 alocavam **todo** o poder de
clique ao eixo ativo/global, deixando as passivas monótonas ("todas ×2 na produção"). Trazer o clique
para dentro das passivas dá variedade às lojas dos prédios **e** torna a decisão do §4 mais rica: o
"build" passa a ser, literalmente, *quais passivas você compra*.

## As duas travas que mantêm o §4 vivo

1. **Mesma moeda (custo de oportunidade).** Passiva de Produção e de Clique custam Peixes, no mesmo
   prédio. Cada Peixe em clique é um Peixe que não foi em produção. A decisão emerge da alocação.
2. **Passiva de Clique é invisível offline.** O ganho offline (§7) usa só produção. Uma Passiva de
   Clique não rende nada ausente — então "idle rende melhor ausente" (§3.5 `[TRAVADO]`) se sustenta
   sozinho, sem código especial.

## Consequências

- **`CONTEXT.md` reescrito:** "Habilidade passiva" não é mais sinônimo de Build idle; entram os
  termos **Passiva de Produção** e **Passiva de Clique**.
- **§3.4 e §3.5 serão reescritos** (changelog v0.4). A fórmula do clique ganha um multiplicador de
  passivas de clique: `peixes_por_clique = max(1, prod/s × CLICK_FACTOR) × mult_clique`. O piso
  protege a base sem apagar o multiplicador C1 no bootstrap. O clique
  continua sendo **sempre uma fração da produção** (nunca "+N fixo"), o que o impede de ficar obsoleto.
- **Não existe build de clique puro.** Como clique = %(produção), a build ativa é **lastreada em
  produção**: compra-se produção pela base, empilham-se Passivas de Clique + burst por cima, e joga-se
  presente. Os três builds (idle/ativa/híbrida) partem todos de uma fundação de produção.
- **O teto ×16 por prédio (§3.4) fica superado** assim que os efeitos deixam de ser homogêneos; novos
  tetos/alvos são trabalho de balanceamento (§8).

## Alternativas rejeitadas

- **Passivas continuam idle-only; clique mora só em habilidades ativas/globais (§3.6).** Rejeitada:
  menos variedade e contraria o idioma do gênero, que rotineiramente põe escala de clique em upgrades.
- **Clique com renda independente da produção (escala com Era/lifetime), viabilizando clicker puro.**
  Rejeitada: mais complexa e reabre o risco de auto-clicker dominante que a trava `[TRAVADO]` do §3.5
  existe para evitar.
