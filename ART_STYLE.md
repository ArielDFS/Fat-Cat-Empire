# ART_STYLE.md — Fat Cat Empire (codinome: Império Felino)

> **Dois tracks, duas fontes de consistência.**
> **World/UI** (ícones de UI, VFX, cenário do beco) é *Chunky Flat Cartoon*: a consistência vem da
> **restrição** — paleta-guia enxuta + contorno `#241C2E` (tratamento à mão desde v0.5, §0/§8).
> **Detailed** (gatos, **prédios** e fundos de lane) é renderizado: a consistência vem de um
> **style block, uma proporção e o contorno escuro `#241C2E` compartilhados** — com **cor livre por
> asset**. Não passa pela quantização.
> É a combinação dos dois que faz o jogo parecer coeso sem achatar os assets ilustrados.

---

## 0. Os dois tracks `[TRAVADO]`

| Track | Cobre | Estilo | Pipeline | Consistência vem de |
|---|---|---|---|---|
| **World/UI** | ícones de UI, VFX, cenário do beco | Chunky Flat Cartoon (§1A) | gera → **tratado à mão** (recorte/resize; paleta como guia) | a **paleta como guia** (§2A) |
| **Detailed** | gatos-tipo, **prédios**, fundos de lane | Detailed (§1B, §5.2–§5.4) | gera bespoke → recorta/ancora **à mão** | **style block + proporção + contorno `#241C2E`** |

Regra de decisão: **é um ícone de UI ou VFX pequeno?** → World/UI (flat). **É ilustração
(gato, prédio, lane)?** → Detailed (renderizado, **cor livre**, só o contorno `#241C2E` é obrigatório).

> **Mudança v0.5 (2026-07-15) — `normalize_asset.py` aposentado.** O usuário faz **recorte,
> dimensionamento e tratamento à mão** e salva o PNG já pronto em `src/assets/`. Não há mais passo
> de quantização automática; a **paleta travada virou guia de geração** também no World/UI. Os STYLE
> BLOCKs (§5.x) e o contorno `#241C2E` seguem sendo o que garante coesão. As menções ao script e ao
> `--kind …` abaixo são **legado** — ignore o comando, mantenha os prompts. Nomes de arquivo agora são
> livres; o mapeamento `Building.id → asset` vive em `src/ui/buildingArt.ts`, não em `data/`.

> **Mudança v0.4 (paleta destravada nos prédios):** os prédios saíram do flat+quantizado e entraram
> no track Detailed, pra ganharem **identidade de cor própria** (§2C) — antes convergiam pra
> turquesa+laranja e ficavam indistinguíveis. O elo que segura a coesão passa a ser o **contorno
> escuro + o estilo de render compartilhado**, não a paleta. A paleta travada segue mandando só em
> **ícones de UI e VFX**.

---

## 1. DNA do estilo

### 1A. Chunky Flat Cartoon — World/UI

**Vetor grosso, achatado, saturado e caricato.** Nada de "cozy cat cafe". O alvo é legibilidade de
ícone de app + humor de desenho de sábado de manhã. Cada asset precisa funcionar a 64px e ainda
arrancar um sorriso.

| Sim | Não |
|---|---|
| Silhueta reconhecível em preto sólido | Detalhe fino, textura de pelo |
| Acessório gigante, corpo pequeno | Proporção realista |
| Cor chapada + 1 sombra dura | Gradiente, degradê, airbrush |
| Contraste alto e saturado | Pastel, sépia, dessaturado |
| Pose exagerada, solene, ridícula | Pose neutra e "correta" |

**Teste da silhueta:** preencha o asset de preto. Se você não souber o que é, refaça.

### 1B. Detailed Character — os gatos

**Mascote de mobile game caprichado.** Contorno grosso ainda existe, mas por cima vem **volume
renderizado**: cel shading com degradê macio, pelo detalhado, olhos grandes expressivos, traje
temático **integrado** (não um acessório colado). Proporção fofa e chunky (cabeção, patas pequenas).
Saturado, vibrante, luz quente do canto superior esquerdo com rim light sutil.

| Sim | Não |
|---|---|
| Sombreado macio com volume, pelo detalhado | Chapado, minimalista, plano |
| Traje inteiro coerente com o tipo | Acessório minúsculo solto |
| Olhos grandes, expressão com personalidade | Cara neutra, genérica |
| Cor **própria por tipo** (varia entre lanes) | Todos com a mesma pelagem |
| Silhueta ainda legível a ~112px | Detalhe que vira papa no tamanho de jogo |

**Teste da lane:** reduza a ~112px e repita 12×. Se virar borrão ou os tipos ficarem
indistinguíveis, simplifique o traje ou aumente o contraste de pelagem.

---

## 2. Paleta

### 2A. World/UI `[TRAVADA]`

Cada cor tem **exatamente uma sombra**. Dois tons por material. Zero gradiente. Desde v0.5 (§0) **não
há quantização automática** — a paleta é **guia de geração** em todos os tracks; o tratamento é à mão.
O único elo travado com o mundo continua sendo o contorno `#241C2E`.

| Papel | Base | Sombra |
|---|---|---|
| Contorno (todos os assets) | `#241C2E` | — |
| Laranja (destaque, peixes, energia) | `#FF7A2F` | `#D9541C` |
| Turquesa (água, tecnologia, calma) | `#2EC4B6` | `#1B8C82` |
| Roxo (noite, misticismo, cósmico) | `#7B4FE0` | `#55329E` |
| Vermelho (perigo, alerta, comédia) | `#E63946` | `#B02532` |
| Rosa (afeto, ronrom) | `#FF6FB5` | `#D14A8C` |
| Dourado (imperial, recompensa) | `#FFC93C` | `#D99A12` |
| Pelo creme (gato-base) | `#FFE8C8` | `#E0BE97` |
| Cinza de rua (pelo alternativo) | `#ADA6B5` | `#6F6780` |
| Papel / UI clara | `#FDF3E3` | `#E3D6BE` |
| Fundo do beco | `#3B2E4F` | `#2A2039` |

