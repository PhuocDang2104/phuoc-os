"""Regenerate browser-independent previews after replacing public/resume.pdf.

Development only: pip install pymupdf pillow; python scripts/render-resume.py
Commit the generated previews alongside the PDF; Vercel needs no Python.
"""

import hashlib
import json
from pathlib import Path

import pymupdf

frontend = Path(__file__).resolve().parents[1]
source = frontend / "public/resume.pdf"
output = frontend / "public/documents/resume"
output.mkdir(parents=True, exist_ok=True)
version = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
pages = []
with pymupdf.open(source) as document:
    for index, page in enumerate(document):
        name = f"page-{index + 1}-{version}.webp"
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5), alpha=False)
        # Pillow is installed with the local document tooling; no runtime dependency.
        pixmap.pil_save(output / name, format="WEBP", quality=92, method=6)
        pages.append({"src": f"/documents/resume/{name}", "width": pixmap.width,
                      "height": pixmap.height})
(frontend / "lib/resume-pages.json").write_text(
    json.dumps(pages, indent=2) + "\n", encoding="utf-8"
)
print(f"Rendered {len(pages)} pages from {source.name} ({version})")
