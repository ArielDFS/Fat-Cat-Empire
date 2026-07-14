# 🐱 Fat Cat Empire

> Codinome interno: **Império Felino**

Idle **incremental híbrido** (na linhagem de *Cookie Clicker* + *Clicker Heroes*): gatos de rua
transformam um beco num império absurdo, movidos a peixes, ronrons e ambição desproporcional.
Você compra **gatos** dentro de **prédios fixos**, o número sobe sozinho, e escolhe investir no
eixo **passivo (idle)** ou de **clique (ativo)**.

**Status:** vertical slice **v0.2** em construção. A economia (`domain/`) está pronta e testada; a UI
(lanes estilo Cookie Clicker) já roda com os primeiros assets.

## Rodar

```bash
npm install
npm run dev        # app em http://localhost:5173
npm test           # testes da economia (Vitest)
npm run typecheck  # TypeScript strict
```

Logo/marca: abra `http://localhost:5173/logo.html`.

## Stack

TypeScript (strict) · Vite · React + CSS Modules · Zustand · Vitest.
Regra de ouro: `src/domain/` é economia **pura** (sem React/estado), 100% testável.

## Documentação

| Arquivo | O que é |
|---|---|
| [`GAME_DESIGN.md`](GAME_DESIGN.md) | **Fonte da verdade** do design e do balanceamento |
| [`CONTEXT.md`](CONTEXT.md) | Glossário — a linguagem canônica do projeto |
| [`ART_STYLE.md`](ART_STYLE.md) | Bíblia de arte (paleta, style block, pipeline) |
| [`docs/adr/`](docs/adr/) | Decisões arquiteturais (ex.: idle + clicker) |

## Pipeline de arte

Assets são gerados por IA sobre fundo magenta e passados por
[`normalize_asset.py`](normalize_asset.py), que recorta o chroma, impõe a paleta travada e
redimensiona:

```bash
python normalize_asset.py raw/cat_rua.jpg --out src/assets/ --kind cat
```

---

_Projeto pessoal em desenvolvimento. Feito com [Claude Code](https://claude.com/claude-code)._
