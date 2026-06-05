# -*- coding: utf-8 -*-
"""Generates the Police Bagage user manual (English) as a PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, KeepTogether, HRFlowable, Image as RLImage,
    NextPageTemplate,
)

OUT = "Police-Bagage-User-Manual-EN.pdf"
NAVY = colors.HexColor("#0F2A4A"); BLUE = colors.HexColor("#2563EB")
LIGHT = colors.HexColor("#EEF2F7"); GREY = colors.HexColor("#5B6677")
DARK = colors.HexColor("#1A2230"); LINE = colors.HexColor("#D5DBE3")
WARNBG = colors.HexColor("#FBEFD6"); WARNBD = colors.HexColor("#E0A93B")
INFOBG = colors.HexColor("#E4ECF8"); INFOBD = colors.HexColor("#9DBDE8")

styles = getSampleStyleSheet()
def S(n, **k): styles.add(ParagraphStyle(n, parent=styles["Normal"], **k))
S("H1", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=NAVY, spaceBefore=6, spaceAfter=10)
S("H2", fontName="Helvetica-Bold", fontSize=13.5, leading=17, textColor=DARK, spaceBefore=12, spaceAfter=6)
S("H3", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=BLUE, spaceBefore=8, spaceAfter=4)
S("Body", fontName="Helvetica", fontSize=10.3, leading=15.5, textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6)
S("Lead", fontName="Helvetica", fontSize=11, leading=16.5, textColor=GREY, alignment=TA_JUSTIFY, spaceAfter=8)
S("Step", fontName="Helvetica", fontSize=10.3, leading=15, textColor=DARK)
S("Cell", fontName="Helvetica", fontSize=9.5, leading=13, textColor=DARK)
S("CellH", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=colors.white)
S("Note", fontName="Helvetica", fontSize=9.8, leading=14, textColor=DARK)
S("TOCItem", fontName="Helvetica", fontSize=11, leading=20, textColor=DARK)
S("Foot", fontName="Helvetica", fontSize=8, textColor=GREY)
S("Cap", fontName="Helvetica-Oblique", fontSize=9, leading=12, textColor=GREY, alignment=TA_CENTER, spaceBefore=4, spaceAfter=8)
S("Leg", fontName="Helvetica", fontSize=9.6, leading=14, textColor=DARK)

DOC_TITLE = "Police Bagage — User Manual"

def hf(c, doc):
    c.saveState(); w, h = A4
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.line(20*mm, h-15*mm, w-20*mm, h-15*mm); c.line(20*mm, 14*mm, w-20*mm, 14*mm)
    c.setFont("Helvetica", 8); c.setFillColor(GREY)
    c.drawString(20*mm, h-13.5*mm, "POLICE BAGAGE")
    c.drawRightString(w-20*mm, h-13.5*mm, "User Manual")
    c.drawString(20*mm, 10.5*mm, "ATS Handling — Kinshasa International Airport (FIH)")
    c.drawRightString(w-20*mm, 10.5*mm, "Page %d" % doc.page)
    c.restoreState()

def cover(c, doc):
    c.saveState(); w, h = A4
    c.setFillColor(NAVY); c.rect(0, h-95*mm, w, 95*mm, fill=1, stroke=0)
    c.setFillColor(BLUE); c.rect(0, h-97*mm, w, 2*mm, fill=1, stroke=0)
    c.setFillColor(LIGHT); c.rect(0, 0, w, 24*mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13); c.drawString(20*mm, h-32*mm, "ATS HANDLING")
    c.setFont("Helvetica", 10); c.drawString(20*mm, h-38*mm, "Kinshasa International Airport — FIH")
    c.setFont("Helvetica-Bold", 34); c.drawString(20*mm, h-60*mm, "Police Bagage")
    c.setFont("Helvetica", 15); c.drawString(20*mm, h-71*mm, "User and Training Manual")
    c.setFillColor(GREY); c.setFont("Helvetica", 10)
    c.drawString(20*mm, 16*mm, "Internal training document")
    c.drawRightString(w-20*mm, 16*mm, "Version 1.0 — June 2026")
    c.restoreState()

def info_box(text, title="KEY POINT", bg=INFOBG, bd=INFOBD):
    inner = [Paragraph("<b>%s</b>" % title, ParagraphStyle("ibt", parent=styles["Note"], textColor=NAVY, fontName="Helvetica-Bold", fontSize=9, spaceAfter=3)),
             Paragraph(text, styles["Note"])]
    t = Table([[inner]], colWidths=[170*mm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),bg),("BOX",(0,0),(-1,-1),0.8,bd),
        ("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]))
    return t
def warn_box(text, title="IMPORTANT"): return info_box(text, title=title, bg=WARNBG, bd=WARNBD)

def steps(items):
    return ListFlowable([ListItem(Paragraph(t, styles["Step"])) for t in items],
        bulletType="1", leftIndent=16, bulletFormat="%s.", bulletFontName="Helvetica-Bold",
        bulletColor=BLUE, spaceBefore=2, spaceAfter=8)
def bullets(items):
    return ListFlowable([ListItem(Paragraph(t, styles["Step"])) for t in items],
        bulletType="bullet", leftIndent=14, bulletColor=BLUE, start="square", spaceBefore=2, spaceAfter=8)
def table(headers, rows, widths):
    data = [[Paragraph(h, styles["CellH"]) for h in headers]] + [[Paragraph(str(c), styles["Cell"]) for c in r] for r in rows]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),NAVY),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,LIGHT]),("GRID",(0,0),(-1,-1),0.5,LINE),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
        ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)]))
    return t
def figure(path, width_mm, caption):
    img = RLImage(path); w = width_mm*mm; img.drawWidth = w; img.drawHeight = w*img.imageHeight/img.imageWidth
    img.hAlign = "CENTER"
    return KeepTogether([img, Paragraph(caption, styles["Cap"])])
def legend(items):
    rows = []
    for n, t in items:
        b = Paragraph('<font color="#FFFFFF"><b>%s</b></font>' % n, ParagraphStyle("ln", parent=styles["Leg"], alignment=TA_CENTER))
        cell = Table([[b]], colWidths=[7*mm], rowHeights=[7*mm])
        cell.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#E11D48")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
            ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),("TOPPADDING",(0,0),(-1,-1),0),
            ("BOTTOMPADDING",(0,0),(-1,-1),0),("ROUNDEDCORNERS",[4,4,4,4])]))
        rows.append([cell, Paragraph(t, styles["Leg"])])
    t = Table(rows, colWidths=[10*mm, 160*mm])
    t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(0,-1),0),("RIGHTPADDING",(0,0),(0,-1),4),
        ("TOPPADDING",(0,0),(-1,-1),3),("BOTTOMPADDING",(0,0),(-1,-1),3)]))
    return t
def h1(t): return Paragraph(t, styles["H1"])
def h2(t): return Paragraph(t, styles["H2"])
def h3(t): return Paragraph(t, styles["H3"])
def p(t): return Paragraph(t, styles["Body"])
def lead(t): return Paragraph(t, styles["Lead"])

NOTE = ("The application interface is in French. This manual gives the on-screen "
        "French labels together with their English meaning.")

story = [NextPageTemplate("body"), PageBreak()]

story += [h1("Contents")]
for it in ["1. About this manual", "2. System overview", "3. Roles and access",
           "4. Agent manual (mobile app)", "5. Supervisor manual (dashboard)",
           "6. Supervisor manual (disputes)", "7. Administrator manual (accounts)",
           "8. Passenger guide (tracking and flights)", "9. Understanding baggage statuses",
           "10. Anti-fraud rules", "11. Frequently asked questions", "12. Good practices"]:
    story.append(Paragraph(it, styles["TOCItem"]))
story.append(PageBreak())

# 1
story += [h1("1. About this manual"),
 lead("This manual supports the use of Police Bagage, the boarding-control and baggage anti-fraud "
      "platform of ATS Handling. It is intended for trained users: ramp agents, supervisors and "
      "administrators."),
 p("Each chapter describes, step by step, the operations to perform according to your role. The "
   "chapters about passengers can also serve as information material for the public."),
 info_box(NOTE),
 info_box("Keep this document at hand during training. Procedures must be followed in the indicated "
          "order, especially for baggage handling."),
 PageBreak()]

# 2
story += [h1("2. System overview"),
 p("Police Bagage covers the full journey of the passenger and their baggage, from check-in at the "
   "counter to loading into the aircraft hold, including boarding at the gate. The system detects "
   "fraud attempts in real time and provides supervisors with live monitoring and reports."),
 h2("Platform applications"),
 table(["Application", "For whom", "Main use"],
   [["Mobile app", "Ramp agents", "Scan boarding passes and baggage"],
    ["Dashboard", "Supervisors, admins", "Monitor activity, produce reports"],
    ["Disputes", "Supervisors", "Handle disputes and claims"],
    ["Baggage tracking", "Passengers", "Check a bag's status"],
    ["Today's flights", "Passengers", "Check flights and their status"]],
   [42*mm, 40*mm, 88*mm]),
 PageBreak()]

# 3
story += [h1("3. Roles and access"),
 p("Your role determines which applications you can access and which actions you can perform. Each "
   "user has a personal account created by an administrator."),
 table(["Role", "Access", "What you can do"],
   [["Administrator", "Dashboard", "Create and manage accounts; all supervisor actions"],
    ["Supervisor", "Dashboard, Disputes", "Monitor flights, change statuses, produce reports, handle disputes"],
    ["Agent", "Mobile app", "Scan, load into the hold, reroute"]],
   [38*mm, 42*mm, 90*mm]),
 warn_box("Never share your credentials. Any action performed from an account is the responsibility of "
          "its holder. If a device is lost or stolen, inform your supervisor immediately."),
 PageBreak()]

# 4 Agent
story += [h1("4. Agent manual (mobile app)"),
 lead("The mobile app runs on Zebra scanning terminals. The built-in reader sends scanned codes "
      "directly into the application."),
 h2("4.1 Logging in"),
 steps(["Open the Police Bagage app on the terminal.",
        "On first launch, the welcome screen appears; tap Commencer (Start).",
        "Enter your email address and password.",
        "Tap Se connecter (Sign in)."]),
 info_box("If the email is invalid, the field turns red. If the credentials are wrong, a clear "
          "message tells you. Check your entry and try again.", title="IF AN ERROR OCCURS"),
 h2("4.2 Selecting a flight"),
 steps(["After signing in, the list of today's flights appears.",
        "Select the flight assigned to you.",
        "The flight detail opens, with the available functions. Scroll to see all functions."]),
 figure("img/mobile_flight.png", 64, "Screen: flight detail and available functions"),
 legend([("1", "Check-in — register passengers by scanning their boarding pass."),
         ("2", "Bagages (Baggage) — confirm each bag on the belt (anti-fraud check)."),
         ("3", "Embarquement (Boarding) — confirm passengers at the gate."),
         ("4", "Charger (Load) — load all registered bags into the hold (bulk)."),
         ("5", "Rush — mark remaining bags for rerouting.")]),
 h2("4.3 Check-in: scanning boarding passes"),
 p("This function registers passengers from their boarding pass."),
 steps(["From the flight detail, tap Check-in.",
        "Scan the passenger's boarding pass.",
        "The passenger appears: name, seat, class, route and number of declared bags.",
        "Continue with the next passenger."]),
 warn_box("The number of bags declared on the boarding pass is authoritative. It determines how many "
          "bags will be allowed on the belt for that passenger."),
 h2("4.4 Baggage: scanning tags"),
 p("This function confirms each bag on the belt and automatically applies the anti-fraud check."),
 steps(["From the flight detail, tap Bagages (Baggage).",
        "Scan the bag tag.",
        "If the bag is allowed, it is confirmed and the counter increases.",
        "If the bag is rejected, a message states the reason. In case of fraud, an alert is sent to "
        "the supervisor immediately."]),
 figure("img/mobile_baggage.png", 64, "Screen: scanning a bag and the result"),
 legend([("1", "Scan area: aim at the tag; the result appears immediately."),
         ("2", "Last scan: the passenger and the confirmed-bag counter.")]),
 info_box("The baggage agent is never at fault. You scan what comes on the belt. A rejection means "
          "the supervisor must step in: never force a rejected bag through."),
 h2("4.5 Boarding: confirming passengers at the gate"),
 steps(["From the flight detail, tap Embarquement (Boarding).",
        "Scan the passenger's boarding pass at the gate.",
        "The passenger is marked as boarded; the remaining-passengers counter updates."]),
 figure("img/mobile_embarquement.png", 64, "Screen: boarding at the gate"),
 legend([("1", "Scan area: scan the boarding pass at the gate."),
         ("2", "Counter of passengers still to board.")]),
 h2("4.6 Load: loading bags into the hold"),
 p("This function loads, in a single operation, all registered bags that are not marked for "
   "rerouting. No scanning is required."),
 steps(["First mark remaining bags with the Rush function (see 4.7).",
        "From the flight detail, tap Charger (Load).",
        "Tap Charger les bagages (Load the bags).",
        "The number of bags loaded into the hold is shown, along with excluded (rush) bags and the "
        "total of registered bags."]),
 figure("img/mobile_charger.png", 64, "Screen: bulk loading into the hold"),
 legend([("1", "Charger les bagages button: sends everything else into the hold, no scanning."),
         ("2", "Result: number of bags loaded into the hold.")]),
 h2("4.7 Rush: marking bags for rerouting"),
 p("This function marks the remaining bags that could not be loaded and will be rerouted on the "
   "next flight."),
 steps(["From the flight detail, tap Rush.",
        "Scan each remaining bag to be rerouted.",
        "Each marked bag is confirmed on screen."]),
 figure("img/mobile_rush.png", 64, "Screen: marking bags for rerouting"),
 legend([("1", "Rush mode active: scan the remaining bags to reroute."),
         ("2", "Confirmation: bag marked for the next flight.")]),
 warn_box("Recommended order: first scan the Rush bags, then use Charger (Load) to send everything "
          "else into the hold. This way, rerouted bags are never loaded by mistake."),
 PageBreak()]

# 5 Supervisor dashboard
story += [h1("5. Supervisor manual (dashboard)"),
 lead("The web dashboard provides a real-time overview and lets you produce activity reports."),
 h2("5.1 Signing in"),
 steps(["Open the dashboard address in a browser.",
        "On the home page, click Se connecter (Sign in).",
        "Enter your credentials. Once signed in, you go straight to the dashboard on your next visits."]),
 h2("5.2 Reading the dashboard"),
 p("The overview shows today's flights, split into departures and arrivals, along with the key "
   "counters: number of flights, departures, arrivals and fraud alerts. Current alerts are highlighted."),
 figure("img/web_dashboard.png", 155, "Screen: dashboard (overview)"),
 legend([("1", "Navigation menu: Dashboard, Reports, and Accounts (admins)."),
         ("2", "Key counters, including today's fraud alerts."),
         ("3", "Flight cards: click to open a flight's detail.")]),
 h2("5.3 Viewing a flight's detail"),
 steps(["Click a flight to open its detail.",
        "Review the counters: passengers, boarded, confirmed bags, loaded in the hold, rerouting, and "
        "fraud alerts.",
        "The passenger list shows, for each one, the confirmed bags and the boarding status."]),
 h2("5.4 Changing a flight's status"),
 steps(["Open the flight detail.",
        "Select the desired status: Programmé (Scheduled), Embarquement (Boarding), Fermé (Closed) or "
        "Annulé (Cancelled).",
        "The status updates immediately, including for passengers on the public flights app."]),
 h2("5.5 Understanding fraud alerts"),
 p("Fraud alerts are flagged and displayed automatically. They serve as a record and a signal to act: "
   "send an agent to physically intercept the bag on the belt or at the indicated gate."),
 h2("5.6 Producing a report"),
 steps(["In the menu, open Rapports (Reports).",
        "Choose the period: Day, Week, Month, Year or Custom.",
        "For a custom period, set the start and end dates.",
        "Review the displayed statistics, then click Télécharger Excel (Download Excel)."]),
 figure("img/web_report.png", 155, "Screen: Reports page and period filter"),
 legend([("1", "Period tabs: Day, Week, Month, Year, Custom."),
         ("2", "Download Excel button: produces the report for the selected period.")]),
 info_box("The Excel file contains several sheets: a figures summary, the detail of flights, "
          "passengers, bags, and the list of fraud alerts for the period."),
 PageBreak()]

# 6 Disputes
story += [h1("6. Supervisor manual (disputes)"),
 lead("The disputes application lets you monitor baggage, open cases and handle claims submitted by "
      "passengers."),
 h2("6.1 Filtering baggage"),
 steps(["Open the disputes application and sign in.",
        "By default, the current day is shown. Choose another date if needed.",
        "Refine with the filters: flight, loading state and dispute status.",
        "Use search to find a tag, a serial number, a PNR or a passenger name."]),
 figure("img/litige.png", 155, "Screen: disputes application (list and filters)"),
 legend([("1", "Filters: search, flight, date and dispute status."),
         ("2", "Dispute status and a 'Passager' mark if the claim comes from a passenger."),
         ("3", "Rapport du jour (Daily report): downloads the day's disputes as Excel.")]),
 h2("6.2 Opening and tracking a dispute"),
 steps(["Click a bag to open its detail panel.",
        "Set the status (Ouvert/Open, En cours/In progress, Résolu/Resolved), the reason and notes.",
        "Save. The status is reflected in the tracking seen by the passenger."]),
 h2("6.3 Handling a passenger claim"),
 p("When a passenger reports a problem from the tracking app, a claim is created automatically and "
   "appears in the list, marked as coming from a passenger. Open it, handle it as a dispute and update "
   "the status."),
 h2("6.4 Downloading the daily report"),
 steps(["Click Rapport du jour (Daily report).",
        "The Excel file of the day's disputes is downloaded."]),
 PageBreak()]

# 7 Admin
story += [h1("7. Administrator manual (accounts)"),
 lead("Only administrators can create and view agent and supervisor accounts."),
 h2("7.1 Creating an account"),
 steps(["In the dashboard menu, open Comptes (Accounts).",
        "Enter the person's email, password and full name.",
        "Choose the role: Agent, Supervisor or Administrator.",
        "For an agent, set the assigned gate if needed.",
        "Confirm creation. The account is active immediately."]),
 info_box("Share the credentials securely and ask the person to keep them confidential."),
 warn_box("Grant the Administrator role sparingly: it gives access to managing all accounts."),
 PageBreak()]

# 8 Passenger
story += [h1("8. Passenger guide (tracking and flights)"),
 lead("These public applications require no account. This chapter can serve as information material for "
      "passengers."),
 h2("8.1 Tracking a bag"),
 steps(["Open the baggage tracking application.",
        "To see all your bags, enter your booking reference (PNR).",
        "To see a single bag, enter its tag number (ten digits).",
        "Check the status of each bag."]),
 figure("img/tracking.png", 150, "Screen: baggage tracking (search and result)"),
 legend([("1", "Search by PNR: shows all of the passenger's bags."),
         ("2", "Search by tag number: shows only that bag."),
         ("3", "Result: passenger, flight and status of each bag.")]),
 h2("8.2 Reporting a problem"),
 steps(["On the relevant bag, tap Signaler un problème (Report a problem).",
        "Choose the type of problem, describe it and leave a contact if you wish.",
        "Send. The claim is forwarded directly to the supervisor."]),
 h2("8.3 Viewing today's flights"),
 p("The today's-flights application shows only the current day's flights, with their status (Scheduled, "
   "Boarding, Closed, Cancelled) and a delay indication where relevant. Links give access to the "
   "official airport portal services."),
 figure("img/vols.png", 155, "Screen: today's flights (statuses and services)"),
 legend([("1", "Search a flight by its number."),
         ("2", "Flight status and a 'Retardé' (Delayed) indication where relevant."),
         ("3", "Links to the official airport portal (fih-rva.com).")]),
 PageBreak()]

# 9 Statuses
story += [h1("9. Understanding baggage statuses"),
 p("The bag goes through successive states, from least to most advanced. These statuses are visible to "
   "the passenger in the tracking application."),
 table(["Status", "Meaning"],
   [["En attente (Pending)", "Bag declared but tag not yet scanned on the belt."],
    ["Enregistré (Registered)", "Tag scanned on the belt; anti-fraud check passed."],
    ["Chargé en soute (Loaded)", "Bag loaded into the destination hold (Charger function)."],
    ["Réacheminement (Rerouting)", "Remaining bag to send on the next flight (Rush function)."]],
   [55*mm, 115*mm]),
 PageBreak()]

# 10 Anti-fraud
story += [h1("10. Anti-fraud rules"),
 p("The check applies when a bag tag is scanned. The following rules are automatic and can never be "
   "bypassed."),
 table(["Detected situation", "Decision", "Alert"],
   [["Passenger not registered for this flight", "Bag rejected", "Yes"],
    ["Zero bags declared on the boarding pass", "Bag rejected", "Yes"],
    ["Declared bag count exceeded", "Bag rejected", "Yes"],
    ["Tag already scanned on this flight", "Bag rejected", "No (duplicate)"],
    ["Bag belongs to another flight", "Bag rejected", "No"]],
   [86*mm, 44*mm, 40*mm]),
 info_box("Fraud originates at the check-in counter, where a tag may have been printed on a booking "
          "with no declared bag. The system intercepts the item before it goes into the hold and alerts "
          "the supervisor."),
 PageBreak()]

# 11 FAQ
story += [h1("11. Frequently asked questions")]
faq = [
 ("Scanning does not work on the terminal.",
  "Make sure you are on the correct scan screen (Check-in, Bagages, Embarquement or Rush) and that the "
  "reader is active. Try the scan again."),
 ("A bag is rejected although it seems normal.",
  "The rejection follows the anti-fraud rules. Do not force it. Report it to the supervisor, who will "
  "decide on the action to take."),
 ("I cannot see all the functions on the flight detail.",
  "Scroll down: all functions, including Charger and Rush, are accessible by scrolling."),
 ("The web page shows an error or does not load fully.",
  "Reload the page. If the problem persists after an update, clear the browser cache and reload."),
 ("A passenger cannot find their bag in tracking.",
  "Check that they enter the correct PNR or the correct ten-digit tag number. The bag only appears once "
  "registered on the belt."),
]
for q, a in faq:
    story.append(h3(q)); story.append(p(a))
story.append(PageBreak())

# 12 Good practices
story += [h1("12. Good practices"),
 bullets(["Sign in with your personal account only and sign out at the end of your shift.",
          "Never share your credentials.",
          "Follow the baggage order: scan on the belt, then Rush, then Charger.",
          "Never force a rejected bag: refer to the supervisor.",
          "Watch fraud alerts and act without delay.",
          "If a terminal is lost or stolen, inform your supervisor immediately to revoke access."]),
 Spacer(1, 10), HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=8),
 Paragraph("ATS Handling — Kinshasa International Airport (FIH). Internal training document.", styles["Foot"])]

doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm,
                      bottomMargin=18*mm, title=DOC_TITLE, author="ATS Handling")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="cover", frames=[frame], onPage=cover),
                      PageTemplate(id="body", frames=[frame], onPage=hf)])
doc.build(story)
print("OK", OUT)
