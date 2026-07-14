#!/usr/bin/env python3
"""
normalize_asset.py — Império Felino

Impõe a bíblia de arte (ART_STYLE.md) nos PNGs gerados por IA:
  1. remove chroma key (#FF00FF) se o modelo não gerou alpha
  2. quantiza cada pixel para a cor MAIS PRÓXIMA da paleta travada
  3. apara o excesso de transparência
  4. reancora e redimensiona conforme o tipo de asset
  5. salva PNG otimizado

Uso:
    python normalize_asset.py raw/ --out src/assets/ --kind cat
    python normalize_asset.py raw/bld_caixa_n1.png --out src/assets/ --kind building
    python normalize_asset.py raw/ --out src/assets/ --kind icon --check-only

Dependência: pillow  (pip install pillow)
Opcional:    rembg   (pip install rembg)  -> use --rembg se o fundo não for chroma nem alpha
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# --- Paleta travada (ART_STYLE.md §2) ---------------------------------------
PALETTE_HEX = [
    "241C2E",  # contorno
    "FF7A2F", "D9541C",  # laranja
    "2EC4B6", "1B8C82",  # turquesa
    "7B4FE0", "55329E",  # roxo
    "E63946", "B02532",  # vermelho
    "FF6FB5", "D14A8C",  # rosa
    "FFC93C", "D99A12",  # dourado
    "FFE8C8", "E0BE97",  # pelo creme
    "ADA6B5", "6F6780",  # cinza de rua (pelo alternativo)
    "FDF3E3", "E3D6BE",  # papel / UI
    "3B2E4F", "2A2039",  # fundo do beco
]

CHROMA = (255, 0, 255)          # magenta usado como fundo quando não há alpha
CHROMA_TOLERANCE = 60           # distância euclidiana no espaço RGB
ALPHA_THRESHOLD = 8             # alpha <= isso vira totalmente transparente

# --- Regras de escala (ART_STYLE.md §4) -------------------------------------
# kind: (altura final em px, ancora)  |  'bottom' = pés/base no rodapé; 'center' = centrado
KINDS = {
    "cat":      (320, "bottom"),
    "lanecat":  (40,  "bottom"),   # gato de lane: gato-base + uniforme reduzido (ART_STYLE §4)
    "building": (384, "bottom"),
    "bg":       (720, "center"),
    "lanebg":   (256, "strip"),    # fundo de lane: tira horizontal tileável (ART_STYLE §4)
    "icon":     (64,  "center"),
    "vfx":      (64,  "center"),
    "acc":      (320, "bottom"),   # uniforme de tipo, gerado sozinho
}


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


PALETTE = np.array([hex_to_rgb(h) for h in PALETTE_HEX], dtype=np.int32)


def strip_chroma(img: Image.Image) -> Image.Image:
    """Torna transparente tudo que for próximo do magenta de chroma."""
    arr = np.array(img).astype(np.int32)
    rgb, alpha = arr[..., :3], arr[..., 3]
    dist = np.sqrt(((rgb - np.array(CHROMA, dtype=np.int32)) ** 2).sum(axis=-1))
    alpha[dist < CHROMA_TOLERANCE] = 0
    arr[..., 3] = alpha
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def quantize_to_palette(img: Image.Image) -> tuple[Image.Image, float]:
    """
    Mapeia cada pixel visivel para a cor mais proxima da paleta travada.
    O canal alpha e preservado (mantem o antialias da borda).
    Retorna a imagem e o desvio medio (0 = o modelo ja acertou a paleta).
    """
    arr = np.array(img).astype(np.int32)
    rgb, alpha = arr[..., :3], arr[..., 3]

    visible = alpha > ALPHA_THRESHOLD
    if not visible.any():
        return img, 0.0

    pixels = rgb[visible]                                   # (N, 3)
    dists = np.sqrt(((pixels[:, None, :] - PALETTE[None, :, :]) ** 2).sum(axis=-1))
    nearest = dists.argmin(axis=1)
    drift = float(dists.min(axis=1).mean())

    rgb[visible] = PALETTE[nearest]
    alpha[alpha <= ALPHA_THRESHOLD] = 0                     # mata pixel-fantasma
    arr[..., :3], arr[..., 3] = rgb, alpha
    return Image.fromarray(arr.astype(np.uint8), "RGBA"), drift


def trim_alpha(img: Image.Image) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    return img.crop(bbox) if bbox else img


def fit(img: Image.Image, kind: str) -> Image.Image:
    """Redimensiona pela ALTURA alvo e reancora num canvas quadrado transparente."""
    target_h, anchor = KINDS[kind]
    w, h = img.size
    if h == 0:
        return img
    new_w = max(1, round(w * target_h / h))
    img = img.resize((new_w, target_h), Image.LANCZOS)

    # Fundo de lane: tira horizontal tileável. Sem canvas quadrado, sem reancoragem.
    if anchor == "strip":
        return img

    side = max(new_w, target_h)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    x = (side - new_w) // 2
    y = side - target_h if anchor == "bottom" else (side - target_h) // 2
    canvas.paste(img, (x, y), img)
    return canvas


def process(path: Path, out_dir: Path, kind: str, check_only: bool, use_rembg: bool) -> dict:
    img = Image.open(path).convert("RGBA")

    if use_rembg:
        try:
            from rembg import remove  # import tardio: dependência opcional
            img = remove(img)
        except ImportError:
            sys.exit("rembg não instalado. Rode: pip install rembg")

    img = strip_chroma(img)
    _, drift = quantize_to_palette(img)          # mede a fidelidade do que a IA entregou
    img = trim_alpha(img)
    img = fit(img, kind)
    img, _ = quantize_to_palette(img)            # reimpoe a paleta DEPOIS do resize

    if not check_only:
        out_dir.mkdir(parents=True, exist_ok=True)
        # Saída é sempre PNG (com alpha), mesmo se a entrada for .jpg.
        img.save(out_dir / f"{path.stem}.png", "PNG", optimize=True)

    return {"file": path.name, "drift": drift, "size": img.size}


def main() -> None:
    ap = argparse.ArgumentParser(description="Normaliza assets do Império Felino.")
    ap.add_argument("input", type=Path, help="arquivo .png ou pasta")
    ap.add_argument("--out", type=Path, default=Path("src/assets"))
    ap.add_argument("--kind", choices=sorted(KINDS), required=True)
    ap.add_argument("--check-only", action="store_true", help="não escreve, só relata o desvio")
    ap.add_argument("--rembg", action="store_true", help="remove fundo com rembg antes")
    args = ap.parse_args()

    files = sorted(args.input.glob("*.png")) if args.input.is_dir() else [args.input]
    if not files:
        sys.exit(f"nenhum .png encontrado em {args.input}")

    print(f"{'arquivo':<28} {'desvio de paleta':>18}  {'saída':>12}")
    print("-" * 62)
    for f in files:
        r = process(f, args.out, args.kind, args.check_only, args.rembg)
        flag = "  <-- revisar" if r["drift"] > 40 else ""
        print(f"{r['file']:<28} {r['drift']:>18.1f}  {str(r['size']):>12}{flag}")

    print(
        "\nDesvio = distância RGB média entre a cor gerada e a paleta travada."
        "\nAcima de ~40, o modelo fugiu do estilo: vale regerar em vez de forçar."
    )


if __name__ == "__main__":
    main()
