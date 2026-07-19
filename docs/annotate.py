# -*- coding: utf-8 -*-
"""
Annotation des captures d'écran pour les manuels d'utilisation.

Pose sur chaque capture : un encadré autour de l'élément visé, une pastille
numérotée dans la marge et une flèche reliant les deux. Les coordonnées
proviennent du JSON produit par capture.mjs (mesurées dans le navigateur), donc
les repères tombent exactement sur les bons boutons.
"""
import json
import math
import os

from PIL import Image, ImageDraw, ImageFont

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")

# Rouge franc : se distingue nettement de la palette verte de l'application,
# donc on ne confond jamais une annotation avec un élément d'interface.
MARK = (203, 39, 47)
WHITE = (255, 255, 255)

FONT_BOLD = r"C:\Windows\Fonts\arialbd.ttf"

BADGE_R = 30        # rayon de la pastille numérotée
GAP = 34            # écart entre l'encadré et la pastille
PAD = 10            # marge entre l'élément et son encadré


def font(size):
    return ImageFont.truetype(FONT_BOLD, size)


def rounded_box(draw, box, radius, color, width):
    draw.rounded_rectangle(box, radius=radius, outline=color, width=width)


def arrow(draw, start, end, color, width=6):
    """Trait fléché de `start` vers `end`, pointe orientée vers la cible."""
    draw.line([start, end], fill=color, width=width)
    ang = math.atan2(end[1] - start[1], end[0] - start[0])
    size = 26
    for spread in (0.42, -0.42):
        draw.line(
            [end, (end[0] - size * math.cos(ang - spread), end[1] - size * math.sin(ang - spread))],
            fill=color,
            width=width,
        )


def _overlaps(cx, cy, rects, skip):
    """La pastille (disque de rayon BADGE_R) recouvre-t-elle un autre élément visé ?"""
    for key, r in rects.items():
        if key == skip:
            continue
        if (r["x"] - BADGE_R < cx < r["x"] + r["w"] + BADGE_R
                and r["y"] - BADGE_R < cy < r["y"] + r["h"] + BADGE_R):
            return True
    return False


def place_badge(rect, img_w, img_h, rects=None, key=None):
    """
    Choisit où poser la pastille : à gauche, à droite, au-dessus ou en dessous.
    On retient la première position qui tient dans l'image ET ne recouvre aucun
    autre élément annoté — sinon une pastille masquerait le repère voisin.
    """
    x, y, w, h = rect["x"], rect["y"], rect["w"], rect["h"]
    cx, cy = x + w / 2, y + h / 2
    rects = rects or {}

    candidates = [
        ((x - PAD - GAP - BADGE_R, cy), (x - PAD, cy)),
        ((x + w + PAD + GAP + BADGE_R, cy), (x + w + PAD, cy)),
        ((cx, y - PAD - GAP - BADGE_R), (cx, y - PAD)),
        ((cx, y + h + PAD + GAP + BADGE_R), (cx, y + h + PAD)),
    ]

    inside = lambda p: BADGE_R + 8 < p[0] < img_w - BADGE_R - 8 and BADGE_R + 8 < p[1] < img_h - BADGE_R - 8
    for badge, tip in candidates:
        if inside(badge) and not _overlaps(badge[0], badge[1], rects, key):
            return badge, tip
    # Aucune position idéale : on garde la première qui tient dans l'image.
    for badge, tip in candidates:
        if inside(badge):
            return badge, tip
    return (cx, max(BADGE_R + 8, y - PAD - GAP)), (cx, y - PAD)


def annotate(name, order):
    """
    Annote `<name>.png` d'après `<name>.json`.
    `order` liste les clés de repères, dans l'ordre de numérotation voulu.
    Renvoie la liste [(numéro, clé, libellé)] : la clé permet au manuel
    d'attacher une explication détaillée à chaque pastille.
    """
    png = os.path.join(IMG, f"{name}.png")
    meta = os.path.join(IMG, f"{name}.json")
    if not os.path.exists(png):
        print(f"  [!] capture absente : {name}.png")
        return []
    if not os.path.exists(meta):
        print(f"  [!] reperes absents : {name}.json (image copiee sans annotation)")
        Image.open(png).convert("RGB").save(os.path.join(IMG, f"{name}_annote.png"))
        return []

    with open(meta, encoding="utf-8") as fh:
        rects = json.load(fh)

    im = Image.open(png).convert("RGB")
    d = ImageDraw.Draw(im)
    f = font(34)
    legend = []

    num = 0
    for key in order:
        rect = rects.get(key)
        if not rect:
            continue
        num += 1
        box = (rect["x"] - PAD, rect["y"] - PAD, rect["x"] + rect["w"] + PAD, rect["y"] + rect["h"] + PAD)
        rounded_box(d, box, radius=16, color=MARK, width=5)

        (bx, by), (tx, ty) = place_badge(rect, im.width, im.height, rects, key)
        arrow(d, (bx, by), (tx, ty), MARK)
        d.ellipse((bx - BADGE_R, by - BADGE_R, bx + BADGE_R, by + BADGE_R), fill=MARK)
        label = str(num)
        tw = d.textlength(label, font=f)
        d.text((bx - tw / 2, by - 22), label, font=f, fill=WHITE)

        legend.append((num, key, rect.get("label") or key))

    out = os.path.join(IMG, f"{name}_annote.png")
    im.save(out)
    print(f"  [ok] {name}_annote.png ({num} reperes)")
    return legend
