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
    "CDG": "https://images.unsplash.com/photo-1524396309943-e03f5249f002?auto=format&fit=crop&w=900&q=80",
    "DUB": "https://images.unsplash.com/photo-1605969353711-234dea348ce1?auto=format&fit=crop&w=900&q=80",
    "FCO": "https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?auto=compress&cs=tinysrgb&w=900",
    "HND": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80",
    "ICN": "https://images.unsplash.com/photo-1597552571860-136a103d5eb3?auto=format&fit=crop&w=900&q=80",
    "SYD": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=80",
    "SIN": "https://plus.unsplash.com/premium_photo-1697730373939-3ebcaa9d295e?auto=format&fit=crop&w=900&q=80",
    "SJU": "https://images.unsplash.com/photo-1589402249680-5ff95f2ac3bd?auto=format&fit=crop&w=900&q=80",
    "CUN": "https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=900",
    "LIS": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
    "MEX": "https://images.unsplash.com/photo-1645921441624-3d8f9098a2a5?auto=format&fit=crop&w=900&q=80",
    # US hub cities (Continue Searching + routes to US destinations)
    "JFK": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=80",
    "BOS": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80",
    "LAX": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
    "SFO": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80",
    "SEA": "https://images.unsplash.com/photo-1557801586-ccc9277d3c75?auto=format&fit=crop&w=900&q=80",
    "MIA": "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?auto=format&fit=crop&w=900&q=80",
    "ORD": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80",
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
