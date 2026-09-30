"""Generate the intentionally temporary PDF. Replace frontend/public/resume.pdf later.

Only needs reportlab when regenerating; it is not a runtime dependency.
"""
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

target = Path(__file__).resolve().parents[1] / "frontend" / "public" / "resume.pdf"
pdf = canvas.Canvas(str(target), pagesize=A4)
pdf.setTitle("Dang Nhu Phuoc - Temporary Resume")
width, height = A4
pdf.setFillColor(HexColor("#151519"))
pdf.rect(0, height - 195, width, 195, fill=1, stroke=0)
pdf.setFillColor(HexColor("#b8a7ff"))
pdf.setFont("Helvetica", 9)
pdf.drawString(48, height - 48, "PHUOC.OS / PERSONAL ENGINEERING WORKSTATION")
pdf.setFillColor(HexColor("#f2f2f4"))
pdf.setFont("Helvetica-Bold", 31)
pdf.drawString(46, height - 104, "Dang Nhu Phuoc")
pdf.setFont("Helvetica", 13)
pdf.drawString(48, height - 137, "AI & Embedded Engineer")
pdf.setFillColor(HexColor("#3e354d"))
pdf.setFont("Helvetica-Bold", 10)
pdf.drawString(48, height - 235, "TEMPORARY DOCUMENT - FULL RESUME TO BE REPLACED")
pdf.setFillColor(HexColor("#35353d"))
pdf.setFont("Helvetica", 11)
for y, line in enumerate([
    "Building intelligence from models to machines.",
    "Edge AI / Computer Vision / Embedded Systems / Research",
    "",
    "I build intelligent systems across hardware, firmware,",
    "machine learning, and real-world deployment.",
    "",
    "Ho Chi Minh City, Vietnam",
    "phuoc.dang2104@gmail.com",
    "github.com/PhuocDang2104",
    "linkedin.com/in/dangnhuphuoc/",
]):
    pdf.drawString(48, height - 280 - y * 24, line)
pdf.setStrokeColor(HexColor("#ddd9e5"))
pdf.line(48, 114, width - 48, 114)
pdf.setFont("Helvetica", 9)
pdf.setFillColor(HexColor("#77717f"))
pdf.drawString(48, 90, "This preview is provided while the full CV is being prepared.")
pdf.drawString(48, 73, "It does not list education, employment, or achievements.")
pdf.save()
print(target)
