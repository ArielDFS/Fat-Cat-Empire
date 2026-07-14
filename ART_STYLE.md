# ART_STYLE.md — Fat Cat Empire (codinome: Império Felino)

> **Dois tracks, duas fontes de consistência.**
> **World/UI** (prédios, lanes, ícones, VFX) é *Chunky Flat Cartoon*: a consistência vem da
> **restrição** — paleta travada imposta pelo `normalize_asset.py` (§8).
> **Character** (os gatos) é *Detailed Character*: a consistência vem de um **style block e uma
> proporção compartilhados** (§5.2), com cor **livre por tipo**. Gato **não** passa pela quantização.
> É a combinação dos dois que faz o jogo parecer coeso sem achatar os personagens.

---

## 0. Os dois tracks `[TRAVADO]`

| Track | Cobre | Estilo | Pipeline | Consistência vem de |
|---|---|---|---|---|
| **World/UI** | prédios, fundos de lane, ícones, VFX, cenário | Chunky Flat Cartoon (§1A) | gera → **quantiza** p/ paleta travada (§8) | a **paleta travada** (§2A) |
| **Character** | os 4 gatos-tipo (rua, pescador, peixeiro, banqueiro) | Detailed Character (§1B) | gera bespoke → recorta/ancora, **sem quantizar** | **style block + proporção** (§5.2) |

Regra de decisão: **é um gato? → track Character.** Qualquer outra coisa → track World/UI.
Nunca rode um gato pelo `--kind cat/lanecat` antigo (quantizaria e mataria o sombreado).

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

Cada cor tem **exatamente uma sombra**. Dois tons por material. Zero gradiente. O `normalize_asset.py`
impõe isto no track World/UI.

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
| **pescador** | Barraca de Peixe | cinza-azulado tigrado | chapéu de chuva turquesa + capa de chuva amarela + vara | turquesa/amarelo |
| **peixeiro** | Peixaria do Beco | creme/tigrado claro | avental rosa + chapéu de papel + peixe na mão | rosa |
| **banqueiro** | Banco do Atum | preto/grafite elegante | gravata-borboleta dourada + monóculo | dourado |

O contorno escuro (`#241C2E`) é o **único elo forçado** com o track World/UI — mantenha-o nos gatos
pra eles não flutuarem sobre os prédios chapados.

---

## 3. Regras de desenho

### 3A. World/UI (flat)

| Elemento | Regra |
|---|---|
| **Contorno** | Espessura uniforme, ~8px em canvas de 1024. Nunca varia dentro do mesmo asset. |
| **Sombreamento** | Cel shading, borda dura, 1 tom de sombra. Luz **sempre** do canto superior esquerdo, 45°. |
| **Perspectiva** | Frontal com inclinação de ~15° de cima. Ortográfica. Sem ponto de fuga. Sem isométrico. |
| **Prédios** | Base plana alinhada ao rodapé do canvas. Sem sombra projetada no asset (a sombra é feita no jogo, com uma elipse chapada). |
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
Se o modelo não gerar alpha, gere em chroma `#FF00FF` e deixe o script recortar.

---

## 5. STYLE BLOCK — World/UI (sprite) `[TRAVADO]`

Este bloco vai **verbatim** em *todo* prompt de sprite chapado (prédios, ícones, VFX). Só o `[SUBJECT]` muda.

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
> A **paleta reduzida** ancora a cena nas cores do beco; troque só os destaques por cenário. O
> `--kind lanebg` ainda quantiza pra paleta travada completa — a paleta enxuta é guia de geração.

### Exemplos de `[SCENE]` (fundos de lane)

| Asset | SCENE |
|---|---|
| `bg_lane_caixa` | `a grimy back-alley ground and low brick wall at night, empty alley floor and wall` |
| `bg_lane_barraca` | `a wet cobblestone harbor dock floor with a low stone quay wall and scattered fish scales` |
| `bg_lane_peixaria` | `a tiled fishmonger shop floor with a low counter base and puddles of melting ice` |
| `bg_lane_banco` | `a polished marble bank floor with a low golden baseboard and tuna-can column bases` |

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
| **pescador** ✅ | `a fluffy blue-gray tabby fisherman cat wearing a teal rain hat and a rolled-up yellow raincoat, holding a small fishing rod with a fish on the line, cheerful confident expression, a tiny anchor pin on the coat` |
| **rua** | `a scruffy orange tabby street cat with a slightly torn ear and a tiny scar over one eye, wearing a tattered orange bandana around the neck and a flattened bottle-cap pinned as a badge, holding a fish bone like a little trophy, cocky mischievous grin, streetwise confident swagger` |
| **peixeiro** | `a cream-furred cat fishmonger wearing a pink apron and a folded paper hat, holding a fresh fish, proud friendly expression, sleeves rolled up` |
| **banqueiro** | `a sleek charcoal-black cat banker wearing a golden bow tie and a monocle, holding a gold coin, smug wealthy expression, groomed and dignified` |

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
| `bg_lane_peixaria` | `a fishmonger shop floor, low tiled counter wall behind, scattered fish scales and thin puddles of melting ice, cool clean tones` |
| `bg_lane_banco` | `a polished marble bank floor, low ornate wall with a golden baseboard behind, a small stack of coins to one side, warm golden tones` |

