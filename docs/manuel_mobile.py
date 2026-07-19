# -*- coding: utf-8 -*-
"""Manuel d'utilisation de l'application mobile des agents."""
from build_manuels import build

AVERTISSEMENT = (
    "Les écrans reproduits dans ce manuel sont des représentations fidèles de "
    "l'application, réalisées à partir de son code et de sa charte graphique. "
    "Ce ne sont pas des photographies d'un appareil : les chiffres affichés sont "
    "des exemples."
)


def manuel_mobile():
    build(
        "Application agent", "Manuel-Application-Mobile.pdf",
        "Application de scan sur PDA Zebra, pour les agents d'embarquement et de piste.",
        [
            "Cette application équipe les <b>agents de terrain</b>. Elle sert à scanner les "
            "boarding pass et les étiquettes bagage à chaque étape du traitement d'un vol.",
            "Le scanner du PDA se comporte comme un clavier : il suffit que l'écran de scan soit "
            "ouvert, puis d'appuyer sur la gâchette. Il n'y a rien à saisir à la main et aucun "
            "champ où cliquer.",
            "Chaque poste de travail correspond à un moment précis du traitement. Utilisez celui "
            "qui correspond à votre position physique, comptoir, tapis, rayon X, piste ou porte.",
            AVERTISSEMENT,
        ],
        [
            {
                "titre": "1. Se connecter",
                "texte": [
                    "Votre compte est créé par un superviseur. Il n'y a pas d'inscription : "
                    "si vous n'avez pas d'identifiants, demandez-les à votre responsable.",
                    "La session reste ouverte entre deux utilisations. Vous n'avez donc pas à vous "
                    "reconnecter à chaque vol.",
                ],
                "image": "mob_0_login",
                "ordre": ["email", "pass", "btn"],
                "explications": {
                    "email": "L'adresse fournie par votre superviseur lors de la création du compte.",
                    "pass": "Votre mot de passe personnel. En cas d'oubli, seul un superviseur peut le réinitialiser.",
                    "btn": "Ouvre la session et affiche la liste des vols du jour.",
                },
                "legende_image": "Écran de connexion.",
                "note": "Si le message indique que le compte n'est pas activé, contactez votre superviseur.",
            },
            {
                "titre": "2. Choisir son vol",
                "texte": [
                    "L'application affiche les vols du jour de votre aéroport, classés par heure de "
                    "départ. Touchez le vol sur lequel vous êtes affecté.",
                    "Tout ce que vous scannerez ensuite sera rattaché à ce vol. Vérifiez le numéro "
                    "avant de commencer : un scan fait sur le mauvais vol sera refusé.",
                ],
                "image": "mob_1_vols",
                "ordre": ["vol"],
                "explications": {
                    "vol": "Une ligne par vol, avec l'heure de départ, le numéro et la route. Touchez la ligne pour ouvrir le vol.",
                },
                "legende_image": "Liste des vols du jour.",
            },
            {
                "titre": "3. Les postes de travail",
                "texte": [
                    "Une fois le vol ouvert, la carte du haut résume son avancement en temps réel. "
                    "En dessous, chaque carte correspond à un poste de travail.",
                    "Ces postes suivent l'ordre réel du traitement d'un bagage : enregistrement du "
                    "passager, scan au tapis, contrôle au rayon X, puis chargement.",
                ],
                "image": "mob_2_vol",
                "ordre": ["flight", "stats", "checkin", "bag", "dolly", "rush"],
                "explications": {
                    "flight": "Le vol en cours, sa route et ses horaires. Le statut indique si l'embarquement est ouvert ou la porte fermée.",
                    "stats": "L'avancement du vol : passagers enregistrés, bagages confirmés sur le total déclaré, et passagers déjà embarqués. Ces chiffres se mettent à jour tout seuls quand vos collègues scannent.",
                    "checkin": "Poste comptoir. Scan des boarding pass pour enregistrer les passagers et leurs bagages déclarés.",
                    "bag": "Poste tapis. Scan des étiquettes bagage. C'est ici que s'applique le contrôle anti-fraude.",
                    "dolly": "Poste rayon X. N'accepte que les bagages déjà enregistrés au tapis, avant de les tracter vers l'avion.",
                    "rush": "Bagages restés au sol, à réacheminer sur le prochain vol.",
                },
                "legende_image": "Écran du vol, avec les postes de travail.",
                "note": "Les postes Charger et Soute, plus bas sur le même écran, servent au chargement en soute.",
            },
            {
                "titre": "4. Check-in, enregistrer les passagers",
                "texte": [
                    "Scannez le code du boarding pass. L'application lit le nom, le siège, la classe "
                    "et surtout le <b>nombre de bagages déclarés</b>.",
                    "Ce nombre est la référence de tout le contrôle anti-fraude : au tapis, un "
                    "passager ne pourra pas faire passer plus de bagages qu'il n'en a déclaré ici.",
                ],
                "image": "mob_3_checkin",
                "ordre": ["head", "stage", "res"],
                "explications": {
                    "head": "Rappel du vol en cours et du poste actif. Vérifiez le numéro de vol avant de scanner.",
                    "stage": "La zone de scan. Laissez cet écran ouvert et appuyez sur la gâchette du PDA. Il n'y a rien à toucher entre deux passagers.",
                    "res": "Le dernier passager enregistré, avec son siège, sa classe et son nombre de bagages. Servez-vous en pour confirmer au passager que son enregistrement est pris en compte.",
                },
                "legende_image": "Poste Check-in.",
                "apres": [
                    "Si le message indique que le passager est déjà enregistré, c'est un double scan. "
                    "Rien n'est modifié, vous pouvez passer au suivant.",
                ],
            },
            {
                "titre": "5. Bagages, le contrôle anti-fraude",
                "texte": [
                    "Scannez chaque étiquette qui arrive sur le tapis. Si le bagage correspond à un "
                    "passager enregistré et qu'il lui reste du quota, il est accepté.",
                    "Sinon il est <b>refusé</b>, et le superviseur reçoit une alerte immédiate.",
                ],
                "image": "mob_4_bagages",
                "ordre": ["prog", "stage", "bad"],
                "explications": {
                    "prog": "Nombre de bagages déjà enregistrés sur le total déclaré pour ce vol. Il avance à chaque scan accepté.",
                    "stage": "La zone de scan. L'écran change de couleur et vibre différemment selon que le bagage est accepté ou refusé, ce qui permet de travailler sans lire à chaque fois.",
                    "bad": "Un refus. Le motif est affiché en clair. Ici, une étiquette a été émise pour un passager qui n'a déclaré aucun bagage.",
                },
                "legende_image": "Poste Bagages, exemple de refus.",
                "apres": [
                    "<b>Que faire en cas de refus.</b> Mettez le bagage de côté, ne le chargez pas, "
                    "et prévenez le superviseur. Il a déjà reçu l'alerte sur son écran et vous dira "
                    "quoi en faire.",
                    "<b>Vous n'êtes pas en cause.</b> Vous scannez ce qui arrive sur le tapis. "
                    "Un refus signale une étiquette émise au comptoir sur un dossier sans bagage "
                    "déclaré. Le rôle de l'application est justement d'arrêter ce colis avant la soute.",
                ],
                "note": "Un bagage déjà scanné qui repasse est simplement signalé comme doublon. Ce n'est pas une alerte.",
            },
            {
                "titre": "6. Dolly, le contrôle au rayon X",
                "texte": [
                    "À la sortie du rayon X, scannez chaque bagage avant de le charger sur le dolly.",
                    "Ce poste n'accepte que les bagages <b>déjà enregistrés au tapis</b>. Un bagage "
                    "inconnu ou jamais scanné est refusé : il ne doit pas partir vers l'avion.",
                ],
                "image": "mob_5_dolly",
                "ordre": ["head", "prog", "res"],
                "explications": {
                    "head": "Le poste Dolly, sur le vol en cours.",
                    "prog": "Progression du chargement du dolly. Le second chiffre est le nombre de bagages enregistrés sur ce vol : le dolly est complet quand les deux se rejoignent.",
                    "res": "Un bagage accepté, avec le nom du passager et le numéro d'étiquette. Vous pouvez le charger.",
                },
                "legende_image": "Poste Dolly.",
                "apres": [
                    "Attendez d'avoir le compte exact avant de tracter le dolly vers l'avion. "
                    "Tant que les deux chiffres diffèrent, des bagages enregistrés manquent encore.",
                ],
            },
            {
                "titre": "7. Soute, identifier le compartiment",
                "texte": [
                    "Choisissez d'abord le compartiment dans lequel vous chargez, puis scannez les "
                    "bagages qui y sont placés. Cela permet de retrouver un bagage précis à "
                    "l'arrivée sans vider tout l'avion.",
                ],
                "image": "mob_6_soute",
                "ordre": ["avant", "arriere"],
                "explications": {
                    "avant": "Compartiment avant de l'appareil.",
                    "arriere": "Compartiment arrière de l'appareil.",
                },
                "legende_image": "Choix du compartiment.",
                "note": "Vous pouvez changer de compartiment en cours de chargement, sans quitter le poste.",
            },
            {
                "titre": "8. Charger et Rush",
                "texte": [
                    "En fin de chargement, scannez d'abord les bagages <b>Rush</b>, ceux qui restent "
                    "au sol et partiront sur le vol suivant.",
                    "Utilisez ensuite <b>Charger</b> pour marquer d'un seul geste tous les bagages "
                    "enregistrés restants comme chargés en soute. Les bagages marqués Rush sont "
                    "automatiquement exclus.",
                ],
                "image": "mob_7_charger",
                "ordre": ["info", "btn"],
                "explications": {
                    "info": "Rappel de l'ordre des opérations. Le respecter évite de charger par erreur un bagage qui devait rester au sol.",
                    "btn": "Marque en soute tous les bagages enregistrés non-rush du vol. Le résultat indique combien ont été chargés et combien ont été exclus.",
                },
                "legende_image": "Poste Charger.",
            },
            {
                "titre": "9. Embarquement à la porte",
                "texte": [
                    "Scannez le boarding pass de chaque passager qui monte à bord. Le compteur "
                    "indique en permanence combien de passagers restent à embarquer.",
                    "Un passager qui n'a pas été enregistré au check-in est refusé : renvoyez-le "
                    "vers le comptoir.",
                ],
                "image": "mob_8_embarquement",
                "ordre": ["prog", "res"],
                "explications": {
                    "prog": "Passagers déjà embarqués sur le total enregistré, et le reste à embarquer. C'est le chiffre à surveiller avant la fermeture de la porte.",
                    "res": "Le dernier passager confirmé, avec son siège.",
                },
                "legende_image": "Poste Embarquement.",
                "note": "Un passager scanné deux fois est signalé comme déjà embarqué, sans être compté en double.",
            },
        ],
        strings={"scope": "{portal}", "running": "Police Bagage · Manuel agent"},
    )


if __name__ == "__main__":
    print("Generation du manuel mobile :")
    manuel_mobile()
