# 🐱 Fat Cat Empire

> Codinome interno: **Império Felino**

Idle **incremental híbrido** (na linhagem de *Cookie Clicker* + *Clicker Heroes*): gatos de rua
transformam um beco num império absurdo, movidos a peixes, ronrons e ambição desproporcional.
Você compra **gatos** dentro de **prédios fixos**, o número sobe sozinho, e escolhe investir no
eixo **passivo (idle)** ou de **clique (ativo)**.

**Status:** vertical slice **v0.4** em construção. `domain/` (economia) pronta e testada; **save +
progresso offline**, os **4 prédios com desbloqueio em cascata**, o clique e as **Habilidades
passivas** já funcionam. As passivas vêm em **dois sabores** que competem pelos mesmos peixes
([ADR-0002](docs/adr/0002-passiva-de-clique.md)): **Produção** (idle) e **Clique** (ativa, invisível
offline) — 4 arquétipos (§3.4). Arte em **dois tracks** (mundo chapado + personagens detalhados) —
gatos, lanes, logo e HUD "claro imperial" já na tela. Falta o **estágio visual por marco** (§3.4
ponto 2, à espera de arte), as **Habilidades ativas** de burst (§3.5), o **prestígio** (§6) e as
**Eras do Império** (§4.5).

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

Assets vêm de IA e são **tratados à mão** (recorte, resize, âncora) e salvos em `src/assets/` — o
antigo `normalize_asset.py` foi aposentado (v0.5). São **dois tracks** (detalhe em
[`ART_STYLE.md`](ART_STYLE.md)):

- **Mundo/UI** (chapado) — paleta travada como **guia de geração** (sem quantização automática).
- **Personagens/prédios/lanes** (detalhado) — cor livre; coesão pelo contorno `#241C2E` + style block.

O mapeamento `Building.id → {icone, lane, gato}` vive em [`src/ui/buildingArt.ts`](src/ui/buildingArt.ts).
O lockup da marca (mascote + wordmark) sai pronto via [`export_logo.py`](export_logo.py).

---

_Projeto pessoal em desenvolvimento. Feito com [Claude Code](https://claude.com/claude-code)._
