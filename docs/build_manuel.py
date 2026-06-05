# -*- coding: utf-8 -*-
"""Génère le manuel d'utilisateur Police Bagage au format PDF (reportlab)."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, KeepTogether, HRFlowable,
)

OUT = "Manuel-Utilisateur-Police-Bagage.pdf"

# Palette institutionnelle
NAVY = colors.HexColor("#0F2A4A")
BLUE = colors.HexColor("#2563EB")
LIGHT = colors.HexColor("#EEF2F7")
GREY = colors.HexColor("#5B6677")
DARK = colors.HexColor("#1A2230")
LINE = colors.HexColor("#D5DBE3")
WARNBG = colors.HexColor("#FBEFD6")
WARNBD = colors.HexColor("#E0A93B")
INFOBG = colors.HexColor("#E4ECF8")
INFOBD = colors.HexColor("#9DBDE8")

styles = getSampleStyleSheet()

def S(name, **kw):
    styles.add(ParagraphStyle(name, parent=styles["Normal"], **kw))

S("CoverTitle", fontName="Helvetica-Bold", fontSize=30, leading=36, textColor=NAVY, alignment=TA_CENTER)
S("CoverSub", fontName="Helvetica", fontSize=14, leading=20, textColor=GREY, alignment=TA_CENTER)
S("CoverMeta", fontName="Helvetica", fontSize=10.5, leading=16, textColor=GREY, alignment=TA_CENTER)
S("H1", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=NAVY, spaceBefore=6, spaceAfter=10)
S("H2", fontName="Helvetica-Bold", fontSize=13.5, leading=17, textColor=DARK, spaceBefore=12, spaceAfter=6)
S("H3", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=BLUE, spaceBefore=8, spaceAfter=4)
S("Body", fontName="Helvetica", fontSize=10.3, leading=15.5, textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6)
S("Lead", fontName="Helvetica", fontSize=11, leading=16.5, textColor=GREY, alignment=TA_JUSTIFY, spaceAfter=8)
S("Step", fontName="Helvetica", fontSize=10.3, leading=15, textColor=DARK)
S("Cell", fontName="Helvetica", fontSize=9.5, leading=13, textColor=DARK)
S("CellB", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=DARK)
S("CellH", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=colors.white)
S("Note", fontName="Helvetica", fontSize=9.8, leading=14, textColor=DARK, alignment=TA_LEFT)
S("TOCItem", fontName="Helvetica", fontSize=11, leading=20, textColor=DARK)
S("Foot", fontName="Helvetica", fontSize=8, textColor=GREY)

DOC_TITLE = "Police Bagage — Manuel d'utilisateur"

def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    # filet d'en-tete
    canvas.setStrokeColor(LINE); canvas.setLineWidth(0.6)
    canvas.line(20*mm, h-15*mm, w-20*mm, h-15*mm)
    canvas.setFont("Helvetica", 8); canvas.setFillColor(GREY)
    canvas.drawString(20*mm, h-13.5*mm, "POLICE BAGAGE")
    canvas.drawRightString(w-20*mm, h-13.5*mm, "Manuel d'utilisateur")
    # pied
    canvas.line(20*mm, 14*mm, w-20*mm, 14*mm)
    canvas.drawString(20*mm, 10.5*mm, "ATS Handling — Aéroport International de Kinshasa (FIH)")
    canvas.drawRightString(w-20*mm, 10.5*mm, "Page %d" % doc.page)
    canvas.restoreState()

def cover(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h-90*mm, w, 90*mm, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.rect(0, h-92*mm, w, 2*mm, fill=1, stroke=0)
    # bandeau bas
    canvas.setFillColor(LIGHT)
    canvas.rect(0, 0, w, 24*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 13)
    canvas.drawString(20*mm, h-30*mm, "ATS HANDLING")
    canvas.setFont("Helvetica", 10)
    canvas.drawString(20*mm, h-36*mm, "Aéroport International de Kinshasa — FIH")
    canvas.setFont("Helvetica-Bold", 34)
    canvas.drawString(20*mm, h-58*mm, "Police Bagage")
    canvas.setFont("Helvetica", 15)
    canvas.drawString(20*mm, h-68*mm, "Manuel d'utilisateur et de formation")
    canvas.setFillColor(GREY)
    canvas.setFont("Helvetica", 10)
    canvas.drawString(20*mm, 16*mm, "Document de formation interne")
    canvas.drawRightString(w-20*mm, 16*mm, "Version 1.0 — Juin 2026")
    canvas.restoreState()

def info_box(text, title="À RETENIR", bg=INFOBG, bd=INFOBD):
    inner = []
    inner.append(Paragraph("<b>%s</b>" % title, ParagraphStyle("ibt", parent=styles["Note"], textColor=NAVY, fontName="Helvetica-Bold", fontSize=9, spaceAfter=3)))
    inner.append(Paragraph(text, styles["Note"]))
    t = Table([[inner]], colWidths=[170*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("BOX", (0,0), (-1,-1), 0.8, bd),
        ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 8), ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    return t

def warn_box(text, title="IMPORTANT"):
    return info_box(text, title=title, bg=WARNBG, bd=WARNBD)

def steps(items):
    li = [ListItem(Paragraph(t, styles["Step"]), value=i+1) for i, t in enumerate(items)]
    return ListFlowable(li, bulletType="1", leftIndent=16, bulletFormat="%s.",
                        bulletFontName="Helvetica-Bold", bulletColor=BLUE, spaceBefore=2, spaceAfter=8)

def bullets(items):
    li = [ListItem(Paragraph(t, styles["Step"])) for t in items]
    return ListFlowable(li, bulletType="bullet", leftIndent=14, bulletColor=BLUE, start="square", spaceBefore=2, spaceAfter=8)

def table(headers, rows, widths):
    data = [[Paragraph(h, styles["CellH"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), styles["Cell"]) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.5, LINE),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    return t

def h1(txt): return Paragraph(txt, styles["H1"])
def h2(txt): return Paragraph(txt, styles["H2"])
def h3(txt): return Paragraph(txt, styles["H3"])
def p(txt): return Paragraph(txt, styles["Body"])
def lead(txt): return Paragraph(txt, styles["Lead"])
def rule(): return HRFlowable(width="100%", thickness=0.6, color=LINE, spaceBefore=6, spaceAfter=10)

story = []

# ---- Couverture ----
story.append(PageBreak())  # la page 1 est dessinee par cover()

# ---- Sommaire ----
story.append(h1("Sommaire"))
toc = [
    "1. À propos de ce manuel",
    "2. Présentation du système",
    "3. Rôles et accès",
    "4. Manuel de l'agent (application mobile)",
    "5. Manuel du superviseur (tableau de bord)",
    "6. Manuel du superviseur (litiges)",
    "7. Manuel de l'administrateur (comptes)",
    "8. Guide du passager (suivi et vols)",
    "9. Comprendre les statuts du bagage",
    "10. Règles anti-fraude",
    "11. Questions fréquentes et dépannage",
    "12. Bonnes pratiques",
]
for item in toc:
    story.append(Paragraph(item, styles["TOCItem"]))
story.append(PageBreak())

# ---- 1. À propos ----
story.append(h1("1. À propos de ce manuel"))
story.append(lead(
    "Ce manuel accompagne la prise en main de Police Bagage, la plateforme de "
    "contrôle d'embarquement et de lutte contre la fraude bagages d'ATS Handling. "
    "Il s'adresse aux personnes formées à l'utilisation du système : agents de "
    "piste, superviseurs et administrateurs."
))
story.append(p(
    "Chaque chapitre décrit, étape par étape, les opérations à réaliser selon "
    "votre rôle. Les chapitres consacrés aux passagers peuvent servir de support "
    "d'information au public."
))
story.append(info_box(
    "Conservez ce document à portée de main pendant la formation. Les procédures "
    "doivent être suivies dans l'ordre indiqué, en particulier pour le traitement "
    "des bagages."
))
story.append(PageBreak())

# ---- 2. Présentation ----
story.append(h1("2. Présentation du système"))
story.append(p(
    "Police Bagage couvre le parcours complet du passager et de son bagage, depuis "
    "l'enregistrement au comptoir jusqu'au chargement en soute, en passant par "
    "l'embarquement à la porte. Le système détecte en temps réel les tentatives de "
    "fraude et fournit aux superviseurs un suivi en direct ainsi que des rapports."
))
story.append(h2("Les applications de la plateforme"))
story.append(table(
    ["Application", "Pour qui", "Usage principal"],
    [
        ["Application mobile", "Agents de piste", "Scanner les boarding pass et les bagages"],
        ["Tableau de bord", "Superviseurs, admins", "Suivre l'activité, éditer les rapports"],
        ["Litiges", "Superviseurs", "Traiter les litiges et réclamations"],
        ["Suivi bagage", "Passagers", "Consulter l'état d'un bagage"],
        ["Vols du jour", "Passagers", "Consulter les vols et leur statut"],
    ],
    [42*mm, 40*mm, 88*mm],
))
story.append(PageBreak())

# ---- 3. Roles ----
story.append(h1("3. Rôles et accès"))
story.append(p(
    "Votre rôle détermine les applications auxquelles vous avez accès et les "
    "actions que vous pouvez réaliser. Chaque utilisateur dispose d'un compte "
    "nominatif, créé par un administrateur."
))
story.append(table(
    ["Rôle", "Accès", "Ce que vous pouvez faire"],
    [
        ["Administrateur", "Tableau de bord", "Créer et gérer les comptes ; toutes les actions superviseur"],
        ["Superviseur", "Tableau de bord, Litiges", "Suivre les vols, changer les statuts, éditer les rapports, traiter les litiges"],
        ["Agent", "Application mobile", "Scanner, charger en soute, réacheminer"],
    ],
    [38*mm, 42*mm, 90*mm],
))
story.append(warn_box(
    "Ne communiquez jamais vos identifiants. Toute action effectuée depuis un "
    "compte engage la responsabilité de son titulaire. En cas de perte ou de vol "
    "d'un appareil, prévenez immédiatement votre superviseur."
))
story.append(PageBreak())

# ---- 4. Agent mobile ----
story.append(h1("4. Manuel de l'agent (application mobile)"))
story.append(lead(
    "L'application mobile s'utilise sur les terminaux de scan Zebra. Le lecteur "
    "intégré renvoie les codes scannés directement dans l'application."
))

story.append(h2("4.1 Se connecter"))
story.append(steps([
    "Ouvrez l'application Police Bagage sur le terminal.",
    "À la première ouverture, l'écran d'accueil s'affiche ; appuyez sur Commencer.",
    "Saisissez votre adresse email et votre mot de passe.",
    "Appuyez sur Se connecter.",
]))
story.append(info_box(
    "Si l'email saisi n'est pas valide, le champ devient rouge. Si les identifiants "
    "sont incorrects, un message clair vous l'indique. Vérifiez votre saisie et "
    "réessayez.", title="EN CAS D'ERREUR"))

story.append(h2("4.2 Sélectionner un vol"))
story.append(steps([
    "Après connexion, la liste des vols du jour s'affiche.",
    "Sélectionnez le vol qui vous est assigné.",
    "Le détail du vol s'ouvre, avec les fonctions disponibles. Faites défiler "
    "l'écran pour voir toutes les fonctions.",
]))

story.append(h2("4.3 Check-in : scanner les boarding pass"))
story.append(p("Cette fonction enregistre les passagers à partir de leur carte d'embarquement."))
story.append(steps([
    "Depuis le détail du vol, appuyez sur Check-in.",
    "Scannez la carte d'embarquement du passager.",
    "Le passager apparaît : nom, siège, classe, route et nombre de bagages déclarés.",
    "Enchaînez avec le passager suivant.",
]))
story.append(warn_box(
    "Le nombre de bagages déclaré sur le boarding pass fait foi. C'est lui qui "
    "détermine combien de bagages seront autorisés au tapis pour ce passager."))

story.append(h2("4.4 Bagages : scanner les étiquettes"))
story.append(p(
    "Cette fonction confirme chaque bagage au tapis et applique automatiquement le "
    "contrôle anti-fraude."
))
story.append(steps([
    "Depuis le détail du vol, appuyez sur Bagages.",
    "Scannez l'étiquette du bagage.",
    "Si le bagage est autorisé, il est confirmé et le compteur progresse.",
    "Si le bagage est refusé, un message indique le motif. En cas de fraude, une "
    "alerte est envoyée immédiatement au superviseur.",
]))
story.append(info_box(
    "L'agent bagage n'est jamais en faute. Vous scannez ce qui se présente sur le "
    "tapis. Un refus signifie que le superviseur doit intervenir : ne forcez "
    "jamais le passage d'un bagage refusé."))

story.append(h2("4.5 Embarquement : confirmer les passagers à la porte"))
story.append(steps([
    "Depuis le détail du vol, appuyez sur Embarquement.",
    "Scannez la carte d'embarquement du passager à la porte.",
    "Le passager est marqué comme embarqué ; le compteur des passagers restants "
    "se met à jour.",
]))

story.append(h2("4.6 Charger : charger les bagages en soute"))
story.append(p(
    "Cette fonction charge en soute, en une seule opération, tous les bagages "
    "enregistrés qui ne sont pas marqués pour réacheminement. Aucun scan n'est "
    "nécessaire."
))
story.append(steps([
    "Marquez d'abord les bagages restants avec la fonction Rush (voir 4.7).",
    "Depuis le détail du vol, appuyez sur Charger.",
    "Appuyez sur Charger les bagages.",
    "Le nombre de bagages chargés en soute s'affiche, ainsi que les bagages exclus "
    "(rush) et le total des bagages enregistrés.",
]))

story.append(h2("4.7 Rush : marquer les bagages à réacheminer"))
story.append(p(
    "Cette fonction marque les bagages restants qui n'ont pas pu être chargés et "
    "seront réacheminés sur le prochain vol."
))
story.append(steps([
    "Depuis le détail du vol, appuyez sur Rush.",
    "Scannez chaque bagage restant à réacheminer.",
    "Chaque bagage marqué est confirmé à l'écran.",
]))
story.append(warn_box(
    "Ordre recommandé : scannez d'abord les bagages Rush, puis utilisez Charger "
    "pour envoyer en soute tout le reste. Ainsi, les bagages réacheminés ne sont "
    "jamais chargés par erreur."))
story.append(PageBreak())

# ---- 5. Superviseur web ----
story.append(h1("5. Manuel du superviseur (tableau de bord)"))
story.append(lead(
    "Le tableau de bord web offre une vue d'ensemble en temps réel et permet "
    "d'éditer les rapports d'activité."
))
story.append(h2("5.1 Se connecter"))
story.append(steps([
    "Ouvrez l'adresse du tableau de bord dans un navigateur.",
    "Sur la page d'accueil, cliquez sur Se connecter.",
    "Saisissez vos identifiants. Une fois connecté, vous arrivez directement sur "
    "le tableau de bord lors de vos prochaines visites.",
]))
story.append(h2("5.2 Lire le tableau de bord"))
story.append(p(
    "La vue d'ensemble présente les vols du jour, séparés en départs et arrivées, "
    "ainsi que les compteurs clés : nombre de vols, départs, arrivées et alertes "
    "fraude. Les alertes en cours apparaissent en évidence."
))
story.append(h2("5.3 Consulter le détail d'un vol"))
story.append(steps([
    "Cliquez sur un vol pour ouvrir son détail.",
    "Consultez les compteurs : passagers, embarqués, bagages confirmés, chargés "
    "en soute, en réacheminement, et alertes fraude.",
    "La liste des passagers indique pour chacun les bagages confirmés et l'état "
    "d'embarquement.",
]))
story.append(h2("5.4 Changer le statut d'un vol"))
story.append(steps([
    "Ouvrez le détail du vol.",
    "Sélectionnez le statut voulu : Programmé, Embarquement, Fermé ou Annulé.",
    "Le statut est mis à jour immédiatement, y compris pour les passagers sur "
    "l'application publique des vols du jour.",
]))
story.append(h2("5.5 Comprendre les alertes fraude"))
story.append(p(
    "Les alertes fraude sont signalées et affichées automatiquement. Elles "
    "servent de trace et de signal d'intervention : envoyez un agent intercepter "
    "physiquement le bagage concerné sur le tapis ou à la porte indiquée."
))
story.append(h2("5.6 Éditer un rapport"))
story.append(steps([
    "Dans le menu, ouvrez Rapports.",
    "Choisissez la période : Jour, Semaine, Mois, Année ou Personnalisé.",
    "Pour une période personnalisée, indiquez les dates de début et de fin.",
    "Consultez les statistiques affichées, puis cliquez sur Télécharger Excel.",
]))
story.append(info_box(
    "Le fichier Excel contient plusieurs feuilles : un résumé chiffré, le détail "
    "des vols, des passagers, des bagages et la liste des alertes fraude de la "
    "période."))
story.append(PageBreak())

# ---- 6. Litiges ----
story.append(h1("6. Manuel du superviseur (litiges)"))
story.append(lead(
    "L'application litiges permet de suivre les bagages, d'ouvrir des dossiers et "
    "de traiter les réclamations transmises par les passagers."
))
story.append(h2("6.1 Filtrer les bagages"))
story.append(steps([
    "Ouvrez l'application litiges et connectez-vous.",
    "Par défaut, la journée en cours est affichée. Choisissez une autre date si "
    "nécessaire.",
    "Affinez avec les filtres : vol, état de chargement et statut de litige.",
    "Utilisez la recherche pour retrouver une étiquette, une série, un PNR ou un "
    "nom de passager.",
]))
story.append(h2("6.2 Ouvrir et suivre un litige"))
story.append(steps([
    "Cliquez sur un bagage pour ouvrir son panneau de détail.",
    "Renseignez le statut (Ouvert, En cours, Résolu), le motif et les notes.",
    "Enregistrez. Le statut se reflète dans le suivi consulté par le passager.",
]))
story.append(h2("6.3 Traiter une réclamation passager"))
story.append(p(
    "Lorsqu'un passager signale un problème depuis l'application de suivi, une "
    "réclamation est créée automatiquement et apparaît dans la liste, identifiée "
    "comme provenant d'un passager. Ouvrez-la, traitez-la comme un litige et "
    "mettez le statut à jour."
))
story.append(h2("6.4 Télécharger le rapport journalier"))
story.append(steps([
    "Cliquez sur Rapport du jour.",
    "Le fichier Excel des litiges de la journée est téléchargé.",
]))
story.append(PageBreak())

# ---- 7. Admin ----
story.append(h1("7. Manuel de l'administrateur (comptes)"))
story.append(lead(
    "Seuls les administrateurs peuvent créer et consulter les comptes des agents "
    "et des superviseurs."
))
story.append(h2("7.1 Créer un compte"))
story.append(steps([
    "Dans le menu du tableau de bord, ouvrez Comptes.",
    "Renseignez l'email, le mot de passe et le nom complet de la personne.",
    "Choisissez le rôle : Agent, Superviseur ou Administrateur.",
    "Pour un agent, indiquez la porte assignée si nécessaire.",
    "Validez la création. Le compte est actif immédiatement.",
]))
story.append(info_box(
    "Communiquez les identifiants à la personne de manière sécurisée et "
    "demandez-lui de les garder confidentiels."))
story.append(warn_box(
    "Attribuez le rôle Administrateur avec parcimonie : il donne accès à la "
    "gestion de tous les comptes."))
story.append(PageBreak())

# ---- 8. Passager ----
story.append(h1("8. Guide du passager (suivi et vols)"))
story.append(lead(
    "Ces applications publiques ne nécessitent aucun compte. Ce chapitre peut "
    "servir de support d'information pour les passagers."
))
story.append(h2("8.1 Suivre un bagage"))
story.append(steps([
    "Ouvrez l'application de suivi bagage.",
    "Pour voir tous vos bagages, saisissez votre référence de réservation (PNR).",
    "Pour voir un seul bagage, saisissez son numéro d'étiquette (dix chiffres).",
    "Consultez le statut de chaque bagage.",
]))
story.append(h2("8.2 Signaler un problème"))
story.append(steps([
    "Sur le bagage concerné, appuyez sur Signaler un problème.",
    "Choisissez le type de problème, décrivez-le et laissez un contact si "
    "souhaité.",
    "Envoyez. La réclamation est transmise directement au superviseur.",
]))
story.append(h2("8.3 Consulter les vols du jour"))
story.append(p(
    "L'application des vols du jour affiche uniquement les vols de la journée en "
    "cours, avec leur statut (Programmé, Embarquement, Fermé, Annulé) et une "
    "indication de retard éventuel. Des liens donnent accès aux services du "
    "portail officiel de l'aéroport."
))
story.append(PageBreak())

# ---- 9. Statuts bagage ----
story.append(h1("9. Comprendre les statuts du bagage"))
story.append(p(
    "Le bagage passe par des états successifs, du moins avancé au plus avancé. "
    "Ces statuts sont visibles par le passager dans l'application de suivi."
))
story.append(table(
    ["Statut", "Signification"],
    [
        ["En attente", "Bagage déclaré mais étiquette pas encore scannée au tapis."],
        ["Enregistré", "Étiquette scannée au tapis ; contrôle anti-fraude validé."],
        ["Chargé en soute", "Bagage chargé dans la soute à destination (fonction Charger)."],
        ["Réacheminement", "Bagage restant à envoyer sur le prochain vol (fonction Rush)."],
    ],
    [45*mm, 125*mm],
))
story.append(PageBreak())

# ---- 10. Anti-fraude ----
story.append(h1("10. Règles anti-fraude"))
story.append(p(
    "Le contrôle s'applique au scan de l'étiquette bagage. Les règles suivantes "
    "sont automatiques et ne peuvent jamais être contournées."
))
story.append(table(
    ["Situation détectée", "Décision", "Alerte"],
    [
        ["Passager non enregistré pour ce vol", "Bagage refusé", "Oui"],
        ["Zéro bagage déclaré sur le boarding pass", "Bagage refusé", "Oui"],
        ["Nombre de bagages déclaré dépassé", "Bagage refusé", "Oui"],
        ["Étiquette déjà scannée sur ce vol", "Bagage refusé", "Non (doublon)"],
        ["Bagage appartenant à un autre vol", "Bagage refusé", "Non"],
    ],
    [86*mm, 44*mm, 40*mm],
))
story.append(info_box(
    "La fraude provient du comptoir d'enregistrement, où une étiquette a pu être "
    "imprimée sur une réservation sans bagage déclaré. Le système intercepte le "
    "colis avant son départ en soute et alerte le superviseur."))
story.append(PageBreak())

# ---- 11. FAQ ----
story.append(h1("11. Questions fréquentes et dépannage"))
faq = [
    ("Le scan ne fonctionne pas sur le terminal.",
     "Vérifiez que vous êtes bien sur l'écran de scan correspondant (Check-in, "
     "Bagages, Embarquement ou Rush) et que le lecteur est actif. Réessayez le scan."),
    ("Un bagage est refusé alors qu'il semble normal.",
     "Le refus suit les règles anti-fraude. Ne forcez pas. Signalez-le au "
     "superviseur, qui décidera de l'intervention."),
    ("Je ne vois pas toutes les fonctions sur le détail du vol.",
     "Faites défiler l'écran vers le bas : toutes les fonctions, y compris "
     "Charger et Rush, sont accessibles en faisant défiler."),
    ("La page web affiche une erreur ou ne se charge pas entièrement.",
     "Rechargez la page. Si le problème persiste après une mise à jour, videz le "
     "cache du navigateur puis rechargez."),
    ("Un passager ne trouve pas son bagage dans le suivi.",
     "Vérifiez qu'il saisit le bon PNR ou le bon numéro d'étiquette à dix chiffres. "
     "Le bagage n'apparaît qu'une fois enregistré au tapis."),
]
for q, a in faq:
    story.append(h3(q))
    story.append(p(a))
story.append(PageBreak())

# ---- 12. Bonnes pratiques ----
story.append(h1("12. Bonnes pratiques"))
story.append(bullets([
    "Connectez-vous avec votre compte personnel uniquement et déconnectez-vous en "
    "fin de service.",
    "Ne partagez jamais vos identifiants.",
    "Suivez l'ordre des opérations bagage : scan au tapis, puis Rush, puis Charger.",
    "Ne forcez jamais un bagage refusé : référez-vous au superviseur.",
    "Surveillez les alertes fraude et intervenez sans délai.",
    "En cas de perte ou de vol d'un terminal, prévenez immédiatement votre "
    "superviseur pour révoquer l'accès.",
]))
story.append(Spacer(1, 10))
story.append(rule())
story.append(Paragraph(
    "ATS Handling — Aéroport International de Kinshasa (FIH). Document de "
    "formation interne. Toute reproduction est réservée à un usage interne.",
    styles["Foot"]))

# ---- Build ----
doc = BaseDocTemplate(OUT, pagesize=A4,
                      leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=18*mm,
                      title=DOC_TITLE, author="ATS Handling")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=cover),
    PageTemplate(id="body", frames=[frame], onPage=header_footer),
])
# La premiere page utilise le template cover ; on bascule ensuite sur body.
from reportlab.platypus import NextPageTemplate
story.insert(0, NextPageTemplate("body"))

doc.build(story)
print("OK", OUT)
