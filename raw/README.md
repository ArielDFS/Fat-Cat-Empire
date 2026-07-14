# raw/ — assets brutos gerados pela IA

Aqui vão os PNGs (ou JPGs) **direto da IA**, antes de normalizar.
O `normalize_asset.py` lê desta pasta e escreve os finais em `src/assets/`.

Nomes esperados agora:
- `cat_base_idle.png` — o gato-base creme (referência de DNA, ART_STYLE §6)
- `cat_rua.png` — o gato de rua cinza com trapos

Uso: `python normalize_asset.py raw/cat_rua.png --out src/assets/ --kind cat`