**Regra:** o contorno nunca é preto puro (`#000`). É sempre `#241C2E`.

### 2B. Character — guia de cor por tipo (não travada)

Os gatos **não** são quantizados, mas os 4 tipos precisam **diferir entre si** de relance (decisão
de design: variedade é *entre tipos*, §4 do GAME_DESIGN). Guia de pelagem + traje por tipo — cores
livres, mas mantenha as **pelagens bem distintas**:

| Tipo | Prédio | Pelagem | Traje integrado | Destaque |
|---|---|---|---|---|
| **rua** | Caixa de Papelão | laranja/ruivo tigrado | bandana surrada + crachá de tampinha | laranja |
| **peixeiro** | Barraca de Peixe | tuxedo branco-e-preto | avental teal-e-branco listrado + chapéu de papel + peixe embrulhado | turquesa |
| **feirante** | Miaurcado | tigrado caramelo/castanho malhado | avental verde + camisa listrada + caixote de peixe e legumes + bolsa de moedas | verde |
| **pescador** | Píer de Pesca | cinza-azulado tigrado | chapéu de chuva turquesa + capa de chuva amarela + vara | turquesa/amarelo |

O contorno escuro (`#241C2E`) é o **único elo forçado** entre os tracks — mantenha-o nos gatos
(e nos prédios, §2C) pra tudo pertencer ao mesmo mundo.

### 2C. Identidade de cor por prédio (Detailed, não travada)

Cada prédio tem uma **identidade de cor própria** — é o que os distingue de relance. **Não** caia no
turquesa+laranja como padrão (foi o que deixou os 3 primeiros indistinguíveis). Silhueta **e** cor
diferenciam (§1A + isto): um prédio deve ser reconhecível pela forma *e* pela cor.

| Prédio | Identidade de cor | Vibe / silhueta |
|---|---|---|
| Caixa de Papelão | papelão kraft/marrom + laranja | abrigo improvisado, humilde — o começo |
| Barraca de Peixe | turquesa + madeira clara | barraca de doca marítima |
| **Miaurcado** | **verde + branco** (supermercado) | loja moderna de fachada de vidro — **não** vendinha |
| Píer de Pesca | azul-marinho/índigo + madeira escura + âmbar de lampião | píer de doca ao entardecer |

> **Nota (2026-07-15):** os 4 prédios acima são os **pilotos**. O jogo cresce acrescentando **muitos
> mais prédios em ordem de custo crescente** — cada um ganha sua própria identidade de cor por esta
> regra. O Píer é o piloto #4, **não** o teto da escada.

---

## 3. Regras de desenho

### 3A. World/UI (flat)

| Elemento | Regra |
|---|---|
| **Contorno** | Espessura uniforme, ~8px em canvas de 1024. Nunca varia dentro do mesmo asset. |
| **Sombreamento** | Cel shading, borda dura, 1 tom de sombra. Luz **sempre** do canto superior esquerdo, 45°. |
| **Perspectiva** | (ícones/VFX) Frontal, centrado, ortográfico. **Prédios seguem o §5.4** (3/4 dimensional). |
| **Prédios** | Movidos pro track **Detailed (§5.4, v0.4)**: vista 3/4 dimensional, cor livre. Base plana no rodapé, sem sombra projetada (a elipse é feita no jogo). |
| **Fundo** | Sempre transparente (exceto fundo de lane, §5.1). Nenhum cenário embutido no sprite. |

### 3B. Character (detailed)

| Elemento | Regra |
|---|---|
| **Proporção do gato** | ~2,5 cabeças de altura. Cabeça enorme, patas pequenas, traje proeminente. |
| **Contorno** | Grosso e escuro (`#241C2E`), mas pode variar de espessura pra dar profundidade. |
| **Sombreamento** | Cel shading **com degradê macio** e volume. Luz do canto superior esquerdo + rim light sutil. |
| **Vista** | Frontal 3/4, corpo inteiro, pose com personalidade. |
| **Fundo** | Transparente. Sem sombra de chão embutida (a elipse é feita no jogo). |
| **Traje** | Integrado ao corpo, coerente com o tipo (§2B). Não é camada colada — é parte do personagem. |

---

## 4. Escala e canvas `[TRAVADO]`

Geração sempre em **1024×1024**, PNG com alpha. Exportação para o jogo em `@2x`.

| Tipo | Track | Altura no canvas de geração | Âncora | Export final |
|---|---|---|---|---|
| **Gato-tipo (lane)** | Character | corpo inteiro em ~900px | pés no rodapé | **~112px** |
| Prédio (ícone de lane) | World/UI | cabe em 768×768 | base no rodapé | 384px |
| Fundo de lane | World/UI | 1024×256 (tira horizontal, tileável) | — | largura da lane |
| Ícone UI | World/UI | 256×256 | centro | 64px |
| Partícula / VFX | World/UI | 128px | centro | 64px |
| Cenário (beco) | World/UI | 1024 | centro | moldura |

