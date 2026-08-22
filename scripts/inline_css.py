"""Inline the small shared stylesheet to remove a render-blocking request."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "css" / "style.css").read_text()
LINK = '  <link rel="stylesheet" href="css/style.css">'
STYLE = f"  <style>\n{CSS}\n  </style>"

for path in ROOT.glob("*.html"):
    if path.name == "hero-options.html":
        continue
    html = path.read_text()
    if LINK in html:
        path.write_text(html.replace(LINK, STYLE, 1))
