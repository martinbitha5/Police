# -*- coding: utf-8 -*-
"""Génère des illustrations annotées (maquettes d'écrans) pour le manuel."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "img"
os.makedirs(OUT, exist_ok=True)
S = 2  # facteur d'echelle (rendu net)

FONT = r"C:\Windows\Fonts\arial.ttf"
FONTB = r"C:\Windows\Fonts\arialbd.ttf"
def f(sz): return ImageFont.truetype(FONT, sz * S)
def fb(sz): return ImageFont.truetype(FONTB, sz * S)

# Palette
BG1 = (16, 30, 56); BG2 = (24, 44, 78)
CARD = (27, 42, 70); CARD2 = (33, 50, 82)
BORD = (60, 78, 110)
WHITE = (241, 245, 249); MUT = (170, 186, 208)
BLUE = (37, 99, 235); SKY = (14, 165, 233); GREEN = (34, 197, 94)
WARN = (245, 158, 11); DANGER = (239, 68, 68); ACCENT = (14, 165, 233)
RED = (225, 29, 72)  # annotations

def vgrad(w, h, c1, c2):
    img = Image.new("RGB", (w, h), c1)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        c = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c)
    return img

def rr(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def txt(d, xy, s, font, fill=WHITE, anchor="la"):
    d.text((xy[0] * 1, xy[1] * 1), s, font=font, fill=fill, anchor=anchor)

def pill(d, x, y, label, font, fg, bg, padx=10, padyy=5):
    w = d.textlength(label, font=font)
    box = [x, y, x + w + 2 * padx * S, y + (font.size) + 2 * padyy * S]
    rr(d, box, r=999, fill=bg)
    d.text((x + padx * S, y + padyy * S), label, font=font, fill=fg)
    return box

# annotations
def badge(d, n, cx, cy, rad=15):
    rad *= S
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=RED, outline=(255, 255, 255), width=2 * S)
    d.text((cx, cy), str(n), font=fb(13), fill=(255, 255, 255), anchor="mm")

def circle(d, box, color=RED, width=3):
    d.rounded_rectangle(box, radius=14 * S, outline=color, width=width * S)

def arrow(d, p1, p2, color=RED, width=3):
    d.line([p1, p2], fill=color, width=width * S)
    import math
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    L = 10 * S
    for da in (0.5, -0.5):
        x = p2[0] - L * math.cos(ang - da)
        y = p2[1] - L * math.sin(ang - da)
        d.line([p2, (x, y)], fill=color, width=width * S)

def phone(content_fn, name, w=460, h=900):
    W, H = w * S, h * S
    img = Image.new("RGB", (W, H), (236, 240, 246))
    d = ImageDraw.Draw(img)
    # cadre telephone
    fr = 10 * S
    rr(d, [fr, fr, W - fr, H - fr], r=44 * S, fill=(8, 12, 22))
    sx0, sy0, sx1, sy1 = fr + 8 * S, fr + 14 * S, W - fr - 8 * S, H - fr - 14 * S
    screen = vgrad(sx1 - sx0, sy1 - sy0, BG1, BG2)
    img.paste(screen, (sx0, sy0))
    sd = ImageDraw.Draw(img)
    # encoche
    rr(d, [W // 2 - 40 * S, fr + 16 * S, W // 2 + 40 * S, fr + 26 * S], r=8 * S, fill=(8, 12, 22))
    content_fn(sd, sx0, sy0, sx1 - sx0, sy1 - sy0)
    img.save(os.path.join(OUT, name))
    img2 = img.resize((w, h))
    img2.save(os.path.join(OUT, name))

def window(content_fn, name, w=1100, h=720):
    W, H = w * S, h * S
    img = Image.new("RGB", (W, H), (236, 240, 246))
    d = ImageDraw.Draw(img)
    rr(d, [0, 0, W, H], r=16 * S, fill=(8, 12, 22))
    # barre
    bar = 34 * S
    rr(d, [0, 0, W, bar + 16 * S], r=16 * S, fill=(20, 26, 38))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([18 * S + i * 22 * S, 12 * S, 30 * S + i * 22 * S, 24 * S], fill=c)
    sx0, sy0 = 6 * S, bar + 6 * S
    sx1, sy1 = W - 6 * S, H - 6 * S
    screen = vgrad(sx1 - sx0, sy1 - sy0, BG1, BG2)
    img.paste(screen, (sx0, sy0))
    sd = ImageDraw.Draw(img)
    content_fn(sd, sx0, sy0, sx1 - sx0, sy1 - sy0)
    img.save(os.path.join(OUT, name))
    Image.open(os.path.join(OUT, name)).resize((w, h)).save(os.path.join(OUT, name))


# ============ MOBILE : DÉTAIL DU VOL (5 fonctions) ============
def mob_flight(d, ox, oy, w, h):
    pad = 22 * S
    x = ox + pad
    # carte vol
    cw = w - 2 * pad
    rr(d, [x, oy + 40 * S, x + cw, oy + 190 * S], r=22 * S, fill=CARD, outline=BORD, width=S)
    txt(d, (x + 22 * S, oy + 58 * S), "ET 0062", fb(24))
    pill(d, x + cw - 150 * S, oy + 60 * S, "Programmé", fb(12), MUT, CARD2)
    txt(d, (x + 22 * S, oy + 110 * S), "FIH", fb(22))
    txt(d, (x + cw - 70 * S, oy + 110 * S), "FBM", fb(22))
    d.line([(x + 90 * S, oy + 120 * S), (x + cw - 90 * S, oy + 120 * S)], fill=BORD, width=2 * S)
    txt(d, (x + 22 * S, oy + 150 * S), "Passagers 27   Bagages 33/35   Embarqués 27", f(12), MUT)

    txt(d, (x, oy + 210 * S), "Que voulez-vous faire ?", fb(15))

    opts = [
        ("Check-in", "Scanner les boarding pass", BLUE),
        ("Bagages", "Scanner les étiquettes bagage", WARN),
        ("Embarquement", "Confirmer les passagers à la porte", GREEN),
        ("Charger", "Charger les bagages en soute", ACCENT),
        ("Rush", "Bagages restants à réacheminer", WARN),
    ]
    y = oy + 245 * S
    rowh = 78 * S
    centers = []
    for i, (t, s, c) in enumerate(opts):
        rr(d, [x, y, x + cw, y + rowh - 12 * S], r=16 * S, fill=CARD, outline=BORD, width=S)
        rr(d, [x + 14 * S, y + 12 * S, x + 56 * S, y + 54 * S], r=12 * S, fill=c)
        txt(d, (x + 72 * S, y + 16 * S), t, fb(16))
        txt(d, (x + 72 * S, y + 40 * S), s, f(11), MUT)
        centers.append((x + cw, y + (rowh - 12 * S) // 2))
        y += rowh
    # annotations 1..5
    for i, cy in enumerate(centers):
        badge(d, i + 1, ox + w - 16 * S, cy[1])

phone(mob_flight, "mobile_flight.png")

# ============ MOBILE : BAGAGES (scan + résultat) ============
def mob_bag(d, ox, oy, w, h):
    pad = 22 * S; x = ox + pad; cw = w - 2 * pad
    rr(d, [x, oy + 40 * S, x + cw, oy + 110 * S], r=18 * S, fill=CARD, outline=BORD, width=S)
    txt(d, (x + 20 * S, oy + 56 * S), "ET 0062", fb(20))
    txt(d, (x + 20 * S, oy + 84 * S), "FIH  →  FBM", f(12), MUT)
    pill(d, x + cw - 120 * S, oy + 62 * S, "33/35", fb(14), BLUE, CARD2)
    # zone scan
    rr(d, [x, oy + 130 * S, x + cw, oy + 360 * S], r=22 * S, fill=CARD, outline=BORD, width=S)
    d.ellipse([x + cw//2 - 55*S, oy + 165*S, x + cw//2 + 55*S, oy + 275*S], outline=GREEN, width=4*S)
    d.line([(x+cw//2-22*S, oy+222*S),(x+cw//2-4*S, oy+242*S)], fill=GREEN, width=5*S)
    d.line([(x+cw//2-4*S, oy+242*S),(x+cw//2+26*S, oy+200*S)], fill=GREEN, width=5*S)
    txt(d, (ox + w//2, oy + 300*S), "Bagage confirmé", fb(17), WHITE, anchor="ma")
    txt(d, (ox + w//2, oy + 326*S), "Prêt pour le prochain scan", f(11), MUT, anchor="ma")
    # resultat
    rr(d, [x, oy + 380 * S, x + cw, oy + 470 * S], r=16 * S, fill=CARD)
    d.rectangle([x, oy + 380*S, x + 6*S, oy + 470*S], fill=GREEN)
    txt(d, (x + 24 * S, oy + 398 * S), "KALONJI KABWE Oscar", fb(16))
    txt(d, (x + 24 * S, oy + 428 * S), "2/2 bagages confirmés", fb(15), GREEN)
    badge(d, 1, x + cw//2, oy + 220*S)
    badge(d, 2, ox + w - 16*S, oy + 425*S)

phone(mob_bag, "mobile_baggage.png")

# ============ MOBILE : CHARGER ============
def mob_charger(d, ox, oy, w, h):
    pad = 22 * S; x = ox + pad; cw = w - 2 * pad
    rr(d, [x, oy + 40 * S, x + cw, oy + 110 * S], r=18 * S, fill=CARD, outline=BORD, width=S)
    txt(d, (x + 20 * S, oy + 56 * S), "ET 0062", fb(20))
    txt(d, (x + 20 * S, oy + 84 * S), "FIH  →  FBM", f(12), MUT)
    pill(d, x + cw - 110 * S, oy + 64 * S, "SOUTE", fb(12), ACCENT, CARD2)
    rr(d, [x, oy + 128 * S, x + cw, oy + 196 * S], r=14 * S, fill=CARD2, outline=BORD, width=S)
    txt(d, (x + 16 * S, oy + 142 * S), "Scannez d'abord les bagages Rush,", f(11), MUT)
    txt(d, (x + 16 * S, oy + 162 * S), "puis chargez le reste d'un seul geste.", f(11), MUT)
    rr(d, [x, oy + 214 * S, x + cw, oy + 420 * S], r=22 * S, fill=CARD, outline=BORD, width=S)
    d.ellipse([x + cw//2 - 42*S, oy + 240*S, x + cw//2 + 42*S, oy + 324*S], fill=CARD2)
    txt(d, (ox+w//2, oy + 268*S), "[ ]", fb(26), ACCENT, anchor="ma")
    txt(d, (ox+w//2, oy + 340*S), "Charger en soute", fb(17), WHITE, anchor="ma")
    bx = [x + 40*S, oy + 370*S, x + cw - 40*S, oy + 405*S]
    rr(d, bx, r=12*S, fill=BLUE)
    txt(d, (ox+w//2, oy + 380*S), "Charger les bagages", fb(14), WHITE, anchor="ma")
    rr(d, [x, oy + 440*S, x + cw, oy + 540*S], r=16*S, fill=CARD)
    d.rectangle([x, oy+440*S, x+6*S, oy+540*S], fill=GREEN)
    txt(d, (ox+w//2, oy + 456*S), "12", fb(30), GREEN, anchor="ma")
    txt(d, (ox+w//2, oy + 500*S), "bagages chargés en soute", f(12), WHITE, anchor="ma")
    badge(d, 1, x + cw - 60*S, oy + 388*S)
    badge(d, 2, ox + w - 16*S, oy + 490*S)

phone(mob_charger, "mobile_charger.png")

# ============ WEB : TABLEAU DE BORD ============
def web_dash(d, ox, oy, w, h):
    sb = 200 * S
    rr(d, [ox, oy, ox + sb, oy + h], r=0, fill=(18, 26, 40))
    txt(d, (ox + 20 * S, oy + 24 * S), "Police Bagage", fb(15))
    txt(d, (ox + 20 * S, oy + 46 * S), "Hub FIH", f(10), MUT)
    items = [("Tableau de bord", True), ("Rapports", False), ("Comptes", False)]
    yy = oy + 90 * S
    for t, act in items:
        if act:
            rr(d, [ox + 12 * S, yy - 6 * S, ox + sb - 12 * S, yy + 26 * S], r=10 * S, fill=(37, 99, 235, 255))
        txt(d, (ox + 26 * S, yy), t, fb(12) if act else f(12), WHITE if act else MUT)
        yy += 44 * S
    cx = ox + sb + 28 * S
    txt(d, (cx, oy + 22 * S), "Tableau de bord", fb(20))
    txt(d, (cx, oy + 50 * S), "Vendredi 5 juin 2026", f(11), MUT)
    # stats
    labels = [("Vols du jour", "3", BLUE), ("Départs", "2", SKY), ("Arrivées", "1", GREEN), ("Alertes fraude", "4", DANGER)]
    sw = (w - sb - 56 * S - 3 * 14 * S) // 4
    sx = cx
    for t, v, c in labels:
        rr(d, [sx, oy + 78 * S, sx + sw, oy + 150 * S], r=14 * S, fill=CARD, outline=BORD, width=S)
        rr(d, [sx + 14 * S, oy + 92 * S, sx + 46 * S, oy + 124 * S], r=8 * S, fill=c)
        txt(d, (sx + 56 * S, oy + 92 * S), t, f(10), MUT)
        txt(d, (sx + 56 * S, oy + 108 * S), v, fb(20))
        sx += sw + 14 * S
    txt(d, (cx, oy + 172 * S), "DÉPARTS", fb(12), MUT)
    # flight cards
    fy = oy + 196 * S
    fw = (w - sb - 56 * S - 14 * S) // 2
    for i in range(2):
        fx = cx + i * (fw + 14 * S)
        rr(d, [fx, fy, fx + fw, fy + 96 * S], r=14 * S, fill=CARD, outline=BORD, width=S)
        txt(d, (fx + 16 * S, fy + 14 * S), ["ET 0062", "KQ 555"][i], fb(16))
        pill(d, fx + fw - 110 * S, fy + 16 * S, ["Programmé", "Embarquement"][i], f(10), [MUT, GREEN][i], CARD2)
        txt(d, (fx + 16 * S, fy + 44 * S), ["FIH → FBM", "FIH → NBO"][i], f(12), MUT)
        txt(d, (fx + 16 * S, fy + 68 * S), "Départ 08:30", f(10), MUT)
    badge(d, 1, ox + 100 * S, oy + 112 * S)
    arrow(d, (ox + 116 * S, oy + 112 * S), (ox + sb - 6 * S, oy + 112 * S))
    badge(d, 2, cx + 3 * (sw + 14 * S) + sw // 2, oy + 64 * S)
    badge(d, 3, cx + fw // 2, fy + 110 * S)

window(web_dash, "web_dashboard.png")

# ============ WEB : RAPPORTS ============
def web_report(d, ox, oy, w, h):
    cx = ox + 30 * S
    txt(d, (cx, oy + 22 * S), "Rapports", fb(20))
    txt(d, (cx, oy + 50 * S), "Vendredi 5 juin 2026", f(11), MUT)
    pill(d, ox + w - 220 * S, oy + 26 * S, "Télécharger Excel", fb(13), WHITE, BLUE, padx=14)
    tabs = ["Jour", "Semaine", "Mois", "Année", "Personnalisé"]
    tx = cx
    for i, t in enumerate(tabs):
        bg = BLUE if i == 0 else CARD
        b = pill(d, tx, oy + 78 * S, t, fb(12), WHITE if i == 0 else MUT, bg, padx=16)
        tx = b[2] + 10 * S
    txt(d, (cx, oy + 120 * S), "BILAN DE LA PÉRIODE", fb(11), MUT)
    stats = [("Vols traités", "3"), ("Passagers", "29"), ("Embarqués", "29 (100%)"),
             ("Bagages confirmés", "33 / 35"), ("Chargés en soute", "31"), ("Alertes fraude", "4")]
    sw = (w - 60 * S - 2 * 14 * S) // 3
    for i, (t, v) in enumerate(stats):
        r, c = divmod(i, 3)
        sx = cx + c * (sw + 14 * S); sy = oy + 144 * S + r * 80 * S
        rr(d, [sx, sy, sx + sw, sy + 66 * S], r=14 * S, fill=CARD, outline=BORD, width=S)
        txt(d, (sx + 16 * S, sy + 14 * S), t, f(10), MUT)
        txt(d, (sx + 16 * S, sy + 32 * S), v, fb(18))
    badge(d, 1, cx + 60 * S, oy + 90 * S)
    badge(d, 2, ox + w - 110 * S, oy + 38 * S)

window(web_report, "web_report.png", h=440)

# ============ TRACKING (passager) ============
def track(d, ox, oy, w, h):
    cx = ox + 30 * S
    txt(d, (cx, oy + 24 * S), "SUIVI BAGAGES", fb(22))
    rr(d, [cx, oy + 70 * S, ox + w - 30 * S, oy + 250 * S], r=16 * S, fill=CARD, outline=BORD, width=S)
    fields = ["PNR / Référence de réservation", "Numéro de vol", "Numéro d'étiquette (10 chiffres)"]
    fy = oy + 90 * S
    for t in fields:
        txt(d, (cx + 20 * S, fy), t, f(11), MUT)
        rr(d, [cx + 20 * S, fy + 18 * S, ox + w - 50 * S, fy + 46 * S], r=8 * S, fill=CARD2, outline=BORD, width=S)
        fy += 50 * S
    pill(d, cx + 20 * S, fy + 4 * S, "Suivre le bagage", fb(13), WHITE, BLUE, padx=16)
    # resultat
    ry = oy + 270 * S
    rr(d, [cx, ry, ox + w - 30 * S, ry + 120 * S], r=14 * S, fill=CARD, outline=BORD, width=S)
    txt(d, (cx + 20 * S, ry + 16 * S), "KALONJI KABWE Oscar", fb(15))
    txt(d, (cx + 20 * S, ry + 40 * S), "ET 0062 · FIH → FBM · PNR EYFMKNE", f(11), MUT)
    pill(d, cx + 20 * S, ry + 70 * S, "0071161863  Chargé en soute", fb(11), GREEN, (20, 50, 40))
    badge(d, 1, cx + 250 * S, oy + 112 * S)
    badge(d, 2, cx + 250 * S, oy + 162 * S)
    badge(d, 3, ox + w - 70 * S, ry + 86 * S)

window(track, "tracking.png", h=440)

# ============ VOLS DU JOUR (public) ============
def vols(d, ox, oy, w, h):
    cx = ox + 30 * S
    txt(d, (cx, oy + 22 * S), "Vols du jour", fb(22))
    txt(d, (cx, oy + 54 * S), "Vendredi 5 juin 2026 · Aéroport FIH", f(11), MUT)
    rr(d, [ox + w - 300 * S, oy + 22 * S, ox + w - 30 * S, oy + 52 * S], r=10 * S, fill=CARD, outline=BORD, width=S)
    txt(d, (ox + w - 288 * S, oy + 30 * S), "Rechercher un vol (ex. ET0062)", f(11), MUT)
    cards = [("KQ 555", "FIH → NBO", "10:00", "Embarquement", GREEN, True),
             ("ET 0062", "FIH → FBM", "15:00", "Fermé", DANGER, False)]
    y = oy + 78 * S
    for num, route, tm, st, c, retard in cards:
        rr(d, [cx, y, ox + w - 30 * S, y + 92 * S], r=14 * S, fill=CARD, outline=BORD, width=S)
        pill(d, cx + 16 * S, y + 14 * S, "DÉPART", fb(10), (147, 197, 253), (20, 40, 70))
        txt(d, (cx + 16 * S, y + 42 * S), num, fb(20))
        txt(d, (cx + 16 * S, y + 70 * S), route, f(12), MUT)
        txt(d, (ox + w - 240 * S, y + 28 * S), "DÉPART", f(9), MUT)
        txt(d, (ox + w - 240 * S, y + 42 * S), tm, fb(20))
        pill(d, ox + w - 160 * S, y + 30 * S, st, fb(12), c, (28, 40, 60))
        if retard:
            pill(d, ox + w - 160 * S, y + 60 * S, "Retardé", f(10), (252, 165, 165), (60, 24, 28))
        y += 104 * S
    txt(d, (cx, y + 4 * S), "Services de l'aéroport", fb(14))
    rr(d, [cx, y + 28 * S, ox + w - 30 * S, y + 72 * S], r=12 * S, fill=(30, 48, 86), outline=(37, 99, 235), width=S)
    rr(d, [cx + 12 * S, y + 36 * S, cx + 44 * S, y + 64 * S], r=8 * S, fill=(255, 255, 255))
    txt(d, (cx + 56 * S, y + 38 * S), "Site officiel de l'Aéroport de Kinshasa (FIH)", fb(12))
    txt(d, (cx + 56 * S, y + 56 * S), "fih-rva.com · Régie des Voies Aériennes", f(10), MUT)
    badge(d, 1, ox + w - 50 * S, oy + 37 * S)
    badge(d, 2, ox + w - 26 * S, oy + 118 * S)
    badge(d, 3, ox + w - 50 * S, y + 50 * S)

window(vols, "vols.png", h=560)

# ============ LITIGES (superviseur) ============
def litige(d, ox, oy, w, h):
    sb = 200 * S
    rr(d, [ox, oy, ox + sb, oy + h], r=0, fill=(18, 26, 40))
    rr(d, [ox + 18 * S, oy + 20 * S, ox + 52 * S, oy + 54 * S], r=10 * S, fill=BLUE)
    txt(d, (ox + 64 * S, oy + 22 * S), "Litige Bagage", fb(13))
    txt(d, (ox + 64 * S, oy + 40 * S), "Hub FIH", f(9), MUT)
    rr(d, [ox + 12 * S, oy + 80 * S, ox + sb - 12 * S, oy + 112 * S], r=10 * S, fill=(37, 99, 235))
    txt(d, (ox + 26 * S, oy + 88 * S), "Litiges bagage", fb(12))
    cx = ox + sb + 26 * S
    txt(d, (cx, oy + 22 * S), "Litiges bagage", fb(20))
    txt(d, (cx, oy + 50 * S), "Aujourd'hui · 35 bagages · 2 litiges en cours", f(11), MUT)
    pill(d, ox + w - 180 * S, oy + 22 * S, "Rapport du jour", fb(12), WHITE, BLUE, padx=14)
    fy = oy + 80 * S
    fx = cx
    for label, wd in [("Recherche…", 140), ("Tous les vols", 105), ("Aujourd'hui", 105), ("Litige : tous", 105)]:
        rr(d, [fx, fy, fx + wd * S, fy + 30 * S], r=8 * S, fill=CARD, outline=BORD, width=S)
        txt(d, (fx + 10 * S, fy + 8 * S), label, f(10), MUT)
        fx += (wd + 10) * S
    ly = oy + 126 * S
    headers = ["Étiquette", "Passager", "Vol", "Chargement", "Litige"]
    colx = [cx, cx + 120 * S, cx + 270 * S, cx + 340 * S, cx + 450 * S]
    rr(d, [cx, ly, ox + w - 30 * S, ly + 28 * S], r=0, fill=(20, 30, 48))
    for i, hh in enumerate(headers):
        txt(d, (colx[i] + 6 * S, ly + 8 * S), hh, fb(9), MUT)
    ly += 28 * S
    rows = [("4071303821", "MUKENDI Moise", "ET0062", "Chargé", "Ouvert", True),
            ("4071303759", "DIASOLWA Marie", "ET0062", "En attente", "En cours", False),
            ("4071303760", "KALONJI Oscar", "KQ0555", "Chargé", None, False)]
    for tag, pax, vol, chg, lit, passenger in rows:
        txt(d, (colx[0] + 6 * S, ly + 10 * S), tag, f(10))
        txt(d, (colx[1] + 6 * S, ly + 10 * S), pax, f(10))
        txt(d, (colx[2] + 6 * S, ly + 10 * S), vol, f(10))
        txt(d, (colx[3] + 6 * S, ly + 10 * S), chg, f(10), GREEN if chg == "Chargé" else MUT)
        if lit:
            pill(d, colx[4] + 4 * S, ly + 5 * S, lit, fb(9), DANGER if lit == "Ouvert" else WARN, (40, 26, 26))
            if passenger:
                pill(d, colx[4] + 76 * S, ly + 5 * S, "Passager", fb(9), (147, 197, 253), (20, 40, 70))
        else:
            txt(d, (colx[4] + 6 * S, ly + 10 * S), "—", f(10), MUT)
        d.line([(cx, ly + 36 * S), (ox + w - 30 * S, ly + 36 * S)], fill=BORD, width=S)
        ly += 40 * S
    badge(d, 1, cx + 250 * S, oy + 95 * S)
    badge(d, 2, ox + w - 60 * S, oy + 126 * S + 28 * S + 18 * S)
    badge(d, 3, ox + w - 26 * S, oy + 36 * S)

window(litige, "litige.png", h=420)

print("OK illustrations")
