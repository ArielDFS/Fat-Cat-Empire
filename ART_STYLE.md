# ART_STYLE.md — Fat Cat Empire (codinome: Império Felino)

> **Consistência não vem do prompt. Vem da restrição.**
> Nenhum modelo de imagem respeita paleta exata, espessura de contorno ou escala.
> Este documento define as regras; o `normalize_asset.py` (§8) as **impõe** no pós-processo.
> É a combinação dos dois que faz 25 assets parecerem do mesmo jogo.

---

## 1. DNA do estilo

**Nome interno:** *Chunky Flat Cartoon* — vetor grosso, achatado, saturado e caricato.

O plano original pedia explicitamente para **abandonar o pastel aconchegante**. Então:
nada de "cozy cat cafe". O alvo é legibilidade de ícone de app + humor de desenho de sábado
de manhã. Cada asset precisa funcionar a 64px e ainda arrancar um sorriso.

| Sim | Não |
|---|---|
| Silhueta reconhecível em preto sólido | Detalhe fino, textura de pelo |
| Acessório gigante, corpo pequeno | Proporção realista |
| Cor chapada + 1 sombra dura | Gradiente, degradê, airbrush |
| Contraste alto e saturado | Pastel, sépia, dessaturado |
| Pose exagerada, solene, ridícula | Pose neutra e "correta" |

**Teste da silhueta:** preencha o asset de preto. Se você não souber o que é, refaça.

---

## 2. Paleta `[TRAVADA]`

Cada cor tem **exatamente uma sombra**. Dois tons por material. Zero gradiente.

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

**Regra:** o contorno nunca é preto puro (`#000`). Preto puro achata a imagem e denuncia
asset de IA. É sempre `#241C2E`.

---

## 3. Regras duras de desenho

| Elemento | Regra |
|---|---|
| **Contorno** | Espessura uniforme, ~8px em canvas de 1024. Nunca varia dentro do mesmo asset. |
| **Sombreamento** | Cel shading, borda dura, 1 tom de sombra. Luz **sempre** do canto superior esquerdo, 45°. |
| **Perspectiva** | Frontal com inclinação de ~15° de cima. Ortográfica. Sem ponto de fuga. Sem isométrico. |
| **Proporção do gato** | 2,5 cabeças de altura. Cabeça enorme, patas pequenas, acessório desproporcional. |
| **Prédios** | Base plana alinhada ao rodapé do canvas. Sem sombra projetada no asset (a sombra é feita no jogo, com uma elipse chapada). |
| **Fundo** | Sempre transparente. Nenhum cenário embutido no sprite. |

---

## 4. Escala e canvas `[TRAVADO]`

Geração sempre em **1024×1024**, PNG com alpha. Exportação para o jogo em `@2x`.

| Tipo | Altura no canvas de geração | Âncora | Export final |
|---|---|---|---|
| Gato (herói / mascote) | 640px | pés a 96px da base | 320px |
| **Gato de lane** | 256px | pés no rodapé | **~40px** |
| Prédio (ícone de lane) | cabe em 768×768 | base no rodapé | 384px |
| **Fundo de lane** | 1024×256 (tira horizontal, tileável) | — | largura da lane |
| Ícone UI | 256×256 | centro | 64px |
| Partícula / VFX | 128px | centro | 64px |

O **gato de lane** é o gato-base + uniforme, **reduzido** para ~40px — precisa continuar legível
e "fofo" nesse tamanho, com dezenas repetidos na faixa. O **fundo de lane** é uma tira horizontal
que se repete no eixo X (a lane pode ser muito larga); não embuta detalhe que denuncie a emenda.

Se o modelo não gerar alpha, gere em chroma `#FF00FF` e deixe o script recortar.

---

## 5. STYLE BLOCK `[TRAVADO]`

Este bloco vai **verbatim, sem editar uma vírgula**, em *todo* prompt de imagem.
Em inglês — os modelos obedecem melhor. Só o `[SUBJECT]` muda.

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

