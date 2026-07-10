"""Regenerate favicons from public/favicon-source.png (FH mark on transparent)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "favicon-source.png"
BACKGROUND = (15, 23, 42, 255)  # #0f172a — matches site theme-color


def content_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 16 and (r < 250 or g < 250 or b < 250):
                xs.append(x)
                ys.append(y)
    if not xs:
        return 0, 0, width - 1, height - 1
    return min(xs), min(ys), max(xs), max(ys)


def square_icon(source: Image.Image, size: int, padding_ratio: float = 0.12) -> Image.Image:
    left, top, right, bottom = content_bbox(source)
    cropped = source.crop((left, top, right + 1, bottom + 1))
    content_w, content_h = cropped.size
    side = max(content_w, content_h)
    pad = int(side * padding_ratio)
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    offset = ((side - content_w) // 2 + pad, (side - content_h) // 2 + pad)
    canvas.alpha_composite(cropped, offset)

    square = Image.new("RGBA", (size, size), BACKGROUND)
    square.alpha_composite(canvas.resize((size, size), Image.Resampling.LANCZOS))
    return square


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source asset: {SOURCE}")

    source = Image.open(SOURCE).convert("RGBA")
    outputs = {
        "favicon.png": 512,
        "apple-touch-icon.png": 180,
        "favicon-32.png": 32,
        "favicon-16.png": 16,
    }
    for name, size in outputs.items():
        square_icon(source, size).save(PUBLIC / name, format="PNG", optimize=True)
        print(f"Wrote {name} ({size}x{size})")


if __name__ == "__main__":
    main()
