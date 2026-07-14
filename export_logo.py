#!/usr/bin/env python3
"""
export_logo.py — Império Felino

Monta o lockup da marca (mascote + wordmark) num canvas TRANSPARENTE e cospe um PNG único,
pronto pra loja/redes. Substitui o fluxo "print do logo.html + remover fundo", que quebrava
porque o recorte automático descartava o nome e o castelo.

O wordmark é desenhado por código (mesma linguagem do logo.html): "FAT"/"CAT" em branco e
"EMPIRE" em dourado, todos com contorno grosso de tinta (#241C2E) e uma sombra-degrau de tinta.

Uso:
    python export_logo.py                 # usa public/logo_king.png -> public/logo_lockup.png
    python export_logo.py --out foo.png

Dependência: pillow
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

INK = (36, 28, 46, 255)      # #241C2E — contorno travado (ART_STYLE §2)
WHITE = (255, 255, 255, 255)
GOLD = (255, 201, 60, 255)   # #FFC93C — dourado imperial

FONT_CANDIDATES = [r"C:\Windows\Fonts\ariblk.ttf", r"C:\Windows\Fonts\arialbd.ttf", "DejaVuSans-Bold.ttf"]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_shadowed(draw, xy, text, font, fill, stroke, shadow):
    """Texto com contorno de tinta + sombra-degrau de tinta (o 'chunky' do logo.html)."""
    x, y = xy
    draw.text((x, y + shadow), text, font=font, fill=INK, stroke_width=stroke, stroke_fill=INK, anchor="lt")
    draw.text((x, y), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=INK, anchor="lt")


def main() -> None:
    ap = argparse.ArgumentParser(description="Exporta o lockup da marca em PNG transparente.")
    ap.add_argument("--king", type=Path, default=Path("public/logo_king.png"))
    ap.add_argument("--out", type=Path, default=Path("public/logo_lockup.png"))
    ap.add_argument("--king-height", type=int, default=420, help="altura do mascote em px")
    args = ap.parse_args()

    king = Image.open(args.king).convert("RGBA")
    kh = args.king_height
    kw = round(king.width * kh / king.height)
    king = king.resize((kw, kh), Image.LANCZOS)

    big = load_font(150)
    emp = load_font(52)
    s_big = max(2, round(150 * 0.085))
    s_emp = max(2, round(52 * 0.085))
    sh_big = round(150 * 0.06)
    sh_emp = round(52 * 0.06)
    letter_spacing = 16

    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))

    def line_h(txt, font, sw):
        b = probe.textbbox((0, 0), txt, font=font, stroke_width=sw, anchor="lt")
        return b[3] - b[1]

    def line_w(txt, font, sw):
        b = probe.textbbox((0, 0), txt, font=font, stroke_width=sw, anchor="lt")
        return b[2] - b[0]

    def empire_w(txt, font, sw, ls):
        return sum(font.getlength(c) + ls for c in txt) - ls

    h_fat, h_cat, h_emp = line_h("FAT", big, s_big), line_h("CAT", big, s_big), line_h("EMPIRE", emp, s_emp)
    w_fat, w_cat = line_w("FAT", big, s_big), line_w("CAT", big, s_big)
    w_emp = empire_w("EMPIRE", emp, s_emp, letter_spacing)

    line_gap = 6
    emp_gap = 18
    wm_w = round(max(w_fat, w_cat, w_emp))
    wm_h = h_fat + line_gap + h_cat + emp_gap + h_emp + sh_big

    pad = 44
    gap = 26
    W = pad + kw + gap + wm_w + pad
    H = pad * 2 + max(kh, wm_h)

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(king, (pad, (H - kh) // 2))
    draw = ImageDraw.Draw(canvas)

    wx = pad + kw + gap
    wy = (H - wm_h) // 2
    draw_shadowed(draw, (wx, wy), "FAT", big, WHITE, s_big, sh_big)
    wy += h_fat + line_gap
    draw_shadowed(draw, (wx, wy), "CAT", big, WHITE, s_big, sh_big)
    wy += h_cat + emp_gap

    ex = wx
    for ch in "EMPIRE":
        draw_shadowed(draw, (ex, wy), ch, emp, GOLD, s_emp, sh_emp)
        ex += emp.getlength(ch) + letter_spacing

    # Recorta na silhueta (sem margem morta) + uma folguinha.
    bbox = canvas.getchannel("A").getbbox()
    m = 24
    canvas = canvas.crop((max(0, bbox[0] - m), max(0, bbox[1] - m),
                          min(W, bbox[2] + m), min(H, bbox[3] + m)))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.out, "PNG", optimize=True)
    print(f"lockup salvo em {args.out}  ({canvas.width}x{canvas.height})")


if __name__ == "__main__":
    main()