**Mudança v0.3 (enxame reduzido):** o gato de lane deixou de ser 40px composto (`cat_base + uniforme`).
Agora é **1 ilustração detalhada por tipo, exportada a ~112px**, e a lane mostra **~12 gatos** (não 48).
Poucos e grandes, pra o detalhe do 1B render. O teto exato é afinável no código (`TETO_VISUAL`).

O **fundo de lane** é uma tira horizontal que se repete no eixo X; não embuta detalhe que denuncie a emenda.
Se o modelo não gerar alpha, gere em chroma `#FF00FF` e recorte à mão.

---

## 5. STYLE BLOCK — World/UI (sprite) `[TRAVADO]`

Este bloco vai **verbatim** em *todo* prompt de sprite chapado (ícones de UI, VFX). Só o `[SUBJECT]`
muda. **Prédios saíram daqui** (v0.4) e usam o bloco Detailed do §5.4 — os exemplos de prédio abaixo
ficam como legado histórico.

```
Flat vector cartoon game asset. Thick uniform dark outline (#241C2E, ~8px at 1024).
Cel shading with exactly two tones per material: flat base color plus one hard-edged shadow.
No gradients, no texture, no drop shadow, no rim light. Light source from the top-left at 45
degrees. Bold rounded silhouette, oversized props, exaggerated cute proportions, high
saturation, high contrast. Strict palette only: #FF7A2F #D9541C #2EC4B6 #1B8C82 #7B4FE0
#55329E #E63946 #FF6FB5 #FFC93C #D99A12 #FFE8C8 #E0BE97 #ADA6B5 #6F6780 #FDF3E3 #241C2E.
Straight-on front view with a slight 15-degree top-down tilt, orthographic, no perspective
distortion. Centered, full body, fully transparent background, no scenery, no text,
no watermark, no shadow on the ground.

SUBJECT: [SUBJECT]
```

**Negative prompt:**

```
pastel, muted, desaturated, realistic, photorealistic, 3D render, gradient, soft shading,
airbrush, painterly, sketchy lines, drop shadow, ground shadow, background, scenery, text,
watermark, signature, isometric, low contrast, detailed fur texture, anime, chibi blush,
multiple characters, cropped
```

### Exemplos de `[SUBJECT]` (World/UI)

| Asset | SUBJECT |
|---|---|
| Caixa de Papelão nv.1 | `a beaten-up cardboard box shelter with a crooked fish sign, tiny and pathetic, empire starter home` |
| Banco do Atum nv.3 | `a grand marble bank building with tuna-can columns and a golden fish emblem on the pediment, absurdly imperial` |
| Ícone de peixe | `a single stylized fish icon, side view, simple, readable at 64 pixels` |

---

## 5.1 STYLE BLOCK — fundos de lane e cenário `[TRAVADO]`

> **Nota:** as lanes do slice usam a versão **detalhada** (§5.3). Este bloco chapado/quantizado
> fica como fallback barato (cenários secundários, protótipo).

O bloco da §5 assume **sprite**: transparente, sem cenário. **Fundos de lane são o oposto** —
**opacos**, **tileáveis** no eixo X, e aqui o cenário *é* o asset. Bloco próprio, também verbatim,
trocando só o `[SCENE]`.

Diferenças-chave: contorno só nas formas de primeiro plano · paleta reduzida às cores da cena ·
emenda invisível (esquerda casa com direita) · simples e limpo pro sprite ler por cima.

```
Flat vector cartoon game background strip, horizontal banner. Thick dark outline (#241C2E)
on foreground shapes, cel shading with two tones per material, no gradients, no texture,
no drop shadow, light from the top-left. Strict palette only: #3B2E4F #2A2039 #FF7A2F
#D9541C #2EC4B6 #1B8C82 #FFC93C #D99A12 #FFE8C8 #E0BE97 #FDF3E3 #241C2E.
[SCENE], SEAMLESS and TILEABLE horizontally (left and right edges must match), plain and
uncluttered so cat sprites read clearly on top. Opaque, fills the entire frame.
No characters, no text, no watermark, no logo.

SUBJECT: [SCENE]
```

**Negative prompt:**

```
pastel or muted or desaturated colors, realistic or photorealistic or 3D render style,
gradients, soft/airbrush shading, drop shadow or ground shadow, scenery, text, watermark,
signature, isometric view, detailed fur texture, anime, blush, multiple cats, cropped edges.
```

> **`scenery` no negative** aqui significa "nada de cenário **extra** além do que o `[SCENE]` pediu".
> A **paleta reduzida** ancora a cena nas cores do beco; troque só os destaques por cenário
> (paleta como guia — sem quantização automática desde v0.5).

### Exemplos de `[SCENE]` (fundos de lane)

| Asset | SCENE |
|---|---|
| `bg_lane_caixa` | `a grimy back-alley ground and low brick wall at night, empty alley floor and wall` |
| `bg_lane_barraca` | `a wet cobblestone harbor dock floor with a low stone quay wall and scattered fish scales` |
| `bg_lane_miaurcado` | `a cobblestone street-market floor with a low stall counter base and scattered crates` |
| `lane_fishing_pier` | `a weathered wooden pier walkway with a low pier railing base and scattered rope and barrels` |

---

## 5.2 STYLE BLOCK — Character (gatos) `[TRAVADO]`

O bloco dos **gatos**. Renderizado, não chapado. Verbatim; só o `[SUBJECT]` muda (a pelagem e o
traje de cada tipo vêm de §2B). Este bloco foi calibrado e **aprovado** contra a imagem-piloto do pescador.

