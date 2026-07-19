# -*- coding: utf-8 -*-
"""Field agent mobile application, user manual (English)."""
from build_manuels import build, STRINGS_EN

DISCLAIMER = (
    "The screens in this manual are faithful reproductions of the application, "
    "rebuilt from its source code and design system. They are not photographs of "
    "a device, and the figures shown are examples."
)

LANGUAGE_NOTE = (
    "The application interface is in <b>French</b>, the working language of the field "
    "agents. Screen labels therefore appear in French exactly as agents see them on "
    "the handheld, while this manual explains them in English."
)


def manual_mobile_en():
    build(
        "Field agent application", "Mobile-App-Manual-EN.pdf",
        "Scanning application on Zebra handhelds, for boarding and ramp agents.",
        [
            "This application equips <b>field agents</b>. It is used to scan boarding passes "
            "and baggage tags at every stage of handling a flight.",
            "The handheld scanner behaves like a keyboard: simply open the scanning screen and "
            "press the trigger. Nothing has to be typed and there is no field to tap.",
            "Each station matches a specific moment in the process. Use the one that matches "
            "your physical position: desk, belt, X-ray, ramp or gate.",
            LANGUAGE_NOTE,
            DISCLAIMER,
        ],
        [
            {
                "titre": "1. Signing in",
                "texte": [
                    "Your account is created by a supervisor. There is no self sign-up: if you have "
                    "no credentials, ask your manager.",
                    "The session stays open between uses, so you do not have to sign in again for "
                    "every flight.",
                ],
                "image": "mob_0_login",
                "ordre": ["email", "pass", "btn"],
                "libelles": {
                    "email": "Your agent login",
                    "pass": "Your password",
                    "btn": "Open the session",
                },
                "explications": {
                    "email": "The address your supervisor gave you when the account was created.",
                    "pass": "Your personal password. If you forget it, only a supervisor can reset it.",
                    "btn": "Opens the session and shows the flights of the day.",
                },
                "legende_image": "Sign-in screen.",
                "note": "If the message says the account is not active, contact your supervisor.",
            },
            {
                "titre": "2. Choosing your flight",
                "texte": [
                    "The application lists the flights of the day for your airport, sorted by "
                    "departure time. Tap the flight you are assigned to.",
                    "Everything you scan afterwards is attached to that flight. Check the number "
                    "before you start: a scan made on the wrong flight is rejected.",
                ],
                "image": "mob_1_vols",
                "ordre": ["vol"],
                "libelles": {"vol": "Pick your flight"},
                "explications": {
                    "vol": "One row per flight, with departure time, number and route. Tap the row to open the flight.",
                },
                "legende_image": "Flights of the day.",
            },
            {
                "titre": "3. The work stations",
                "texte": [
                    "Once the flight is open, the top card sums up its progress in real time. "
                    "Below it, each card is a work station.",
                    "The stations follow the real order in which a bag is handled: passenger "
                    "check-in, scan at the belt, X-ray screening, then loading.",
                ],
                "image": "mob_2_vol",
                "ordre": ["flight", "stats", "checkin", "bag", "dolly", "rush"],
                "libelles": {
                    "flight": "Current flight",
                    "stats": "Flight progress",
                    "checkin": "Check-in station",
                    "bag": "Baggage station",
                    "dolly": "Dolly station",
                    "rush": "Rush station",
                },
                "explications": {
                    "flight": "The flight in progress, its route and times. The status shows whether boarding is open or the gate closed.",
                    "stats": "Progress of the flight: registered passengers, confirmed bags against the declared total, and passengers already boarded. These figures update on their own as your colleagues scan.",
                    "checkin": "Desk station. Scanning boarding passes to register passengers and their declared bags.",
                    "bag": "Belt station. Scanning baggage tags. This is where the anti-fraud check applies.",
                    "dolly": "X-ray station. Accepts only bags already registered at the belt, before towing them to the aircraft.",
                    "rush": "Bags left on the ground, to be rerouted on the next flight.",
                },
                "legende_image": "Flight screen with the work stations.",
                "note": "The Charger and Soute stations, further down the same screen, are used for loading into the hold.",
            },
            {
                "titre": "4. Check-in, registering passengers",
                "texte": [
                    "Scan the boarding pass barcode. The application reads the name, seat, class and "
                    "above all the <b>number of declared bags</b>.",
                    "That number is the reference for the whole anti-fraud check: at the belt, a "
                    "passenger cannot put through more bags than declared here.",
                ],
                "image": "mob_3_checkin",
                "ordre": ["head", "stage", "res"],
                "libelles": {
                    "head": "Flight and active station",
                    "stage": "Scanning area",
                    "res": "Last registered passenger",
                },
                "explications": {
                    "head": "Reminder of the flight in progress and the active station. Check the flight number before scanning.",
                    "stage": "The scanning area. Leave this screen open and press the handheld trigger. Nothing needs tapping between two passengers.",
                    "res": "The last registered passenger, with seat, class and number of bags. Use it to confirm to the passenger that check-in went through.",
                },
                "legende_image": "Check-in station.",
                "apres": [
                    "If the message says the passenger is already registered, it is a double scan. "
                    "Nothing is changed and you can move on to the next one.",
                ],
            },
            {
                "titre": "5. Baggage, the anti-fraud check",
                "texte": [
                    "Scan every tag arriving on the belt. If the bag matches a registered passenger "
                    "who still has quota left, it is accepted.",
                    "Otherwise it is <b>rejected</b>, and the supervisor gets an immediate alert.",
                ],
                "image": "mob_4_bagages",
                "ordre": ["prog", "stage", "bad"],
                "libelles": {
                    "prog": "Bags registered on this flight",
                    "stage": "Scanning area",
                    "bad": "Rejected bag",
                },
                "explications": {
                    "prog": "Bags already registered against the declared total for this flight. It moves up with every accepted scan.",
                    "stage": "The scanning area. The screen changes colour and vibrates differently depending on whether the bag is accepted or rejected, so you can work without reading every time.",
                    "bad": "A rejection. The reason is spelled out. Here, a tag was issued for a passenger who declared no baggage at all.",
                },
                "legende_image": "Baggage station, example of a rejection.",
                "apres": [
                    "<b>What to do on a rejection.</b> Set the bag aside, do not load it, and tell "
                    "the supervisor. They already received the alert on screen and will tell you "
                    "what to do with it.",
                    "<b>You are not at fault.</b> You scan what reaches the belt. A rejection points "
                    "to a tag issued at the check-in desk against a booking with no declared bag. "
                    "The whole purpose of the application is to stop that parcel before the hold.",
                ],
                "note": "A bag already scanned that comes round again is simply flagged as a duplicate. It is not an alert.",
            },
            {
                "titre": "6. Dolly, the X-ray checkpoint",
                "texte": [
                    "As bags leave the X-ray, scan each one before loading it onto the dolly.",
                    "This station accepts only bags <b>already registered at the belt</b>. An unknown "
                    "or never scanned bag is rejected: it must not travel to the aircraft.",
                ],
                "image": "mob_5_dolly",
                "ordre": ["head", "prog", "res"],
                "libelles": {
                    "head": "Dolly station",
                    "prog": "Dolly progress",
                    "res": "Accepted bag",
                },
                "explications": {
                    "head": "The Dolly station, on the flight in progress.",
                    "prog": "Progress of the dolly. The second figure is the number of bags registered on this flight: the dolly is complete when both figures meet.",
                    "res": "An accepted bag, with the passenger name and the tag number. You can load it.",
                },
                "legende_image": "Dolly station.",
                "apres": [
                    "Wait until the count matches before towing the dolly to the aircraft. As long "
                    "as the two figures differ, registered bags are still missing.",
                ],
            },
            {
                "titre": "7. Hold position",
                "texte": [
                    "First choose the compartment you are loading into, then scan the bags placed "
                    "there. This makes it possible to find a specific bag on arrival without "
                    "emptying the whole aircraft.",
                ],
                "image": "mob_6_soute",
                "ordre": ["avant", "arriere"],
                "libelles": {"avant": "Forward hold", "arriere": "Aft hold"},
                "explications": {
                    "avant": "Forward compartment of the aircraft.",
                    "arriere": "Aft compartment of the aircraft.",
                },
                "legende_image": "Choosing the compartment.",
                "note": "You can switch compartment while loading, without leaving the station.",
            },
            {
                "titre": "8. Loading and Rush",
                "texte": [
                    "At the end of loading, first scan the <b>Rush</b> bags, the ones staying on the "
                    "ground that will travel on the next flight.",
                    "Then use <b>Charger</b> to mark every remaining registered bag as loaded in the "
                    "hold, in one action. Bags marked Rush are automatically excluded.",
                ],
                "image": "mob_7_charger",
                "ordre": ["info", "btn"],
                "libelles": {"info": "Order of operations", "btn": "Load in one action"},
                "explications": {
                    "info": "Reminder of the order of operations. Following it avoids loading by mistake a bag that was meant to stay on the ground.",
                    "btn": "Marks every registered non rush bag on the flight as loaded. The result shows how many were loaded and how many were excluded.",
                },
                "legende_image": "Loading station.",
            },
            {
                "titre": "9. Boarding at the gate",
                "texte": [
                    "Scan the boarding pass of every passenger stepping on board. The counter always "
                    "shows how many passengers are left to board.",
                    "A passenger who was not registered at check-in is rejected: send them back to "
                    "the desk.",
                ],
                "image": "mob_8_embarquement",
                "ordre": ["prog", "res"],
                "libelles": {"prog": "Left to board", "res": "Boarded passenger"},
                "explications": {
                    "prog": "Passengers already boarded against the registered total, and how many are left. This is the figure to watch before closing the gate.",
                    "res": "The last confirmed passenger, with their seat.",
                },
                "legende_image": "Boarding station.",
                "note": "A passenger scanned twice is flagged as already boarded, without being counted twice.",
            },
        ],
        strings={**STRINGS_EN, "scope": "{portal}", "running": "Police Bagage · Field agent manual"},
    )


if __name__ == "__main__":
    print("Building the English mobile manual:")
    manual_mobile_en()
