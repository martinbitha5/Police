# -*- coding: utf-8 -*-
"""Génère la documentation technique Police Bagage au format PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable, NextPageTemplate,
)

OUT = "Documentation-Technique-Police-Bagage.pdf"
NAVY = colors.HexColor("#0F2A4A"); BLUE = colors.HexColor("#2563EB")
LIGHT = colors.HexColor("#EEF2F7"); GREY = colors.HexColor("#5B6677")
DARK = colors.HexColor("#1A2230"); LINE = colors.HexColor("#D5DBE3")

styles = getSampleStyleSheet()
def S(n, **k): styles.add(ParagraphStyle(n, parent=styles["Normal"], **k))
S("H1", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=NAVY, spaceBefore=6, spaceAfter=10)
S("H2", fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=DARK, spaceBefore=12, spaceAfter=5)
S("Body", fontName="Helvetica", fontSize=10.3, leading=15.5, textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6)
S("Lead", fontName="Helvetica", fontSize=11, leading=16.5, textColor=GREY, alignment=TA_JUSTIFY, spaceAfter=8)
S("Item", fontName="Helvetica", fontSize=10.3, leading=15, textColor=DARK)
S("Cell", fontName="Helvetica", fontSize=9.3, leading=12.5, textColor=DARK)
S("CellH", fontName="Helvetica-Bold", fontSize=9.3, leading=12.5, textColor=colors.white)
S("TOCItem", fontName="Helvetica", fontSize=11, leading=20, textColor=DARK)
S("Foot", fontName="Helvetica", fontSize=8, textColor=GREY)
S("Mono", fontName="Courier", fontSize=8.6, leading=12, textColor=DARK)

DOC_TITLE = "Police Bagage — Documentation technique"

def hf(c, doc):
    c.saveState(); w, h = A4
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.line(20*mm, h-15*mm, w-20*mm, h-15*mm); c.line(20*mm, 14*mm, w-20*mm, 14*mm)
    c.setFont("Helvetica", 8); c.setFillColor(GREY)
    c.drawString(20*mm, h-13.5*mm, "POLICE BAGAGE")
    c.drawRightString(w-20*mm, h-13.5*mm, "Documentation technique")
    c.drawString(20*mm, 10.5*mm, "ATS Handling — Aéroport International de Kinshasa (FIH)")
    c.drawRightString(w-20*mm, 10.5*mm, "Page %d" % doc.page)
    c.restoreState()

def cover(c, doc):
    c.saveState(); w, h = A4
    c.setFillColor(NAVY); c.rect(0, h-95*mm, w, 95*mm, fill=1, stroke=0)
    c.setFillColor(BLUE); c.rect(0, h-97*mm, w, 2*mm, fill=1, stroke=0)
    c.setFillColor(LIGHT); c.rect(0, 0, w, 24*mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13); c.drawString(20*mm, h-32*mm, "ATS HANDLING")
    c.setFont("Helvetica", 10); c.drawString(20*mm, h-38*mm, "Aéroport International de Kinshasa — FIH")
    c.setFont("Helvetica-Bold", 32); c.drawString(20*mm, h-60*mm, "Police Bagage")
    c.setFont("Helvetica", 15); c.drawString(20*mm, h-71*mm, "Documentation technique")
    c.setFillColor(GREY); c.setFont("Helvetica", 10)
    c.drawString(20*mm, 16*mm, "Document de référence du projet")
    c.drawRightString(w-20*mm, 16*mm, "Version 1.0 — Juin 2026")
    c.restoreState()

def h1(t): return Paragraph(t, styles["H1"])
def h2(t): return Paragraph(t, styles["H2"])
def p(t): return Paragraph(t, styles["Body"])
def lead(t): return Paragraph(t, styles["Lead"])
def bullets(items):
    return ListFlowable([ListItem(Paragraph(t, styles["Item"])) for t in items],
                        bulletType="bullet", leftIndent=14, bulletColor=BLUE, start="square", spaceAfter=8)
def steps(items):
    return ListFlowable([ListItem(Paragraph(t, styles["Item"])) for t in items],
                        bulletType="1", leftIndent=16, bulletFormat="%s.",
                        bulletFontName="Helvetica-Bold", bulletColor=BLUE, spaceAfter=8)
def table(headers, rows, widths):
    data = [[Paragraph(x, styles["CellH"]) for x in headers]]
    data += [[Paragraph(str(c), styles["Cell"]) for c in r] for r in rows]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.5, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    return t
def code(txt):
    t = Table([[Paragraph(txt.replace("\n", "<br/>").replace(" ", "&nbsp;"), styles["Mono"])]], colWidths=[170*mm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#0F1B2E")),
        ("TEXTCOLOR",(0,0),(-1,-1),colors.white),("LEFTPADDING",(0,0),(-1,-1),10),
        ("RIGHTPADDING",(0,0),(-1,-1),10),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]))
    # reecrire en mono blanc
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#0F1B2E"))]))
    return t

story = [NextPageTemplate("body"), PageBreak()]

# Sommaire
story += [h1("Sommaire")]
for it in [
    "1. Présentation générale", "2. Architecture technique", "3. Rôles et permissions",
    "4. Modèle de données", "5. Cycle de vie du bagage", "6. Règles anti-fraude",
    "7. Applications", "8. Rapports", "9. Déploiement", "10. Sécurité et confidentialité",
]:
    story.append(Paragraph(it, styles["TOCItem"]))
story.append(PageBreak())

# 1
story += [h1("1. Présentation générale"),
 lead("Police Bagage est une plateforme qui couvre le cycle de vie du passager et de son bagage, "
      "de l'enregistrement au comptoir jusqu'au chargement en soute, en passant par l'embarquement "
      "à la porte. Le système intercepte en temps réel les tentatives de fraude bagage et fournit "
      "aux superviseurs un suivi en direct ainsi que des rapports d'activité."),
 p("La plateforme se compose de cinq applications et d'un service d'interface de programmation (API), "
   "articulés autour d'une base de données unique."),
 table(["Composant", "Public", "Rôle"],
   [["Application mobile", "Agents de piste", "Scan des boarding pass et des bagages sur PDA Zebra"],
    ["Tableau de bord web", "Superviseurs, admins", "Suivi temps réel, rapports, gestion des comptes"],
    ["Application litige", "Superviseurs", "Traitement des litiges et réclamations bagage"],
    ["Suivi bagage", "Passagers (public)", "Consultation de l'état d'un bagage"],
    ["Vols du jour", "Passagers (public)", "Tableau des vols et de leur statut"],
    ["API", "Applications internes", "Logique de scan et anti-fraude"]],
   [42*mm, 40*mm, 88*mm]),
 PageBreak()]

# 2
story += [h1("2. Architecture technique"),
 p("Le projet est organisé en monorepo. Le code source est partagé entre toutes les applications, "
   "ce qui garantit la cohérence des types et des règles métier."),
 code("/\n  apps/\n    mobile/    Application React Native (Expo) — agents Zebra\n"
      "    web/       Tableau de bord Next.js — superviseurs et admins\n"
      "    litige/    Application litiges Next.js — superviseurs\n"
      "    tracking/  Suivi bagage public Next.js — passagers\n"
      "    vols/      Vols du jour public Next.js — passagers\n"
      "  packages/\n    api/         Service Fastify (scan, anti-fraude)\n"
      "    bcbp-parser/ Analyse boarding pass et étiquettes\n"
      "    shared/      Types et règles partagés\n"
      "  supabase/migrations/  Schéma de la base de données"),
 Spacer(1, 6),
 h2("Technologies"),
 table(["Couche", "Technologie"],
   [["Application mobile", "React Native, Expo, Expo Router"],
    ["Applications web", "Next.js (App Router), React"],
    ["Service API", "Node.js, Fastify"],
    ["Base de données", "Supabase (PostgreSQL)"],
    ["Temps réel et authentification", "Supabase Realtime, Supabase Auth"],
    ["Rapports", "ExcelJS"]],
   [60*mm, 110*mm]),
 h2("Séparation des accès"),
 bullets([
   "Les applications publiques (tracking, vols) ne demandent aucune authentification ; la lecture se "
   "fait côté serveur avec une clé de service, en ne renvoyant que des données non sensibles.",
   "Les applications internes (web, litige) sont protégées par authentification ; les droits sont "
   "vérifiés par la base et par l'interface.",
   "L'application mobile communique avec la base via le service API, qui centralise les règles anti-fraude.",
 ]),
 PageBreak()]

# 3
story += [h1("3. Rôles et permissions"),
 table(["Rôle", "Plateforme", "Permissions"],
   [["Administrateur", "Web", "Créer et gérer les comptes ; toutes les actions superviseur"],
    ["Superviseur", "Web, Litige", "Tableau de bord, statuts de vol, rapports, litiges"],
    ["Agent", "Mobile", "Scan, chargement en soute, réacheminement"]],
   [38*mm, 36*mm, 96*mm]),
 p("La page de gestion des comptes est strictement réservée aux administrateurs. Un superviseur qui "
   "tente d'y accéder est automatiquement redirigé vers le tableau de bord."),
 PageBreak()]

# 4
story += [h1("4. Modèle de données"),
 table(["Table", "Contenu principal"],
   [["profiles", "Utilisateurs : nom, rôle, porte assignée"],
    ["flights", "Vols : numéro, origine, destination, escales, horaires, date, statut"],
    ["passengers", "Passagers : nom, PNR, siège, classe, bagages déclarés, embarquement"],
    ["passenger_legs", "Escales d'un passager (vols avec transit)"],
    ["baggage", "Bagages : étiquette, série, enregistré, chargé en soute, rush, horodatages"],
    ["fraud_alerts", "Alertes de fraude : passager, PNR, étiquette, motif, porte"],
    ["baggage_disputes", "Litiges et réclamations : statut, motif, origine passager"]],
   [42*mm, 128*mm]),
 p("Les statuts de vol possibles sont : Programmé, Embarquement, Fermé et Annulé. Sur la table baggage, "
   "trois indicateurs résument l'avancement : enregistré au tapis, chargé en soute, et marqué pour "
   "réacheminement."),
 PageBreak()]

# 5
story += [h1("5. Cycle de vie du bagage"),
 p("Le bagage passe par plusieurs états successifs. Cet enchaînement est au cœur du système et se "
   "reflète dans le suivi proposé au passager."),
 table(["État", "Signification"],
   [["En attente", "Déclaré au boarding pass, étiquette pas encore scannée au tapis"],
    ["Enregistré", "Étiquette scannée au tapis, contrôle anti-fraude validé"],
    ["Chargé en soute", "Bagage chargé dans la soute à destination (fonction Charger)"],
    ["Réacheminement", "Bagage restant marqué pour le prochain vol (fonction Rush)"]],
   [45*mm, 125*mm]),
 p("Déroulement opérationnel recommandé : après le scan des bagages au tapis, l'agent scanne d'abord "
   "les bagages à réacheminer (Rush), puis déclenche le chargement groupé des bagages enregistrés "
   "restants (Charger)."),
 PageBreak()]

# 6
story += [h1("6. Règles anti-fraude"),
 p("Le contrôle s'applique au scan d'une étiquette bagage. Cinq règles de rejet sont appliquées et ne "
   "sont jamais contournables."),
 table(["Situation détectée", "Décision", "Alerte"],
   [["Passager non enregistré pour ce vol", "Bagage refusé", "Oui"],
    ["Zéro bagage déclaré sur le boarding pass", "Bagage refusé", "Oui"],
    ["Nombre de bagages déclaré dépassé", "Bagage refusé", "Oui"],
    ["Étiquette déjà scannée sur ce vol", "Bagage refusé", "Non (doublon)"],
    ["Bagage appartenant à un autre vol", "Bagage refusé", "Non"]],
   [86*mm, 44*mm, 40*mm]),
 p("L'agent bagage n'est jamais en faute : il scanne ce qui se présente sur le tapis. La fraude provient "
   "du comptoir d'enregistrement. Le système intercepte le colis avant son départ en soute et alerte le "
   "superviseur. Les alertes sont signalées et affichées, sans procédure de résolution dans l'application : "
   "elles servent de trace et de signal d'intervention."),
 h2("Note sur le code compagnie partagé"),
 p("Le code numérique 071 correspond à la fois à Ethiopian Airlines et à Air Congo, qui partagent le code "
   "IATA ET. Ce n'est pas une anomalie. Le système ne se fonde jamais sur le code compagnie pour relier un "
   "bagage à un passager : la clé de liaison est toujours le numéro de série combiné au vol et à la date."),
 PageBreak()]

# 7
story += [h1("7. Applications"),
 h2("Application mobile (agents)"),
 p("Destinée aux PDA Zebra Android, elle s'appuie sur DataWedge qui injecte les scans comme des frappes "
   "clavier. Parcours : connexion, sélection du vol, puis cinq fonctions — Check-in, Bagages, "
   "Embarquement, Charger, Rush."),
 h2("Tableau de bord web (superviseurs et administrateurs)"),
 bullets([
   "Vue d'ensemble des vols du jour (départs et arrivées).",
   "Détail d'un vol : passagers, embarquement, bagages confirmés, chargés en soute, en réacheminement, alertes.",
   "Changement de statut d'un vol ; page Rapports ; page Comptes réservée aux administrateurs.",
 ]),
 h2("Application litige (superviseurs)"),
 bullets([
   "Liste des bagages filtrable par date, vol, chargement et statut de litige.",
   "Ouverture et suivi des dossiers ; réception des réclamations passagers ; rapport journalier Excel.",
 ]),
 h2("Suivi bagage et Vols du jour (passagers)"),
 bullets([
   "Suivi : recherche par PNR (tous les bagages) ou par étiquette (un seul bagage) ; signalement de problème.",
   "Vols du jour : tableau des vols du jour avec statut et retard estimé ; liens vers le portail de l'aéroport.",
 ]),
 PageBreak()]

# 8
story += [h1("8. Rapports"),
 p("Deux types de rapports Excel sont produits par le tableau de bord."),
 bullets([
   "Rapport de vol : détail complet d'un vol en cinq feuilles — Résumé, Passagers, Bagages, Alertes "
   "fraude, et statistiques de la journée.",
   "Rapport de période : bilan agrégé sur la période choisie (jour, semaine, mois, année ou plage "
   "personnalisée) en cinq feuilles. Le résumé comptable présente volumes, moyennes et taux.",
 ]),
 PageBreak()]

# 9
story += [h1("9. Déploiement"),
 h2("Applications web"),
 p("Les quatre applications web sont déployées sur Hostinger Cloud à partir de dépôts GitHub autonomes, "
   "en déploiement automatique sur la branche principale (cadre Next.js, gestionnaire npm, Node 20 ou plus)."),
 table(["Application", "Dépôt", "Port local"],
   [["Tableau de bord", "police-web", "3000"], ["Suivi bagage", "police-tracking", "3002"],
    ["Litige", "police-litige", "3003"], ["Vols du jour", "police-vols", "3004"]],
   [55*mm, 75*mm, 40*mm]),
 p("Les variables d'environnement (adresse et clés Supabase, hub) sont fournies dans la configuration de "
   "l'hébergeur et ne sont jamais inscrites dans le code. Les pages HTML sont servies sans mise en cache "
   "pour toujours référencer la version courante ; les ressources statiques conservent un cache long, et "
   "un mécanisme recharge la page en cas de ressource obsolète après une mise à jour."),
 h2("Service API et application mobile"),
 p("Le service API est déployé séparément sur Hostinger Cloud à partir d'un dépôt autonome. L'application "
   "mobile est compilée via Expo EAS et publiée sur Google Play ; le numéro de version interne s'incrémente "
   "automatiquement à chaque compilation."),
 PageBreak()]

# 10
story += [h1("10. Sécurité et confidentialité"),
 bullets([
   "Les échanges sont chiffrés de bout en bout.",
   "Les clés sensibles restent côté serveur et ne sont jamais exposées aux clients ni inscrites dans le code.",
   "Les applications publiques ne collectent aucune donnée personnelle à des fins commerciales et n'intègrent "
   "aucun traceur publicitaire.",
   "L'accès aux données internes est limité aux comptes habilités.",
   "Les règles anti-fraude ne peuvent être contournées par aucun rôle ; toute exception relève d'une "
   "intervention manuelle du superviseur.",
 ]),
 Spacer(1, 10), HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=8),
 Paragraph("ATS Handling — Aéroport International de Kinshasa (FIH). Document de référence interne.", styles["Foot"])]

doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm,
                      topMargin=20*mm, bottomMargin=18*mm, title=DOC_TITLE, author="ATS Handling")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=cover),
    PageTemplate(id="body", frames=[frame], onPage=hf),
])
doc.build(story)
print("OK", OUT)
