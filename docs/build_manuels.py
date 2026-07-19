# -*- coding: utf-8 -*-
"""
Génère un manuel d'utilisation PDF par portail web, à partir de vraies captures
d'écran annotées (et non de maquettes dessinées).

Chaîne complète :
    node docs/capture.mjs --login    → captures + coordonnées des éléments
    python docs/build_manuels.py     → annotation + PDF

Produit : Manuel-<Portail>.pdf dans docs/.
"""
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, PageBreak, PageTemplate, Paragraph, Spacer,
)

from annotate import annotate

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")

# Palette Wise du produit, pour que le manuel ressemble à l'application.
FOREST = colors.HexColor("#163300")
LIME = colors.HexColor("#9FE870")
INK = colors.HexColor("#0E0F0C")
GREY = colors.HexColor("#454745")
LINE = colors.HexColor("#D8DAD6")

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

# ─────────────────────────────────────────────────────────────
# Styles
# ─────────────────────────────────────────────────────────────
_ss = getSampleStyleSheet()


def _st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, leading=15, textColor=INK, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, parent=_ss["Normal"], **base)


S_TITLE = _st("t", fontName="Helvetica-Bold", fontSize=30, leading=34, textColor=FOREST, spaceAfter=6)
S_SUB = _st("s", fontSize=13, leading=18, textColor=GREY, spaceAfter=22)
S_H1 = _st("h1", fontName="Helvetica-Bold", fontSize=18, leading=23, textColor=FOREST, spaceBefore=16, spaceAfter=8)
S_H2 = _st("h2", fontName="Helvetica-Bold", fontSize=13, leading=18, textColor=INK, spaceBefore=12, spaceAfter=5)
S_BODY = _st("b", spaceAfter=7)
S_NOTE = _st("n", fontSize=9.5, leading=14, textColor=GREY, spaceAfter=6)
S_CAP = _st("c", fontSize=9, leading=13, textColor=GREY, spaceBefore=4, spaceAfter=12)
S_LEG = _st("l", fontSize=10.5, leading=15)


# Libellés du gabarit, par langue. Les captures et leurs pastilles sont
# communes aux deux versions : seul le texte change.
STRINGS_FR = {
    "title": "Manuel d'utilisation",
    "scope": "Portail {portal}",
    "legend": "Ce que montre chaque repère",
    "caption": "Capture réelle de l'application.",
    "running": "Police Bagage · Manuel {portal}",
}
STRINGS_EN = {
    "title": "User manual",
    "scope": "{portal} portal",
    "legend": "What each marker shows",
    "caption": "Actual screen from the application.",
    "running": "Police Bagage · {portal} manual",
}


def header_footer(canvas, doc, portal):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(MARGIN, PAGE_H - 12 * mm, portal)
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 12 * mm, date.today().strftime("%d/%m/%Y"))
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, PAGE_H - 14 * mm, PAGE_W - MARGIN, PAGE_H - 14 * mm)
    canvas.drawCentredString(PAGE_W / 2, 12 * mm, str(doc.page))
    canvas.restoreState()


def fit_image(path, max_w, max_h=170 * mm):
    """Insère une image en respectant son ratio et la largeur utile de la page."""
    iw, ih = ImageReader(path).getSize()
    w = max_w
    h = w * ih / iw
    if h > max_h:
        h = max_h
        w = h * iw / ih
    return Image(path, width=w, height=h)


def legend_block(items, explications=None, libelles=None):
    """
    Légende numérotée : chaque pastille posée sur la capture est reprise ici,
    avec son libellé en gras puis l'explication détaillée correspondante.

    `libelles` permet de remplacer le libellé mesuré à la capture, ce qui sert
    aux versions traduites : les captures et leurs pastilles sont communes,
    seul le texte de la légende change.
    """
    explications = explications or {}
    libelles = libelles or {}
    out = []
    for num, key, label in items:
        label = libelles.get(key, label)
        detail = explications.get(key, "")
        # Libellé en gras suivi d'un point, puis l'explication : pas de tiret
        # de séparation, qui alourdit la lecture et fait « texte automatique ».
        txt = f"<b>{num}. {label}.</b>"
        if detail:
            txt += f" {detail}"
        out.append(Paragraph(txt, S_LEG))
    return out


def build(portal, filename, subtitle, intro, sections, strings=None):
    """
    portal    : nom affiché (ex. "Vols")
    sections  : liste de dicts {titre, texte, image, ordre, legende_intro, note}
    """
    out = os.path.join(HERE, filename)
    doc = BaseDocTemplate(
        out, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=20 * mm, bottomMargin=18 * mm,
        title=f"Manuel {portal} - Police Bagage", author="ATS Handling",
    )
    st = dict(STRINGS_FR)
    if strings:
        st.update(strings)
    running = st["running"].format(portal=portal)

    frame = Frame(MARGIN, 18 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 38 * mm, id="body")
    doc.addPageTemplates([
        PageTemplate(id="p", frames=[frame],
                     onPage=lambda c, d: header_footer(c, d, running))
    ])

    usable = PAGE_W - 2 * MARGIN
    story = [
        Paragraph(st["title"], S_TITLE),
        Paragraph(st["scope"].format(portal=portal), S_SUB),
        Paragraph(subtitle, S_BODY),
        Spacer(1, 6),
    ]
    for para in intro:
        story.append(Paragraph(para, S_BODY))

    for sec in sections:
        story.append(PageBreak())
        story.append(Paragraph(sec["titre"], S_H1))
        for para in sec.get("texte", []):
            story.append(Paragraph(para, S_BODY))

        name = sec.get("image")
        legend = []
        if name:
            legend = annotate(name, sec.get("ordre", []))
            path = os.path.join(IMG, f"{name}_annote.png")
            if os.path.exists(path):
                story.append(Spacer(1, 4))
                story.append(fit_image(path, usable))
                story.append(Paragraph(sec.get("legende_image", st["caption"]), S_CAP))

        if legend:
            story.append(Paragraph(st["legend"], S_H2))
            story.extend(legend_block(legend, sec.get("explications"), sec.get("libelles")))

        for para in sec.get("apres", []):
            story.append(Paragraph(para, S_BODY))
        if sec.get("note"):
            story.append(Spacer(1, 4))
            story.append(Paragraph(sec["note"], S_NOTE))

    try:
        doc.build(story)
    except PermissionError:
        # Fichier ouvert dans un lecteur PDF : on n'interrompt pas les autres manuels.
        print(f"  [!] {filename} verrouille (ferme-le puis relance) - manuel non regenere")
        return
    print(f"  [ok] {filename}")
