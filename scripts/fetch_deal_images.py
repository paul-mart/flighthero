"""Download verified destination images into public/deals/."""
from __future__ import annotations

import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "deals"
MAX_WIDTH = 800
JPEG_QUALITY = 80

# Stable remote sources verified with HTTP 200.
DEAL_IMAGE_URLS: dict[str, str] = {
    "LHR": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80",
    "CDG": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80",
    "DUB": "https://images.pexels.com/photos/1795896/pexels-photo-1795896.jpeg?auto=compress&cs=tinysrgb&w=900",
    "FCO": "https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?auto=compress&cs=tinysrgb&w=900",
    "HND": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80",
    "ICN": "https://images.pexels.com/photos/2286894/pexels-photo-2286894.jpeg?auto=compress&cs=tinysrgb&w=900",
    "SYD": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=80",
    "SIN": "https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=900",
    "SJU": "https://images.pexels.com/photos/1451278/pexels-photo-1451278.jpeg?auto=compress&cs=tinysrgb&w=900",
    "CUN": "https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=900",
    "LIS": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
    "MEX": "https://images.pexels.com/photos/2412609/pexels-photo-2412609.jpeg?auto=compress&cs=tinysrgb&w=900",
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.read()


def save_optimized(data: bytes, out: Path) -> int:
    img = Image.open(BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    width, height = img.size
    if width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, int(height * MAX_WIDTH / width)), Image.Resampling.LANCZOS)
    img.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return out.stat().st_size


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for code, url in DEAL_IMAGE_URLS.items():
        data = fetch(url)
        out = OUT_DIR / f"{code.lower()}.jpg"
        size = save_optimized(data, out)
        print(f"{code}: saved {size} bytes (from {len(data)} downloaded)")


if __name__ == "__main__":
    main()
