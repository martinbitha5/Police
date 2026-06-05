# -*- coding: utf-8 -*-
"""Generates the Police Bagage technical documentation (English) as a PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable, NextPageTemplate,
)

OUT = "Police-Bagage-Technical-Documentation-EN.pdf"
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
S("Mono", fontName="Courier", fontSize=8.6, leading=12, textColor=colors.white)

DOC_TITLE = "Police Bagage — Technical Documentation"

def hf(c, doc):
    c.saveState(); w, h = A4
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.line(20*mm, h-15*mm, w-20*mm, h-15*mm); c.line(20*mm, 14*mm, w-20*mm, 14*mm)
    c.setFont("Helvetica", 8); c.setFillColor(GREY)
    c.drawString(20*mm, h-13.5*mm, "POLICE BAGAGE")
    c.drawRightString(w-20*mm, h-13.5*mm, "Technical documentation")
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
    c.setFont("Helvetica-Bold", 32); c.drawString(20*mm, h-60*mm, "Police Bagage")
    c.setFont("Helvetica", 15); c.drawString(20*mm, h-71*mm, "Technical documentation")
    c.setFillColor(GREY); c.setFont("Helvetica", 10)
    c.drawString(20*mm, 16*mm, "Project reference document")
    c.drawRightString(w-20*mm, 16*mm, "Version 1.0 — June 2026")
    c.restoreState()

def h1(t): return Paragraph(t, styles["H1"])
def h2(t): return Paragraph(t, styles["H2"])
def p(t): return Paragraph(t, styles["Body"])
def lead(t): return Paragraph(t, styles["Lead"])
def bullets(items):
    return ListFlowable([ListItem(Paragraph(t, styles["Item"])) for t in items],
        bulletType="bullet", leftIndent=14, bulletColor=BLUE, start="square", spaceAfter=8)
def table(headers, rows, widths):
    data = [[Paragraph(x, styles["CellH"]) for x in headers]] + [[Paragraph(str(c), styles["Cell"]) for c in r] for r in rows]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),NAVY),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,LIGHT]),
        ("GRID",(0,0),(-1,-1),0.5,LINE),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),6),
        ("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)]))
    return t
def code(txt):
    t = Table([[Paragraph(txt.replace("\n","<br/>").replace(" ","&nbsp;"), styles["Mono"])]], colWidths=[170*mm])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#0F1B2E")),
        ("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]))
    return t

story = [NextPageTemplate("body"), PageBreak()]

story += [h1("Contents")]
for it in ["1. Overview", "2. Technical architecture", "3. Roles and permissions",
           "4. Data model", "5. Baggage life cycle", "6. Anti-fraud rules", "7. Applications",
           "8. Reports", "9. Deployment", "10. Security and privacy"]:
    story.append(Paragraph(it, styles["TOCItem"]))
story.append(PageBreak())

story += [h1("1. Overview"),
 lead("Police Bagage is a platform covering the full life cycle of the passenger and their baggage, "
      "from check-in at the counter to loading into the aircraft hold, including boarding at the gate. "
      "The system intercepts baggage-fraud attempts in real time and gives supervisors live monitoring "
      "and activity reports."),
 p("The platform consists of five applications and one application programming interface (API), built "
   "around a single database."),
 table(["Component", "Audience", "Role"],
   [["Mobile app", "Ramp agents", "Scan boarding passes and baggage on Zebra PDAs"],
    ["Web dashboard", "Supervisors, admins", "Live monitoring, reports, account management"],
    ["Disputes app", "Supervisors", "Handle baggage disputes and claims"],
    ["Baggage tracking", "Passengers (public)", "Check a bag's status"],
    ["Today's flights", "Passengers (public)", "Flight board and statuses"],
    ["API", "Internal apps", "Scan and anti-fraud logic"]],
   [42*mm, 40*mm, 88*mm]),
 PageBreak()]

story += [h1("2. Technical architecture"),
 p("The project is organised as a monorepo. Source code is shared across applications, ensuring "
   "consistency of types and business rules."),
 code("/\n  apps/\n    mobile/    React Native (Expo) app — Zebra agents\n"
      "    web/       Next.js dashboard — supervisors and admins\n"
      "    litige/    Next.js disputes app — supervisors\n"
      "    tracking/  Public Next.js bag tracking — passengers\n"
      "    vols/      Public Next.js today's flights — passengers\n"
      "  packages/\n    api/         Fastify service (scan, anti-fraud)\n"
      "    bcbp-parser/ Boarding pass and tag parsing\n"
      "    shared/      Shared types and rules\n"
      "  supabase/migrations/  Database schema"),
 Spacer(1, 6),
 h2("Technologies"),
 table(["Layer", "Technology"],
   [["Mobile app", "React Native, Expo, Expo Router"],
    ["Web apps", "Next.js (App Router), React"],
    ["API service", "Node.js, Fastify"],
    ["Database", "Supabase (PostgreSQL)"],
    ["Realtime and authentication", "Supabase Realtime, Supabase Auth"],
    ["Reports", "ExcelJS"]],
   [60*mm, 110*mm]),
 h2("Access separation"),
 bullets(["Public apps (tracking, flights) require no authentication; reads happen server-side with a "
          "service key, returning only non-sensitive data.",
          "Internal apps (dashboard, disputes) are protected by authentication; permissions are enforced "
          "by both the database and the interface.",
          "The mobile app talks to the database through the API service, which centralises the anti-fraud rules."]),
 PageBreak()]

story += [h1("3. Roles and permissions"),
 table(["Role", "Platform", "Permissions"],
   [["Administrator", "Web", "Create and manage accounts; all supervisor actions"],
    ["Supervisor", "Web, Disputes", "Dashboard, flight statuses, reports, disputes"],
    ["Agent", "Mobile", "Scan, load into the hold, reroute"]],
   [38*mm, 36*mm, 96*mm]),
 p("The account management page is strictly reserved for administrators. A supervisor attempting to "
   "access it is automatically redirected to the dashboard."),
 PageBreak()]

story += [h1("4. Data model"),
 table(["Table", "Main content"],
   [["profiles", "Users: name, role, assigned gate"],
    ["flights", "Flights: number, origin, destination, stops, times, date, status"],
    ["passengers", "Passengers: name, PNR, seat, class, declared bags, boarding"],
    ["passenger_legs", "Passenger legs (connecting flights)"],
    ["baggage", "Baggage: tag, serial, registered, loaded in hold, rush, timestamps"],
    ["fraud_alerts", "Fraud alerts: passenger, PNR, tag, reason, gate"],
    ["baggage_disputes", "Disputes and claims: status, reason, passenger origin"]],
   [42*mm, 128*mm]),
 p("Possible flight statuses are: Scheduled, Boarding, Closed and Cancelled. On the baggage table, "
   "three indicators summarise progress: registered on the belt, loaded into the hold, and marked for "
   "rerouting."),
 PageBreak()]

story += [h1("5. Baggage life cycle"),
 p("The bag goes through successive states. This sequence is central to the system and is reflected in "
   "the tracking offered to the passenger."),
 table(["State", "Meaning"],
   [["Pending", "Declared on the boarding pass, tag not yet scanned on the belt"],
    ["Registered", "Tag scanned on the belt, anti-fraud check passed"],
    ["Loaded in hold", "Bag loaded into the destination hold (Load function)"],
    ["Rerouting", "Remaining bag marked for the next flight (Rush function)"]],
   [45*mm, 125*mm]),
 p("Recommended operational flow: after scanning bags on the belt, the agent first scans the bags to be "
   "rerouted (Rush), then triggers the bulk loading of the remaining registered bags (Load)."),
 PageBreak()]

story += [h1("6. Anti-fraud rules"),
 p("The check applies when a bag tag is scanned. Five rejection rules are enforced and can never be "
   "bypassed."),
 table(["Detected situation", "Decision", "Alert"],
   [["Passenger not registered for this flight", "Bag rejected", "Yes"],
    ["Zero bags declared on the boarding pass", "Bag rejected", "Yes"],
    ["Declared bag count exceeded", "Bag rejected", "Yes"],
    ["Tag already scanned on this flight", "Bag rejected", "No (duplicate)"],
    ["Bag belongs to another flight", "Bag rejected", "No"]],
   [86*mm, 44*mm, 40*mm]),
 p("The baggage agent is never at fault: they scan what comes on the belt. Fraud originates at the "
   "check-in counter. The system intercepts the item before it goes into the hold and alerts the "
   "supervisor. Alerts are flagged and displayed, with no resolution workflow in the application: they "
   "serve as a record and a signal to act."),
 h2("Note on the shared airline code"),
 p("The numeric code 071 corresponds to both Ethiopian Airlines and Air Congo, which share the IATA "
   "code ET. This is not an anomaly. The system never relies on the airline code to link a bag to a "
   "passenger: the link key is always the serial number combined with the flight and the date."),
 PageBreak()]

story += [h1("7. Applications"),
 h2("Mobile app (agents)"),
 p("Intended for Zebra Android PDAs, it relies on DataWedge, which injects scans as keystrokes. Flow: "
   "sign in, select the flight, then five functions — Check-in, Baggage, Boarding, Load, Rush."),
 h2("Web dashboard (supervisors and administrators)"),
 bullets(["Overview of today's flights (departures and arrivals).",
          "Flight detail: passengers, boarding, confirmed bags, loaded in hold, rerouting, alerts.",
          "Flight status change; Reports page; Accounts page reserved for administrators."]),
 h2("Disputes app (supervisors)"),
 bullets(["Baggage list filterable by date, flight, loading and dispute status.",
          "Opening and tracking cases; receiving passenger claims; daily Excel report."]),
 h2("Tracking and Today's flights (passengers)"),
 bullets(["Tracking: search by PNR (all bags) or by tag (a single bag); problem reporting.",
          "Today's flights: board of the day's flights with status and estimated delay; links to the "
          "airport portal."]),
 PageBreak()]

story += [h1("8. Reports"),
 p("Two types of Excel report are produced by the dashboard."),
 bullets(["Flight report: full detail of a flight in five sheets — Summary, Passengers, Baggage, Fraud "
          "alerts, and statistics for the day.",
          "Period report: aggregated review over the chosen period (day, week, month, year or custom "
          "range) in five sheets. The accounting summary presents volumes, averages and rates."]),
 PageBreak()]

story += [h1("9. Deployment"),
 h2("Web applications"),
 p("The four web applications are deployed on Hostinger Cloud from independent GitHub repositories, with "
   "automatic deployment on the main branch (Next.js framework, npm package manager, Node 20 or later)."),
 table(["Application", "Repository", "Local port"],
   [["Dashboard", "police-web", "3000"], ["Baggage tracking", "police-tracking", "3002"],
    ["Disputes", "police-litige", "3003"], ["Today's flights", "police-vols", "3004"]],
   [55*mm, 75*mm, 40*mm]),
 p("Environment variables (Supabase address and keys, hub) are provided in the host configuration and "
   "are never written into the code. HTML pages are served without caching so they always reference the "
   "current version; static assets keep a long cache, and a recovery mechanism reloads the page in case "
   "of a stale resource after an update."),
 h2("API service and mobile app"),
 p("The API service is deployed separately on Hostinger Cloud from a standalone repository. The mobile "
   "app is built with Expo EAS and published on Google Play; the internal version number increments "
   "automatically on each build."),
 PageBreak()]

story += [h1("10. Security and privacy"),
 bullets(["Communications are encrypted end to end.",
          "Sensitive keys remain server-side and are never exposed to clients or written into the code.",
          "Public apps collect no personal data for commercial purposes and include no advertising trackers.",
          "Access to internal data is limited to authorised accounts.",
          "Anti-fraud rules cannot be bypassed by any role; any exception is a manual supervisor action."]),
 Spacer(1, 10), HRFlowable(width="100%", thickness=0.6, color=LINE, spaceAfter=8),
 Paragraph("ATS Handling — Kinshasa International Airport (FIH). Internal reference document.", styles["Foot"])]

doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm,
                      bottomMargin=18*mm, title=DOC_TITLE, author="ATS Handling")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="cover", frames=[frame], onPage=cover),
                      PageTemplate(id="body", frames=[frame], onPage=hf)])
doc.build(story)
print("OK", OUT)
