"""Generate responsive AVIF assets for the site's large raster images."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
SOURCES = (
    "project-kitchen-v2.png",
    "hero-option-alcove.png",
    "service-bathroom-v2.png",
    "service-retail-v2.png",
    "hero-architecture-v2.png",
    "project-restaurant-v2.png",
    "project-retail-v2.png",
    "craft-precision-v2.png",
    "unsplash-shavings.jpg",
    "unsplash-tools.jpg",
)
WIDTHS = (768, 1280)


def save_avif(image: Image.Image, destination: Path) -> None:
    image.save(destination, format="AVIF", quality=68, speed=6)


for filename in SOURCES:
    source = IMAGES / filename
    with Image.open(source) as opened:
        image = opened.convert("RGB")
        stem = source.stem
        save_avif(image, IMAGES / f"{stem}.avif")
        for width in WIDTHS:
            if width >= image.width:
                continue
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            save_avif(resized, IMAGES / f"{stem}-{width}.avif")