```
Polished mobile-game character art, cute cartoon cat mascot, single character, full body,
front three-quarter view. Bold dark outline, rich cel shading with soft gradients and rendered
volume, expressive oversized eyes, chunky adorable proportions with a big head and small paws.
Vibrant saturated colors, warm storybook lighting from the top-left with a subtle rim light,
detailed but clean fur. Readable silhouette, no busy background. Fully transparent background,
no baked ground shadow, no scenery, no text, no watermark, centered, not cropped.

SUBJECT: [SUBJECT]
```

**Negative prompt:**

```
flat vector, minimalist, plain, low detail, dull or washed-out colors, photorealistic, 3D render,
deformed, extra limbs, blurry, text, watermark, signature, multiple characters, cropped, busy background
```

### `[SUBJECT]` dos 4 gatos-tipo

| Tipo | SUBJECT |
|---|---|
| **rua** | `a scruffy orange tabby street cat with a slightly torn ear and a tiny scar over one eye, wearing a tattered orange bandana around the neck and a flattened bottle-cap pinned as a badge, holding a fish bone like a little trophy, cocky mischievous grin, streetwise confident swagger` |
| **peixeiro** ✅ | `a plump tuxedo cat fishmonger with a crisp white chest, muzzle and paws and a glossy black back and head, wearing a teal-and-white striped waterproof fishmonger's apron and a little white paper hat, sleeves rolled up, proudly holding out a big fresh fish wrapped in paper as if making a sale, warm friendly salesman grin, a small price tag tucked in the apron pocket` |
| **feirante** ✅ | `a plump caramel-and-brown spotted tabby market-vendor cat wearing a green grocer's apron over a rolled-up striped shirt, a pencil tucked behind one ear and a coin pouch on the belt, holding a small wooden crate of fish and produce, warm cheerful salesman grin` |
| **pescador** ✅ | `a fluffy blue-gray tabby fisherman cat wearing a teal rain hat and a rolled-up yellow raincoat, holding a small fishing rod with a fish on the line, cheerful confident expression, a tiny anchor pin on the coat` |

> **Regra de referência (§6B):** o pescador aprovado é a **âncora de estilo**. Gere os outros 3
> *com ele como referência de estilo/traço* — muda a pelagem e o traje, mantém a família.

---

## 5.3 STYLE BLOCK — fundos de lane detalhados `[TRAVADO]` (ATIVO para as lanes)

O fundo de lane migrou pro track Detailed (renderizado, sem quantização — igual aos gatos). A §5.1
(chapado/quantizado) fica como fallback barato; **as lanes do slice usam este bloco**.

