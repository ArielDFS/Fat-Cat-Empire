# 🐱 Fat Cat Empire

> Codinome interno: **Império Felino**

Idle **incremental híbrido** (na linhagem de *Cookie Clicker* + *Clicker Heroes*): gatos de rua
transformam um beco num império absurdo, movidos a peixes, ronrons e ambição desproporcional.
Você compra **gatos** dentro de **prédios fixos**, o número sobe sozinho, e escolhe investir no
eixo **passivo (idle)** ou de **clique (ativo)**.

**Status:** vertical slice **v0.3** em construção. `domain/` (economia) pronta e testada; **save +
progresso offline**, os **4 prédios com desbloqueio em cascata** e o clique já funcionam. Arte em
**dois tracks** (mundo chapado + personagens detalhados) — gatos, lanes, logo e HUD "claro imperial"
já na tela. **Eras do Império** (eixo civilizacional, §4.5) desenhadas, a implementar.

## Rodar

```bash
npm install
npm run dev        # app em http://localhost:5173
npm test           # testes da economia (Vitest)
npm run typecheck  # TypeScript strict
```

Logo/marca: abra `http://localhost:5173/logo.html`.

## Stack

TypeScript (strict) · Vite · React + CSS global (`src/ui/styles.css`) · Zustand · Vitest · fonte Fredoka.
Regra de ouro: `src/domain/` é economia **pura** (sem React/estado), 100% testável.

## Documentação

| Arquivo | O que é |
|---|---|
| [`GAME_DESIGN.md`](GAME_DESIGN.md) | **Fonte da verdade** do design e do balanceamento |
| [`CONTEXT.md`](CONTEXT.md) | Glossário — a linguagem canônica do projeto |
| [`ART_STYLE.md`](ART_STYLE.md) | Bíblia de arte (paleta, style block, pipeline) |
| [`docs/adr/`](docs/adr/) | Decisões arquiteturais (ex.: idle + clicker) |

## Pipeline de arte

Assets vêm de IA e passam pelo [`normalize_asset.py`](normalize_asset.py). São **dois tracks**
(detalhe em [`ART_STYLE.md`](ART_STYLE.md)):

- **Mundo/UI** (chapado) — quantizado pra paleta travada: `--kind building | lanebg | icon | vfx`.
- **Personagens** (detalhado) — **sem** quantizar: `--kind charcat` (gatos) · `--kind lanehd` (fundos de lane).

```bash
python normalize_asset.py raw/cat_pescador.png --out src/assets/ --kind charcat
```

O lockup da marca (mascote + wordmark) sai pronto via [`export_logo.py`](export_logo.py).

---

_Projeto pessoal em desenvolvimento. Feito com [Claude Code](https://claude.com/claude-code)._