Pipeline: `python normalize_asset.py raw/bg_lane_barraca.png --out src/assets/ --kind lanehd` (redimensiona
a tira **sem quantizar**). No jogo a lane repete a tira no eixo X (`background-repeat: repeat-x`), então
a emenda invisível é obrigatória.

---

## 6. Pipeline de consistência

### 6A. World/UI (flat)

```
1. MODEL SHEET  →  2. REFERENCE SET  →  3. GERAÇÃO  →  4. NORMALIZAÇÃO  →  5. QA
```

**Normalização obrigatória.** Todo PNG de mundo/UI passa pelo `normalize_asset.py`: força a paleta,
recorta, ancora e redimensiona (§8). É aqui que a consistência do track chapado acontece.

### 6B. Character (gatos)

1. **Um gato-tipo por vez**, como **ilustração inteira** (traje embutido). Não há mais `cat_base + uniforme`
   nem composição em runtime — cada tipo é um asset bespoke.
2. **Âncora de estilo:** o **pescador aprovado** é a referência. Gere os outros 3 com ele como
   referência de estilo/personagem (Gemini/Nano Banana `--cref`, Midjourney `--sref`). É isto que
   mantém os 4 coesos sem quantização.
3. Fundo **transparente** (ou chroma `#FF00FF`).
4. **Normalização SEM quantização:** `python normalize_asset.py raw/cat_pescador.png --out src/assets/ --kind charcat`.
   Esse modo **só** recorta o chroma, apara o alpha, ancora e redimensiona a ~112px — **não** toca nas cores.
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
| **Gatos-tipo (detalhados)** | rua, pescador, peixeiro, banqueiro | Character | 4 |
| Prédios (ícone de lane) | 4 prédios × níveis 1 e 2 | World/UI | 8 |
| Fundos de lane | 1 tira por prédio × 4 | World/UI | 4 |
| Cenário | fundo do beco em 3 estágios | World/UI | 3 |
| Ícones | peixe, coroa, compra, habilidade, evento | World/UI | 5 |
| VFX | peixe, moeda, confete, estrela | World/UI | 4 |

**Mudança v0.3:** os "gatos-tipo detalhados" (4) **substituem** o antigo `cat_base` + `blink` + os 4
`uni_*` (6 assets → 4). Sem composição em runtime. **Nível 3 dos prédios e animações ficam fora do slice.**

### Nomenclatura `[TRAVADA]`

```
cat_rua.png            cat_pescador.png       cat_peixeiro.png       cat_banqueiro.png
bld_caixa_n1.png       bld_caixa_n2.png       bld_barraca_n1.png     ...
bg_lane_caixa.png      bg_lane_barraca.png    bg_lane_peixaria.png   bg_lane_banco.png
bg_beco_e1.png         bg_beco_e2.png         bg_beco_e3.png
icon_peixe.png         icon_coroa.png         ...
vfx_confete.png        ...
```

Minúsculas, `snake_case`, sem acento, sem espaço. O `id` bate com o `id` em `src/data/`.

---

## 8. `normalize_asset.py`

O enforcement do track World/UI, e o recorte/escala do track Character.

```bash
# World/UI: quantiza pra paleta travada
python normalize_asset.py raw/bld_barraca_n1.png --out src/assets/ --kind building
python normalize_asset.py raw/bg_lane_barraca.png --out src/assets/ --kind lanebg

# Character: NÃO quantiza — só recorta, ancora e redimensiona
python normalize_asset.py raw/cat_pescador.png --out src/assets/ --kind charcat
```

Para World/UI ele: (1) recorta chroma/fundo, (2) **quantiza cada pixel para a cor mais próxima da
paleta travada**, (3) apara o alpha, (4) reancora e redimensiona, (5) salva PNG otimizado.

Para `--kind charcat` (gatos), o passo **(2) é pulado** — as cores detalhadas do gato são
preservadas. Todo o resto (recorte, apara, âncora, resize) roda igual.

---

## 9. Checklist de aceite de asset

### 9A. World/UI (flat)
- [ ] Fundo 100% transparente (ou opaco tileável, se fundo de lane), sem franja branca
- [ ] Toda cor pertence à paleta travada (o script confirma)
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