**Aprendido na marra:** a primeira geração usava luz *atmosférica/direcional* ("warm lighting from
the top-left, moody") e poças "reflecting teal light" — isso deixava um lado da tira mais claro que
o outro e, ao repetir, dava **salto de brilho na emenda**. O conserto validado: **luz plana e
uniforme de ponta a ponta**, e no `[SCENE]` descrever **tom** ("subtle teal tint"), nunca **luz
refletida** ("reflecting light"). Bordas esquerda e direita idênticas pra emenda invisível.

> Se a emenda ainda aparecer depois da luz acertada, os próximos suspeitos são **objetos únicos
> grandes** (um caixote repete visível) e a **proporção** (cena alta repete mais na lane). A versão
> aprovada mantém uma parede baixa e um caixote e funcionou — só mexa nisso se o seam persistir.

```
Polished mobile-game environment art, one continuous horizontal seamless background strip for a
game lane. Rich cel shading with soft gradients and rendered volume, bold dark outlines on the
main shapes, FLAT EVEN AMBIENT LIGHTING across the entire width with uniform brightness from edge
to edge — no spotlight, no glow, no vignette, no directional light — vibrant colors, detailed yet
clean, painterly game-art look matching a cute cartoon cat game. A walkable floor across the bottom
two thirds and a low wall behind it, kept uncluttered along the top so character sprites read
clearly standing on the floor. Perfectly tileable horizontally: the left and right edges must match
seamlessly with absolutely no visible seam. Opaque, fills the entire frame.
No characters, no cats, no text, no watermark, no logo, no color swatches, no UI, no border.

SCENE: [SCENE]
```

**Negative prompt:**

```
uneven lighting, spotlight, bright glow, vignette, directional light, brightness gradient across the
width, dark on one side light on the other, localized light, color palette swatches, color chart,
grid of color blocks, flat solid color rectangles, visible seam, tiling error, misaligned edges,
minimalist, plain, low detail, washed-out, photorealistic, 3D render, text, watermark, signature,
characters, cats, cropped, clutter blocking the top
```

### Exemplos de `[SCENE]` (fundos de lane detalhados)

A composição (chão nos 2/3 de baixo + parede baixa atrás) já está no bloco; o `[SCENE]` só descreve
o **material e a coisa** de cada lane. Cor sempre como **tom**, nunca como luz refletida.

| Asset | SCENE |
|---|---|
| `bg_lane_caixa` | `a grimy back-alley at night, weathered low brick wall, cracked cobblestone ground, a few scattered bottles and fish bones to one side, cool moody purple tones` |
| `bg_lane_barraca` ✅ | `a wet cobblestone harbor dock at night, weathered stone quay wall, scattered fish scales, a coil of rope and a wooden crate to one side, faint shallow puddles with a subtle teal tint` |
| `bg_lane_miaurcado` ✅ | `a cobblestone neighborhood street-market floor, a low market stall counter wall behind with a folded striped awning valance, a couple of stacked wooden crates and a few dropped fruits and fish scales to one side, warm earthy market tones with a soft orange tint` |
| `lane_fishing_pier` ✅ | `a weathered wooden pier walkway at night, dark timber plank floor, a low wooden pier railing behind it, a coil of rope and a folded fishing net to one side, a couple of wooden barrels, calm deep harbor water hinted beyond the railing, deep indigo-and-navy tones with a subtle warm amber tint` |

Pipeline (v0.5): recorta/redimensiona **à mão** e salva a tira em `src/assets/`. No jogo a lane repete
no eixo X (`background-repeat: repeat-x`), então a emenda invisível é obrigatória.

---

## 5.4 STYLE BLOCK — prédios detalhados `[TRAVADO]` (ATIVO para os prédios)

Os prédios migraram do flat+quantizado (§5) pro track Detailed (v0.4, §0): render com volume e
**cor livre por prédio** (§2C). O contorno escuro `#241C2E` e o estilo de render são o elo de coesão;
a paleta travada **não** se aplica. Verbatim; só o `[SUBJECT]` muda. A **identidade de cor** de cada
prédio vem de §2C — descreva-a no `[SUBJECT]` e **evite turquesa+laranja como padrão**.

**Câmera `[TRAVADO]`:** vista **3/4 dimensional (levemente isométrica)** — frente dominante, **topo
visível** e um **fio de lateral**. É o ângulo dos prédios existentes (Caixa, Barraca, Miaurcado);
**não** é elevação 2D plana (fica chapada demais) **nem** isométrico extremo com a lateral inteira
recuando. Meio-termo dimensional.

```
Polished mobile-game building illustration, a single structure, a gentle three-quarter dimensional
view — front-dominant with the top slightly visible and just a hint of one side (a light isometric
feel), no strong vanishing-point perspective. Bold dark outline (#241C2E), rich cel shading with soft gradients and rendered volume,
chunky exaggerated cute proportions, oversized charming props, vibrant saturated colors. A DISTINCT
color identity for this building — do NOT default to teal-and-orange. Flat base aligned to the bottom
edge. Fully transparent background, no ground shadow, no scenery, no text, no watermark, centered,
full structure in frame, not cropped.

SUBJECT: [SUBJECT]
```

**Negative prompt:**

```
teal-and-orange by default, same colors as other buildings, flat 2D elevation, blueprint, flat
vector, minimalist, plain, low detail, dull or washed-out colors, photorealistic, 3D render, gradient
banding, drop shadow, ground shadow, scenery, background, text, watermark, signature,
extreme isometric, full side wall receding, multiple buildings, cats, characters, cropped
```

### Exemplos de `[SUBJECT]` (prédios detalhados)

Cor sempre puxando a **identidade do §2C**, para os prédios não convergirem.

| Prédio | SUBJECT |
|---|---|
| Caixa de Papelão | `a humble improvised shelter built from stacked kraft cardboard boxes with duct tape and a crooked little fish flag, warm brown cardboard tones with orange accents, cozy and pathetic, the empire's starter home` |
| Barraca de Peixe | `a wooden harbor fish stall with a teal-and-white striped canopy, hanging fish and a crate of ice, weathered wood and turquoise tones` |
| **Miaurcado** ✅ | `a chunky cartoon neighborhood SUPERMARKET building, a flat modern storefront with big glass windows and automatic double glass doors, a wide blank sign board across the top with a little fish-and-leaf emblem (no lettering), a green-and-white color scheme with warm wood accents, a row of shopping carts out front, crates of fresh fish and produce visible through the windows, a small green entrance awning, clearly a proper store and NOT a market stall` |
| Píer de Pesca | `a charming wooden fishing pier — a raised jetty of weathered dark-timber planks on stout pilings with a cozy little shingled hut at the end, hanging fishing nets, glowing amber lanterns, coiled rope, wooden barrels and a couple of fishing rods leaning on the rail, buckets of fresh fish; a small patch of stylized deep-blue water lapping around the pilings forms the flat base; deep indigo-and-navy water with weathered brown wood and warm amber lantern glow, dusk mood, clearly distinct from the bright teal fish stall` |

---

## 5.5 STYLE BLOCK — mundo de fundo (Era) `[TRAVADO]` (ATIVO para os céus de Era)

O **backdrop fixo da viewport** (§7 "Fundo de mundo (Era)"), um por Era (GAME_DESIGN §4.5/§4.6.5).
**Não** é tira tileável como a lane (§5.3) nem sprite transparente: é uma **cena de estabelecimento
larga e opaca**. O `[SCENE]` **sobe de escala** Era a Era (beco → vila → cidade → metrópole →
império → galáxia) **e varia a hora do dia** (noite → amanhecer → dia → entardecer → crepúsculo →
cósmico) — é isso que faz cada mundo parecer *outro mundo*, não outra noite roxa. Verbatim; só o
`[SCENE]` muda.

> **Legibilidade da UI = scrim de código, não céu escuro `[opção 2, 2026-07-15]`.** Antes os céus
> eram forçados a "dark/moody" pra a UI clara ler por cima — o que deixava as 6 Eras parecidas. Agora
> a legibilidade vem de um **degradê escuro sutil no topo/base** do `.skybg` (`styles.css`), então o
> céu pode ser **claro**. Só mantenha a composição **calma no topo e no terço esquerdo**, onde o HUD
> e a coluna do clique flutuam.

```
Polished mobile-game environment art, a single wide establishing background scene that fills
the whole frame as a fixed world backdrop behind a game UI. Rich cel shading with soft gradients
and rendered volume, bold dark outlines (#241C2E) on the main shapes, vibrant painterly
cute-cartoon cat-game look. Strong sense of place and scale with clear atmospheric depth. The time
of day and mood are defined by the SCENE. Keep the composition relatively calm and uncluttered
across the upper area and the left third, where UI panels will float, with the richer detail toward
the lower edge and the sides. Cohesive with the same cartoon cat world (a grimy cat back-alley grown
into a civilization). No tiling needed. Opaque, fills the entire frame. No characters, no cats, no
text, no watermark, no logo, no UI, no border, no color swatches.

SCENE: [SCENE]
```

**Negative prompt:**

```
flat solid-color background, minimalist empty, color palette swatches, color chart, grid of color
blocks, spotlight glow in the center, photorealistic, 3D render, text, watermark, signature,
characters, cats, people, UI elements, HUD, border frame, cropped, cluttered center
```

### `[SCENE]` dos céus de Era (Era 1 = `sky_beco.png` noturno, já existe)

A **hora do dia** sobe junto com a escala — cada Era é visivelmente outro momento, não outra noite.
Os arquivos entregues vieram com prefixo `cat_*` (nome livre, mapeado em `ui/eraArt.ts`).

| Era / arquivo | Hora | SCENE |
|---|---|---|
| 2 · Vila · `cat_village` | amanhecer | `a small cat village at soft dawn, crooked cobblestone lanes and little tile-roofed cottages with warm glowing windows, fish-shaped weathervanes, a modest market square with wooden stalls, misty low hills behind, a low golden sun rising through a peach-and-rose sky with soft clouds, cozy humble frontier-town waking up, warm pastel dawn palette with gentle mist` |
| 3 · Cidade · `cat_city` | dia claro | `a cheerful cat city on a bright sunny midday, rows of colorful brick townhouses and shopfronts along a sparkling canal, a stone clock tower with a fish emblem, cobbled avenues and little bridges, fluffy white clouds in a clear blue sky, banners and awnings, prosperous and lively, fresh vivid daytime palette of blue sky, warm brick and green trees` |
| 4 · Metrópole · `cat_metropole` | entardecer | `a sprawling cat METROPOLIS skyline at golden-hour sunset, dense clusters of tall glass skyscrapers and fish-shaped signs beginning to glow, elevated highways, a central tower crowned with a giant cat-ear silhouette, a dramatic orange-and-pink sky with the sun low behind the towers casting long light, the first neon signs lighting up, big-city grandeur, warm sunset palette with cool blue shadows and neon accents` |
| 5 · Império · `cat_empire` | crepúsculo | `a colossal futuristic imperial cat capital at twilight blue hour, a planet-spanning throne-city of towering sleek golden-and-white skyscraper-palaces far grander and more advanced than an ordinary metropolis, immense domed spires and a giant glowing crown emblem crowning the central mega-tower, monumental boulevards and floating platforms, a space elevator and faint orbital rings rising into the deep-blue dusk sky where the first stars and a large ringed planet appear on the horizon, holographic banners and warm golden energy-light, majestic and absurdly imposing, regal palette of deep-blue twilight, radiant gold and soft cyan energy glow` |
| 6 · Galáxia · `cat_galaxy_empire` | cósmico | `a vast cosmic cat empire in deep space, a titanic ringed space-station shaped like a curled sleeping cat orbiting a glowing purple-and-teal nebula, fleets of tiny fish-shaped starships, planets and a luminous milky-way band arching across a star-strewn cosmos, distant glowing orbital cities, epic sci-fi scale and wonder, rich cosmic palette of violet, magenta and starlight against deep space` |

> **Lição de direção (2026-07-15):** escala **e** tecnologia sobem **monotonicamente** — cada Era
> tem que parecer *maior e mais avançada* que a anterior. A 1ª versão do Império era um palácio de
> mármore clássico/antigo: lia como **retrocesso** depois da Metrópole cyberpunk. Corrigido pra
> **capital imperial futurista planetária** (out-escala a metrópole + pistas do espaço → ponte pra
> Galáxia). Quando a escada esticar (§13), nenhum degrau novo pode parecer mais antigo que o anterior.

Pipeline (v0.5): trata à mão e salva em `src/assets/`. Depois registra cada arquivo por nível em
`src/ui/eraArt.ts` (`SKY_POR_NIVEL`); o que faltar cai no fallback `sky_beco.png`.

---

## 6. Pipeline de consistência

### 6A. World/UI (flat)

```
1. MODEL SHEET  →  2. REFERENCE SET  →  3. GERAÇÃO  →  4. TRATAMENTO À MÃO  →  5. QA
```

**Tratamento à mão (v0.5).** Todo PNG de mundo/UI é recortado, ancorado e redimensionado à mão e
salvo em `src/assets/`. A paleta é guia de geração (não há mais quantização automática); a coesão vem
do style block e do contorno `#241C2E`.

### 6B. Character (gatos)

1. **Um gato-tipo por vez**, como **ilustração inteira** (traje embutido). Não há mais `cat_base + uniforme`
   nem composição em runtime — cada tipo é um asset bespoke.
2. **Âncora de estilo:** o **pescador aprovado** é a referência. Gere os outros 3 com ele como
   referência de estilo/personagem (Gemini/Nano Banana `--cref`, Midjourney `--sref`). É isto que
   mantém os 4 coesos sem quantização.
3. Fundo **transparente** (ou chroma `#FF00FF`).
4. **Tratamento à mão (v0.5):** recorta o chroma/fundo, apara o alpha, ancora e redimensiona a ~112px
   — **sem** tocar nas cores. Salva em `src/assets/`.
5. QA pelo checklist **9B**.

> A composição/edição humana (recorte, âncora, escolha de referência) é justamente o que tira o
> asset da zona "puramente gerado por IA" — bom pro estilo e pro lado jurídico.

### Ferramentas — trade-offs

| Abordagem | Prós | Contras | Quando usar |
|---|---|---|---|
| **Edição por referência** (Gemini/Nano Banana, Midjourney `--sref`/`--cref`) | Rápido, barato, ótimo em "o mesmo estilo, outro traje" | Paleta e traço escapam | **Comece aqui.** Certo para os ~25 assets do slice |
| **Modelo treinado no art bible** (Scenario, Layer) | Gera centenas sem style drift | Mensalidade | A partir de ~50 assets |
| **LoRA própria** (SD local) | Controle total | Setup + curva | Só no jogo completo |

---

## 7. Lista de assets do slice (~23)

| Grupo | Itens | Track | Qtd |
|---|---|---|---|
| **Gatos-tipo (detalhados)** | rua, peixeiro, feirante, pescador | Detailed (§5.2) | 4 |
| Prédios (ícone de lane) | 4 prédios × **1 ícone** | **Detailed (§5.4)** | 4 |
| Fundos de lane | 1 tira por prédio × 4 | Detailed (§5.3) | 4 |
| Fundo de mundo (Era) | 1 cena detalhada por Era × 6 Eras, backdrop fixo da viewport | Detailed | 6 |
| Ícones | peixe, coroa, compra, habilidade, evento | World/UI | 5 |
| VFX | peixe, moeda, confete, estrela | World/UI | 4 |

**Mudança v0.3:** os "gatos-tipo detalhados" (4) **substituem** o antigo `cat_base` + `blink` + os 4
`uni_*` (6 assets → 4). Sem composição em runtime.

> **Níveis de prédio — CORTADOS (grelha, 2026-07-15).** O prédio tem **1 ícone só** (não n1/n2/n3):
> os marcos deixaram de mudar o sprite (GAME_DESIGN §3.4). A progressão visível fica na **troca de
> mundo por Era** (§5.5) + o enxame na lane. Antes esta lista pedia "4 prédios × níveis 1 e 2 = 8".

### Nomenclatura (v0.5 — livre, mapeada em código)

Os nomes de arquivo **não** são mais travados por convenção `cat_<tipo>`/`bld_*`. O usuário nomeia
livre e o **mapeamento** `Building.id → {icone, lane, gato}` vive em `src/ui/buildingArt.ts`. Nomes
atuais em uso (`src/assets/`):

```
# gatos          # ícones de prédio    # lanes                    # UI/VFX
cat_rua.png       cardbox.png           lane_cardbox.png           fish_coin.png
cat_fish_seller.png  fishing_barrack.png  lane_fishing_barrack.png  fish_click.png
cat_feirante.png  market.png            lane_market.png            logo.png
cat_fisher.png    pier.png              lane_fishing_pier.png

# céus de Era (mundo de fundo, mapeados em ui/eraArt.ts — prefixo cat_ é nome livre, não são gatos)
sky_beco.png (Era 1)   cat_village.png (2)   cat_city.png (3)
cat_metropole.png (4)  cat_empire.png (5)    cat_galaxy_empire.png (6)
```

Só o **contorno `#241C2E`** e os style blocks (§5.x) são travados. Minúsculas, `snake_case`, sem
acento, sem espaço. Os 4 prédios-piloto e os 6 céus já têm arte; o mapeamento vive em
`ui/buildingArt.ts` (prédios) e `ui/eraArt.ts` (céus).

---

## 8. Tratamento de asset (à mão) — `normalize_asset.py` APOSENTADO (v0.5, 2026-07-15)

O script `normalize_asset.py` **foi aposentado e removido**. O usuário faz **à mão** o recorte do
chroma/fundo, a apara do alpha, a âncora e o redimensiona, e salva o PNG pronto em `src/assets/`.

O que o tratamento precisa garantir (o que o script fazia, agora manual):
- **Recorte** do fundo (chroma `#FF00FF` ou transparência) sem franja/halo na borda.
- **Âncora e escala** por tipo (§4): gato ~112px com pés no rodapé, ícone 64px centrado, etc.
- **Paleta**: é só **guia de geração** — não se força mais pixel a pixel. A coesão vem do style
  block e do contorno `#241C2E`.

Nomes de arquivo são livres; o mapeamento `Building.id → {icone, lane, gato}` vive em
`src/ui/buildingArt.ts`.

---

## 9. Checklist de aceite de asset

### 9A. World/UI (flat)
- [ ] Fundo 100% transparente (ou opaco tileável, se fundo de lane), sem franja branca
- [ ] Cores puxam a paleta-guia (§2A); coesão vem do contorno `#241C2E` + style block
- [ ] Contorno `#241C2E`, espessura uniforme · uma sombra dura, luz de cima à esquerda
- [ ] Escala e âncora corretas (§4) · legível a 64px · passa no teste da silhueta
- [ ] Nome do arquivo bate com o `id` no `data/`

### 9B. Character (gatos)
- [ ] Fundo 100% transparente, sem franja/halo na borda
- [ ] Contorno escuro (`#241C2E`) presente — elo com o mundo chapado
- [ ] Pelagem **distinta** dos outros 3 tipos (§2B) · traje coerente com o tipo
- [ ] Legível e reconhecível a ~112px, repetido na lane sem virar papa (teste da lane, §1B)
- [ ] Coeso com a âncora de estilo (o pescador) · sem sombra de chão embutida
- [ ] Nome `cat_<tipo>.png` bate com o `tipoGato` em `src/data/buildings.ts`

---

## Changelog

| Data | Mudança |
|---|---|
| 2026-07-13 | v0.1 — paleta, style block e pipeline travados |
| 2026-07-13 | Acessório = uniforme de tipo; assets de lane (gato pequeno + fundo); `bg_lane` no script |
| 2026-07-13 | **+ Cinza de rua** (`#ADA6B5` / `#6F6780`) na paleta travada — pelo alternativo do gato de rua |
| 2026-07-14 | **+ §5.1 STYLE BLOCK de fundo/cenário** — bloco travado para lane backgrounds (opaco, tileável, paleta reduzida) |
| 2026-07-14 | **+ §5.3 STYLE BLOCK de fundo de lane detalhado** — lanes migram pro track Detailed (renderizado, `--kind lanehd`, sem quantizar). Fix validado contra o erro real (luz direcional/atmosférica dava salto de brilho na emenda ao repetir): **luz plana e uniforme edge-to-edge** + cor como tom, não luz refletida, no `[SCENE]`; bordas idênticas. Composição chão + parede baixa mantida. §5.1 chapado vira fallback |
| 2026-07-14 | **v0.3 — dois tracks de arte.** Gatos migram de "flat + `cat_base`+uniforme composto a 40px" para **Detailed Character**: 1 ilustração bespoke por tipo (§5.2, aprovado no piloto do pescador), export ~112px, enxame reduzido (~12/lane), **sem quantização** (`--kind charcat`). World/UI segue chapado e quantizado. Adiciona §0 (tracks), §1B, §2B, §3B, §5.2, §6B, §9B; revê §4, §7, §8 |
| 2026-07-14 | **3º prédio vira Miaurcado** (era Peixaria do Beco): tipo de gato `peixeiro`→`feirante` (tigrado caramelo, avental verde). Assets entregues como `market.png` (ícone), `lane_market.png` (fundo) e `cat_feirante.png` (gato). Atualiza §0, §2B, §5.1, §5.2, §5.3, §7 |
| 2026-07-14 | **v0.4 — paleta destravada nos prédios.** Prédios saem do flat+quantizado e entram no track **Detailed** (§5.4), com **identidade de cor própria por prédio** (§2C) — antes convergiam pra turquesa+laranja e ficavam indistinguíveis. Coesão passa a vir do **contorno `#241C2E` + estilo de render**, não da paleta; a paleta travada fica só nos **ícones/VFX**. Miaurcado especificado como **supermercado** (fachada de vidro, carrinhos), não vendinha. Reescreve §0, §2A; adiciona §2C, §5.4; revê §7 |
| 2026-07-14 | **Câmera dos prédios = 3/4 dimensional (levemente isométrica).** Correção: o "sem isométrico / frontal 15°" do §3A não batia com os prédios reais (Caixa/Barraca têm topo e lateral visíveis). Adotado o ângulo dimensional que **casa** com os existentes; elevação 2D plana e isométrico extremo ficam no negative. Ajusta §3A e a câmera do §5.4 |
| 2026-07-15 | **Gato da Barraca vira peixeiro (tuxedo).** O gato-vendedor da Barraca deixa de ser o pescador: novo `cat_fish_seller.png` (tuxedo branco-e-preto, avental teal listrado, aprovado). O pescador cinza-azulado (`cat_fisher.png`) fica guardado. Atualiza §2B, §5.2 |
| 2026-07-15 | **v0.5 — `normalize_asset.py` aposentado.** Tratamento (recorte/resize/âncora) passa a ser **à mão**; **sem quantização automática** — paleta vira guia de geração em todos os tracks; coesão fica no contorno `#241C2E` + style blocks. Nomes de arquivo livres, mapeados em `src/ui/buildingArt.ts`. Script deletado. Reescreve §0, §2A, §6, §8; ajusta §5.1, §5.3, §9 |
| 2026-07-15 | **+ §5.5 STYLE BLOCK de mundo de fundo (Era).** Backdrop fixo da viewport, um por Era (GAME_DESIGN §4.5/§4.6.5): cena de estabelecimento larga, opaca; **não** tileável (≠ lane §5.3). `[SCENE]` sobe de escala beco → galáxia. Casado com a escada de escala do GAME_DESIGN (Eras deixam de ser "do Beco") |
| 2026-07-15 | **Níveis de prédio (n1/n2/n3) cortados — documentando decisão de grelha.** Os marcos não mudam mais o sprite do prédio (GAME_DESIGN §3.4); cada prédio tem **1 ícone só**. §7 volta de "4×2=8" pra 4; a linha de mundo de Era vira 6. A progressão visível fica na troca de mundo por Era (§5.5) + o enxame na lane |
| 2026-07-15 | **Céus de Era variam a hora do dia (opção 2).** Antes forçados a "noite escura" pra a UI ler por cima — deixava as 6 Eras parecidas. Agora sobem noite → amanhecer → dia → entardecer → crepúsculo → cósmico (vende a subida de escala). A legibilidade passa a vir de um **scrim** (degradê escuro sutil no topo/base do `.skybg`, `styles.css`), não do céu escuro. Prompts dos 5 céus refeitos no §5.5 |
| 2026-07-15 | **Prédio 4: Banco do Atum → Píer de Pesca.** O pescador guardado vira o gato do Píer; lane `lane_fishing_pier.png` já existe; ícone pendente. Identidade de cor: índigo/azul-marinho + madeira escura + âmbar (§2C). Os 4 prédios são **pilotos** — virão muitos mais em ordem crescente. Atualiza §2B, §2C, §5.2, §5.3, §5.4, §7; código em `buildings.ts`/`abilities.ts`/`buildingArt.ts` |