### Exemplos de `[SUBJECT]`

| Asset | SUBJECT |
|---|---|
| Gato-base | `a plain cream-furred cartoon cat standing on two legs, front view, arms slightly out, neutral proud expression, no accessories` |
| Uniforme — gato de rua | `only a small tattered orange bandana and a bottle-cap badge, accessory item alone on transparent background, no cat` |
| Uniforme — pescador | `only a small teal fisherman hat and a tiny fish hook, accessory item alone on transparent background, no cat` |
| Uniforme — peixeiro | `only a small pink apron and a paper hat, accessory item alone on transparent background, no cat` |
| Uniforme — banqueiro | `only a small golden bow tie and a tiny monocle, accessory item alone on transparent background, no cat` |
| Caixa de Papelão nv.1 | `a beaten-up cardboard box shelter with a crooked fish sign, tiny and pathetic, empire starter home` |
| Banco do Atum nv.3 | `a grand marble bank building with tuna-can columns and a golden fish emblem on the pediment, absurdly imperial` |
| Ícone de peixe | `a single stylized fish icon, side view, simple, readable at 64 pixels` |

Os antigos "gatos nomeados" (Miaurício, Dona Sardinha, Bigodovski) **saíram** — deixaram de ser
mecânica (ver GAME_DESIGN.md §4). Se voltarem, será como **mascotes** de prédio ou no endgame de
**Artefatos**, reusando exatamente esta técnica de `[SUBJECT]` de acessório.

**Mascote da marca (logo):** um **rei gato tabby laranja** — coroa dourada, manto vermelho com gola
branca de rei, cetro com peixe dourado, castelinho de latas de atum ao fundo. Vive em `public/logo.html`
(lockup com o wordmark "Fat Cat Empire"). _Pendente:_ definir se o tabby laranja é só o mascote ou o
padrão do gato do jogo (hoje o gato-base do jogo é creme).

---

## 6. Pipeline de consistência (a parte que importa)

```
1. MODEL SHEET  →  2. REFERENCE SET  →  3. GERAÇÃO  →  4. NORMALIZAÇÃO  →  5. QA
```

**1. Model sheet primeiro.** Gere **só o gato-base**, umas 20 vezes, até um sair perfeito.
Esse asset é o DNA do jogo inteiro. Não avance enquanto não estiver certo.

**2. Reference set.** Escolha 2–3 imagens aprovadas (o gato-base + o primeiro prédio bom).
A partir daqui, **nenhum asset é gerado do zero** — todos são gerados *com essas imagens como
referência de estilo/personagem*.

**3. Acessório é camada — agora é o *uniforme do tipo*.** Cada Prédio tem um **tipo de gato**
(rua, pescador, peixeiro, banqueiro). Gere o **uniforme sozinho** (bandana, chapéu de pescador,
avental, gravatinha) no mesmo canvas e escala, com fundo transparente. Compor no jogo
`gato_base + uniforme` custa **1 asset por tipo** em vez de 1 personagem inteiro — e é a única
forma de escalar para 8, 20, 50 tipos depois sem refazer tudo. **Mesma técnica do v0.1, alvo novo:**
o acessório deixou de ser "o personagem Miaurício" e virou "o uniforme dos gatos pescadores".

**4. Normalização obrigatória.** Todo PNG passa pelo script. Ele força a paleta, recorta,
ancora e redimensiona. É aqui que a consistência realmente acontece.

**5. QA.** Checklist no §9.

### Ferramentas — trade-offs

