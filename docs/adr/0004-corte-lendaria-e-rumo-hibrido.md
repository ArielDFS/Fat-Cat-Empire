# Rumo híbrido (campanha finita + motor endless) e a Corte Lendária como vetor permanente

---
Status: accepted (revê o §4.6.7 — aquisição por gacha; e o §6 — Coroa como contagem que dá bônus)
Data: 2026-07-16
---

Decisão de direção do jogo, tomada numa grelha de balanceamento (com pesquisa de gênero: Cookie
Clicker, AdVenture Capitalist, Clicker Heroes, Antimatter Dimensions, Egg Inc) e validada por
simulação do loop de prestígio.

## Decisões

1. **FCE é um híbrido "tipo Cookie Clicker": campanha finita + motor endless.** A jornada bespoke
   (6 Eras / 36 prédios, arte por Era, arco beco→galáxia) é a **campanha** — o gancho e a identidade.
   Por baixo roda um **motor endless**: Dinastia/Coroa/Lendários compõem **sem teto**, e além da Era 6
   o conteúdo continua por **fórmula** (Eras 7+ genéricas / níveis infinitos). Chegar ao Trono da
   Via-Láctea = "zerou a história" (um marco), mas o número segue subindo. **"Endless tipo CC" ≠
   conteúdo infinito nem camadas aninhadas** — é replay + número-sobe **dentro do float64** (o CC vive
   sob 1,8e308 com notação nomeada). `break_infinity.js` só é preciso muito além do fim da campanha
   (§9/§13, segue adiado).

2. **A Coroa deixa de dar bônus e vira moeda gastável.** Morre o `CROWN_BONUS` (`+2%/produção por
   coroa`, aditivo). A Coroa passa a ser **gasta** na Corte Lendária. A fórmula muda de `sqrt` para
   **`cbrt(gastos / DIVISOR)`** (padrão Cookie Clicker: "8× pra dobrar"), o que doma o "coroas
   escalonando demais". Isso **resolve a reconciliação de moeda pendente do §4.6.8** (Coroa era
   "contagem não-gasta"; agora é gastável — não há mais Legado separado).

3. **Os Gatos Lendários (Corte Lendária) são o ÚNICO vetor de progresso permanente**, e são
   **multiplicativos** (pra furar as paredes exponenciais — um bônus aditivo estagnaria, confirmado
   na simulação). Modelo:
   - **Aquisição (RNG leve, estilo draft):** ao recrutar, o jogo oferece **3** Lendários sorteados do
     pool (filtrado pelos tiers de Era desbloqueados). Você recruta 1 (custo em Coroas). **Reroll** da
     oferta de 3 custa Coroas, com **piso**: o pool encolhe conforme você coleta, então o reroll nunca
     vira treadmill de otimização (respeita o antipilar §1). O RNG afeta só *qual* entra, **nunca os
     stats**.
   - **Poder (determinístico):** cada Lendário sobe de **nível** (custo em Coroas crescente; buff
     escala `×~1,15`/nível). O multiplicador permanente **M = produto dos buffs**.
   - **Papéis (~5):** produção global (os quebra-parede), clique, corte de custo, ganho offline,
     adianta-Era. Elenco convergente (todos pegam todos no fim); a variedade é de **elenco**, não de run.
   - **Tiers por Era:** Lendários "galácticos" só entram no draft depois de tocar a Era 6, etc.

4. **O Selo Imperial vira o Lendário #0** — recrutado de graça na 1ª Dinastia (×1,5 produção). Some o
   caso especial (flag + fator opaco); um sistema só.

5. **A curva por-prédio foi suavizada** de ×9,283 → **×4,5** (custo) / **×4,0** (produção),
   re-ancorada no Píer (pilotos i0-3 mantidos) — já implementado na v0.7. Curva suave = progressão
   granular (não "one-shot" no late-game), menos ordens de grandeza (24 vs 34), mais prédios
   relevantes juntos — o que o motor endless/empilhado pede.

## Por quê

- **A simulação matou o modelo antigo.** Coroa aditiva (`+2%`) × economia exponencial **estagna**:
  a parede da Era N exige mais multiplicador do que a run travada consegue produzir. Um vetor
  permanente **multiplicativo e composto** (Lendários) é o que faz "cada dinastia chega mais longe"
  fechar — validado: ~16 dinastias pra 36 prédios, ~2 prédios/dinastia, sem travar (com buff/nível
  forte o bastante; o divisor da coroa sintoniza o nº de dinastias).
- **Endless é o patamar do gênero.** Os idle de mercado são "não-zeráveis". O híbrido dá os dois:
  uma jornada com fim (identidade + arte) **e** a cauda infinita (retenção).
- **Corte Lendária > gacha puro.** O draft-de-3 + reroll-da-oferta mantém a emoção de "puxar" e a
  coleção nomeada com arte, **sem** o reroll-por-stats que seria o puzzle de otimização rejeitado
  pelo antipilar (§1), e é fácil de balancear (custo/buff conhecidos).

## Consequências

- **A implementar (sessão dedicada, grande):** `data/legendaries.ts` (elenco + papéis + tiers),
  `domain/legendaries.ts` (buff por nível, custo, M; puro/testável), estado (banco de Coroas gastável,
  níveis, coleção, oferta de draft), painel de UI (recrutar/reroll/subir nível). Trocar a Coroa para
  `cbrt` e **remover o `CROWN_BONUS`**; **Selo → Lendário #0** (tira a flag `seloImperial` do caminho
  especial). Save ganha os campos da Corte (bump de versão).
- **Números (elenco, buff/nível, custos, DIVISOR, tiers) são §8** — afináveis contra o jogo real; a
  **forma** está travada e validada.
- **`break_infinity.js` segue adiado** — a campanha (36 prédios ×4,5 → ~9,6e24) e um bom tanto do
  endgame cabem no float64. Só entra se algum dia passar de ~1e300.
- **Revê o §4.6.7** (aquisição por gacha → draft-de-3 determinístico no poder) e o **§6** (Coroa
  contagem-com-bônus → moeda gastável `cbrt`; Selo → Lendário #0). CONTEXT: **Coroa Felina** e **Selo
  Imperial** redefinidos; **Gato Lendário** promovido a termo canônico.
- **Decisão documentada; NÃO implementada** aqui — o código ainda tem `CROWN_BONUS`, Selo como flag e
  Coroa `sqrt`. A migração é a próxima sessão.

## Alternativas rejeitadas

- **Gacha puro (sorteio + reroll-por-stats), §4.6.7 original.** Rejeitado: RNG nos stats + reroll vira
  o puzzle de otimização do antipilar (§1), e exige muito mais arte única.
- **Árvore de upgrades sem gatos nomeados (Heavenly Upgrades do CC).** Rejeitado: perde a identidade
  da coleção nomeada (o "elenco" é o que o jogador quer, §4.6.7).
- **Manter a Coroa como bônus de produção (`+2%`).** Rejeitado: estagna contra a economia exponencial
  (simulação).
- **Curva ×9,283 canônica.** Rejeitada pra este jogo: late-game "one-shota" e cobre ordens demais;
  ×4,5 dá granularidade, que é o que o endless/empilhado pede.
- **Jogo finito não-endless.** Rejeitado: não atinge o patamar do gênero; e o híbrido custa pouco a
  mais (o motor de prestígio já existe).
```
