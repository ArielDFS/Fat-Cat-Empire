# raw/ — assets brutos gerados pela IA

Aqui vão os PNGs (ou JPGs) **direto da IA**, antes do tratamento.

Desde v0.5 o tratamento (recorte, apara de alpha, âncora, resize) é **à mão** — o antigo
`normalize_asset.py` foi aposentado. Salve o PNG já pronto em `src/assets/` e ligue-o no
mapeamento em [`../src/ui/buildingArt.ts`](../src/ui/buildingArt.ts).

Prompts e regras de estilo: [`../ART_STYLE.md`](../ART_STYLE.md) (§5.x para os STYLE BLOCKs).