| Abordagem | Prós | Contras | Quando usar |
|---|---|---|---|
| **Edição por referência** (Gemini/Nano Banana, Midjourney `--sref`/`--cref`) | Rápido, barato, ótimo em "o mesmo gato, outro acessório" | Paleta e espessura de traço escapam | **Comece aqui.** É o certo para os ~25 assets do slice |
| **Modelo treinado no art bible** (Scenario, Layer, Sprixen) | <cite index="6-1">Treina um modelo nas suas referências e gera centenas de assets sem style drift</cite> | Mensalidade; só compensa em volume | A partir de ~50 assets / expansão dos distritos |
| **LoRA própria** (SD local) | Controle total, sem custo por imagem | Setup e curva de aprendizado | <cite index="1-1">Faz sentido quando o projeto exige centenas de imagens de um personagem muito distinto</cite> — ou seja, só no jogo completo |
| **Asset pack comprado** | Consistência garantida, hoje | Não é o *seu* jogo | Plano B se a arte virar o gargalo |

> Nota jurídica prática: <cite index="3-1">imagens puramente geradas por IA podem não ser protegidas por direito autoral nos EUA, enquanto as que passam por edição e composição humana significativa têm mais chance de proteção</cite>. A etapa de normalização + composição manual já te coloca do lado certo dessa linha.

---

## 7. Lista de assets do slice (~25)

| Grupo | Itens | Qtd |
|---|---|---|
| Gato | corpo-base (idle) + 1 frame de piscada | 2 |
| Uniformes de tipo | rua, pescador, peixeiro, banqueiro | 4 |
| Prédios (ícone de lane) | 4 prédios × níveis 1 e 2 | 8 |
| **Fundos de lane** | 1 tira por prédio × 4 | 4 |
| Cenário | fundo do beco em 3 estágios (moldura geral) | 3 |
| Ícones | peixe, coroa, compra, habilidade, gato, evento | 6 |
| VFX | peixe, moeda, confete, estrela | 4 |

**Total ≈ 31.** O **gato de lane** não é asset novo: é o gato-base + uniforme reduzido a ~40px
(compõe em runtime). **Nível 3 dos prédios, expressões e animações de trabalho ficam fora do slice.**

### Nomenclatura `[TRAVADA]`

```
cat_base_idle.png          cat_base_blink.png
uni_rua.png                uni_pescador.png        uni_peixeiro.png        uni_banqueiro.png
bld_caixa_n1.png           bld_caixa_n2.png
bld_barraca_n1.png         ...
bg_lane_caixa.png          bg_lane_barraca.png     bg_lane_peixaria.png    bg_lane_banco.png
bg_beco_e1.png             bg_beco_e2.png          bg_beco_e3.png
icon_peixe.png             icon_coroa.png          ...
vfx_confete.png            ...
```

Minúsculas, `snake_case`, sem acento, sem espaço. O `id` bate com o `id` em `src/data/`.

---

## 8. `tools/normalize_asset.py`

O enforcement. Roda em todo asset gerado, sem exceção.

```bash
python tools/normalize_asset.py raw/ --out src/assets/ --kind cat
```

Ele: (1) recorta chroma/fundo, (2) **quantiza cada pixel para a cor mais próxima da paleta
travada**, (3) apara o alpha, (4) reancora e redimensiona conforme §4, (5) salva PNG otimizado.

O passo 2 é o segredo. Nenhum prompt garante `#FF7A2F`; o script garante.

---

## 9. Checklist de aceite de asset

- [ ] Fundo 100% transparente, sem franja branca na borda
- [ ] Toda cor pertence à paleta travada (o script confirma)
- [ ] Contorno `#241C2E`, espessura uniforme
- [ ] Uma sombra dura, luz vindo de cima à esquerda
- [ ] Escala e âncora corretas para o tipo (§4)
- [ ] Legível a 64px
- [ ] Passa no teste da silhueta
- [ ] Nome do arquivo bate com o `id` no `data/`

---

## Changelog

| Data | Mudança |
|---|---|
| 2026-07-13 | v0.1 — paleta, style block e pipeline travados |
| 2026-07-13 | Acessório = uniforme de tipo; assets de lane (gato pequeno + fundo); `bg_lane` no script |
| 2026-07-13 | **+ Cinza de rua** (`#ADA6B5` / `#6F6780`) na paleta travada — pelo alternativo do gato de rua |
