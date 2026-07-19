# -*- coding: utf-8 -*-
"""
Générateur du manuel technique (FR / EN).

Contenu structuré en blocs déclaratifs : titres, paragraphes, listes, tableaux
et blocs de code. Le même moteur produit les deux langues, seul le contenu change.
"""
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

HERE = os.path.dirname(os.path.abspath(__file__))

FOREST = colors.HexColor("#163300")
LIME = colors.HexColor("#9FE870")
INK = colors.HexColor("#0E0F0C")
GREY = colors.HexColor("#454745")
LINE = colors.HexColor("#D8DAD6")
SOFT = colors.HexColor("#ECEFEB")
CODEBG = colors.HexColor("#F5F7F3")

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

_ss = getSampleStyleSheet()


def _st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10, leading=14.5, textColor=INK, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, parent=_ss["Normal"], **base)


S_TITLE = _st("t", fontName="Helvetica-Bold", fontSize=30, leading=34, textColor=FOREST, spaceAfter=4)
S_SUB = _st("s", fontSize=13, leading=18, textColor=GREY, spaceAfter=18)
S_H1 = _st("h1", fontName="Helvetica-Bold", fontSize=17, leading=22, textColor=FOREST, spaceBefore=4, spaceAfter=8)
S_H2 = _st("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=17, textColor=INK, spaceBefore=12, spaceAfter=5)
S_BODY = _st("b", spaceAfter=7)
S_LI = _st("li", leftIndent=12, bulletIndent=3, spaceAfter=3)
S_CODE = _st("code", fontName="Courier", fontSize=8.5, leading=11.5, textColor=INK)
S_CELL = _st("cell", fontSize=9, leading=12.5)
S_CELLH = _st("cellh", fontSize=9, leading=12.5, fontName="Helvetica-Bold", textColor=FOREST)
S_NOTE = _st("n", fontSize=9, leading=13, textColor=GREY, spaceBefore=2, spaceAfter=6)


def header_footer(canvas, doc, label):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(MARGIN, PAGE_H - 12 * mm, label)
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 12 * mm, date.today().strftime("%d/%m/%Y"))
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, PAGE_H - 14 * mm, PAGE_W - MARGIN, PAGE_H - 14 * mm)
    canvas.drawCentredString(PAGE_W / 2, 12 * mm, str(doc.page))
    canvas.restoreState()


def table(rows, widths=None):
    """Tableau à en-tête, sobre : filets fins, en-tête sur fond très clair."""
    usable = PAGE_W - 2 * MARGIN
    ncol = len(rows[0])
    widths = widths or [usable / ncol] * ncol
    data = [[Paragraph(c, S_CELLH if i == 0 else S_CELL) for c in row] for i, row in enumerate(rows)]
    t = Table(data, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, LINE),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def code(text):
    """Bloc de code monospace sur fond clair."""
    lines = [Paragraph(l.replace(" ", "&nbsp;").replace("<", "&lt;").replace(">", "&gt;") or "&nbsp;", S_CODE)
             for l in text.strip("\n").split("\n")]
    t = Table([[l] for l in lines], colWidths=[PAGE_W - 2 * MARGIN], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODEBG),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return t


def render(block):
    """Traduit un bloc déclaratif en flowables reportlab."""
    kind = block[0]
    if kind == "h1":
        return [Paragraph(block[1], S_H1)]
    if kind == "h2":
        return [Paragraph(block[1], S_H2)]
    if kind == "p":
        return [Paragraph(block[1], S_BODY)]
    if kind == "note":
        return [Paragraph(block[1], S_NOTE)]
    if kind == "ul":
        return [Paragraph(f"&bull;&nbsp;&nbsp;{item}", S_LI) for item in block[1]] + [Spacer(1, 5)]
    if kind == "table":
        return [table(block[1], block[2] if len(block) > 2 else None), Spacer(1, 9)]
    if kind == "code":
        return [code(block[1]), Spacer(1, 9)]
    if kind == "pagebreak":
        return [PageBreak()]
    raise ValueError(f"bloc inconnu : {kind}")


def build(filename, running_head, title, subtitle, intro, blocks):
    out = os.path.join(HERE, filename)
    doc = BaseDocTemplate(
        out, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=20 * mm, bottomMargin=18 * mm,
        title=title, author="ATS Handling",
    )
    frame = Frame(MARGIN, 18 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 38 * mm, id="body")
    doc.addPageTemplates([
        PageTemplate(id="p", frames=[frame], onPage=lambda c, d: header_footer(c, d, running_head))
    ])

    story = [Paragraph(title, S_TITLE), Paragraph(subtitle, S_SUB)]
    for para in intro:
        story.append(Paragraph(para, S_BODY))
    for block in blocks:
        story.extend(render(block))

    try:
        doc.build(story)
    except PermissionError:
        print(f"  [!] {filename} verrouille (ferme-le puis relance)")
        return
    print(f"  [ok] {filename}")
