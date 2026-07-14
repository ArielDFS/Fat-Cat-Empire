# Império Felino é um híbrido idle + clicker, não um idle puro

---
Status: accepted
---

O GAME_DESIGN.md v0.1 (§3.5) travava o clique como vestigial: *"Não deve haver estratégia
de clique. Se surgir, é bug de design."* Decidimos **abandonar essa regra** e tratar clique e
produção passiva como **dois eixos de progressão legítimos**, mesclando as duas referências
que o autor considera viciantes — Cookie Clicker (produção passiva + evento de clique) e
Clicker Heroes (dano passivo *e* dano de clique como builds distintas). Habilidades destravadas
por marco de gatos poderão bufar qualquer um dos dois eixos.

## Por quê

O pilar "Decisão real" do v0.1 não tinha casa boa (ver histórico da grelha: a alocação de
gatos colapsava para "booste o maior produtor"). Nem CC nem Clicker Heroes têm decisão
estratégica de momento — mas Clicker Heroes tem **uma** decisão real e rejogável: *build ativa
(clique) vs. build idle (passiva)*. Abraçar o clique **importa essa decisão de graça** e dá ao
pilar um lar honesto: o jogador escolhe, por Dinastia/sessão, em que eixo investir.

## Consequências

- **§3.5 do GAME_DESIGN.md será reescrito** (não só ajustado). O clique deixa de ser "bug de design".
- **Risco herdado que o §3.5 existia para evitar:** em idle games, um eixo de clique tende à
  degeneração — ou vira auto-clicker obrigatório, ou pune quem joga idle. O desenho do clique
  precisa mitigar isso explicitamente (ver grelha em andamento: clique baseado em *burst*, não em
  *mash* sustentado; idle sempre viável porque o jogo ainda é jogado em segundo plano).
- **Offline (§7) ganha papel mais claro:** build idle rende ausente; build ativa rende presente.
