# -*- coding: utf-8 -*-
"""Contenu rédigé des manuels d'utilisation, portail par portail."""
from build_manuels import build

# ─────────────────────────────────────────────────────────────
# 1. VOLS : tableau des vols, grand public
# ─────────────────────────────────────────────────────────────
def manuel_vols():
    build(
        "Vols", "Manuel-Portail-Vols.pdf",
        "Consultation publique des vols du jour, au départ et à l'arrivée de votre ville.",
        [
            "Ce portail s'adresse aux <b>voyageurs et à leurs accompagnants</b>. Il ne demande "
            "aucun compte : il s'ouvre directement sur les vols du jour.",
            "Son principe : vous indiquez d'abord <b>où vous êtes</b>, puis le portail n'affiche "
            "que les vols qui vous concernent, ceux qui partent de votre aéroport et ceux qui y arrivent.",
            "Les informations se rafraîchissent automatiquement toutes les 30 secondes : "
            "statut du vol, ouverture et clôture de l'enregistrement.",
        ],
        [
            {
                "titre": "1. Choisir votre aéroport",
                "texte": [
                    "À la première visite, le portail demande dans quelle ville vous vous trouvez. "
                    "Les 19 aéroports desservis par Air Congo sont proposés, séparés en deux groupes : "
                    "les <b>lignes intérieures</b> de RD Congo et les <b>lignes internationales</b>.",
                    "Cliquez simplement sur votre ville. Le choix est mémorisé : aux visites suivantes, "
                    "le portail s'ouvre directement sur vos vols.",
                ],
                "image": "vols_1_selecteur",
                "ordre": ["titre", "domestique", "ville", "international"],
                "explications": {
                    "titre": "La question posée à l'ouverture du portail. Tant que vous n'avez pas répondu, aucun vol n'est affiché : le portail ne sait pas encore quels vols vous concernent.",
                    "domestique": "Les 13 aéroports desservis à l'intérieur de la RD Congo. Toutes ces lignes passent par Kinshasa (FIH), qui est le hub du réseau.",
                    "ville": "Chaque bouton porte le nom de la ville et son code aéroport à 3 lettres. Un simple clic suffit : le portail bascule aussitôt sur les vols de cette ville.",
                    "international": "Les 6 destinations hors RD Congo : Johannesburg, Entebbe, Douala, Cotonou, Dar es Salaam et Bruxelles.",
                },
                "legende_image": "Écran d'accueil : le choix de l'aéroport.",
                "note": "Vous pourrez changer d'aéroport à tout moment, sans perdre votre place.",
            },
            {
                "titre": "2. Lire le tableau des vols",
                "texte": [
                    "Une fois la ville choisie, les vols apparaissent en <b>deux tableaux distincts</b> : "
                    "les départs depuis votre aéroport, puis les arrivées à destination de votre aéroport. "
                    "Le chiffre à côté de chaque titre indique le nombre de vols concernés.",
                    "Chaque ligne donne l'heure, le numéro de vol, la route et le statut. "
                    "Pour un départ, une seconde ligne indique où en est l'enregistrement : "
                    "l'heure d'ouverture, l'heure limite de présentation, et le temps restant avant clôture.",
                ],
                "image": "vols_2_tableaux",
                "ordre": ["aeroport", "recherche", "changer", "departs", "carte", "arrivees"],
                "explications": {
                    "aeroport": "Rappelle la date du jour, l'aéroport que vous avez choisi et l'heure du dernier rafraîchissement. Les données se remettent à jour toutes les 30 secondes.",
                    "recherche": "Pour retrouver un vol précis sans parcourir les tableaux. Tapez le numéro (ET62, ET 062 ou 62) : les deux tableaux se filtrent en direct.",
                    "changer": "Revient au choix de l'aéroport. Utile si vous accompagnez quelqu'un dans une autre ville.",
                    "departs": "Les vols qui partent de votre aéroport. Le chiffre à côté du titre indique combien il y en a aujourd'hui.",
                    "carte": "Une ligne de vol : l'heure, le numéro, la route et le statut. En dessous, l'état de l'enregistrement : heure d'ouverture, heure limite de présentation et temps restant avant la clôture.",
                    "arrivees": "Les vols qui atterrissent à votre aéroport. Un vol en escale chez vous apparaît dans les deux tableaux, puisqu'il y arrive puis en repart.",
                },
                "legende_image": "Vue principale : départs et arrivées de l'aéroport choisi.",
                "apres": [
                    "<b>Cas particulier des escales.</b> Un vol qui fait escale dans votre ville y arrive "
                    "puis en repart : il apparaît donc logiquement dans les deux tableaux.",
                ],
                "note": "Les horaires sont donnés à titre indicatif et peuvent être ajustés par la compagnie.",
            },
        ],
    )


# ─────────────────────────────────────────────────────────────
# 2. TRACKING : suivi bagage, passager
# ─────────────────────────────────────────────────────────────
def manuel_tracking():
    build(
        "Suivi Bagages", "Manuel-Portail-Tracking.pdf",
        "Suivi public d'un bagage par le passager, et dépôt d'une réclamation.",
        [
            "Ce portail permet au <b>passager</b> de savoir où en est son bagage, sans passer par un guichet.",
            "Il est <b>bilingue</b> (français / anglais) : le sélecteur se trouve en haut à droite.",
        ],
        [
            {
                "titre": "1. Rechercher son bagage",
                "texte": [
                    "Le passager saisit soit son <b>PNR</b> (référence de réservation, 6 caractères, "
                    "figurant sur la carte d'embarquement), soit le <b>numéro d'étiquette</b> à 10 chiffres "
                    "collé sur le bagage au comptoir. L'un des deux suffit.",
                    "Les champs numéro de vol et date de départ sont facultatifs : ils servent à affiner "
                    "la recherche si le même PNR revient sur plusieurs vols.",
                ],
                "image": "tracking_1_accueil",
                "ordre": ["titre", "champ", "bouton"],
                "explications": {
                    "titre": "Le portail de suivi ne demande aucun compte : le passager consulte son bagage directement.",
                    "champ": "Saisissez soit le PNR (6 caractères, sur la carte d'embarquement), soit le numéro d'étiquette à 10 chiffres collé sur le bagage au comptoir. L'un des deux suffit.",
                    "bouton": "Lance la recherche. Les champs numéro de vol et date sont facultatifs : ils ne servent qu'à départager si le même PNR revient sur plusieurs vols.",
                },
                "legende_image": "Écran d'accueil du suivi bagage.",
            },
            {
                "titre": "2. Comprendre le résultat",
                "texte": [
                    "Le portail affiche le passager, son vol, sa route, puis la <b>liste de ses bagages</b> "
                    "avec l'étape atteinte par chacun. Le compteur en haut à droite indique combien de "
                    "bagages ont déjà été traités sur le total déclaré.",
                    "Le parcours d'un bagage comporte trois étapes : <b>En attente</b> (déclaré mais pas "
                    "encore scanné), <b>Enregistré</b> (étiquette scannée au tapis, contrôle anti-fraude "
                    "passé), puis <b>Chargé en soute</b> (embarqué pour la destination).",
                    "Un quatrième statut, <b>Réacheminement</b>, sort de ce parcours : il signale un bagage "
                    "resté au sol, qui partira sur le prochain vol.",
                ],
                "image": "tracking_2_resultat",
                "ordre": ["resultat", "statut", "reclamation"],
                "explications": {
                    "resultat": "Identité du passager, numéro de vol, route et date. Le compteur à droite indique combien de bagages ont déjà été traités sur le total déclaré.",
                    "statut": "L'étape atteinte par ce bagage. Le parcours va de En attente (déclaré, pas encore scanné) à Enregistré (étiquette scannée au tapis, contrôle anti-fraude passé) puis Chargé en soute. Les points reliés visualisent la progression.",
                    "reclamation": "À utiliser si le bagage est manquant, endommagé ou retardé. Le dossier créé arrive immédiatement chez le superviseur, dans le portail Litiges.",
                },
                "legende_image": "Résultat d'une recherche : état de chaque bagage.",
                "apres": [
                    "<b>Ouvrir une réclamation.</b> Si le bagage est manquant, endommagé ou retardé, "
                    "le bouton de réclamation crée un dossier directement visible par le superviseur "
                    "dans le portail Litiges.",
                ],
            },
        ],
    )


# ─────────────────────────────────────────────────────────────
# 3. WEB : dashboard superviseur / admin
# ─────────────────────────────────────────────────────────────
def manuel_web():
    build(
        "Supervision", "Manuel-Portail-Supervision.pdf",
        "Poste de travail du superviseur et de l'administrateur : vols, bagages, alertes, rapports, comptes.",
        [
            "Ce portail est le <b>poste de commande</b> de l'exploitation. Il est réservé aux rôles "
            "<b>superviseur</b> et <b>administrateur</b> ; les agents de terrain, eux, travaillent sur "
            "l'application mobile des PDA.",
            "Il donne une vision temps réel de la journée : vols, passagers enregistrés, bagages "
            "confirmés et bagages écartés par le contrôle anti-fraude.",
        ],
        [
            {
                "titre": "1. Se connecter",
                "texte": [
                    "L'accès se fait par email et mot de passe. Les comptes sont créés par un "
                    "administrateur depuis l'écran Comptes : il n'y a pas d'inscription libre.",
                ],
                "image": "web_0_login",
                "ordre": ["email", "motdepasse", "bouton"],
                "explications": {
                    "email": "L'adresse professionnelle associée à votre compte. Les comptes sont créés par un administrateur : il n'y a pas d'inscription libre.",
                    "motdepasse": "Votre mot de passe personnel. En cas d'oubli, seul un administrateur peut le réinitialiser.",
                    "bouton": "Ouvre la session et vous amène au tableau de bord.",
                },
                "legende_image": "Page de connexion du portail de supervision.",
                "note": "En cas d'oubli du mot de passe, contactez un administrateur : lui seul peut le réinitialiser.",
            },
            {
                "titre": "2. Le tableau de bord",
                "texte": [
                    "C'est l'écran d'accueil. Les quatre compteurs du haut résument la journée : "
                    "nombre de vols, départs, arrivées, et <b>bagages écartés</b>. Ce dernier passe en rouge "
                    "dès qu'il dépasse zéro.",
                    "En dessous, les vols du jour sont regroupés en départs et arrivées. Chaque carte "
                    "porte le numéro de vol, la route, l'heure et le statut. Un badge rouge signale "
                    "le nombre de bagages écartés sur ce vol précis.",
                ],
                "image": "web_1_dashboard",
                "ordre": ["navigation", "nouveau", "ecartes", "vol"],
                "explications": {
                    "navigation": "Les espaces du portail : tableau de bord, bagages, rapports, profil, et comptes pour les administrateurs. L'espace courant est surligné.",
                    "nouveau": "Crée un vol de la journée (numéro, route, horaires). Réservé aux profils autorisés.",
                    "ecartes": "Le nombre total de bagages refusés aujourd'hui par le contrôle anti-fraude, tous vols confondus. Il passe en rouge dès qu'il dépasse zéro. Volontairement, seul le compteur figure ici : le détail se consulte vol par vol.",
                    "vol": "Une carte par vol, avec le numéro, la route, l'heure et le statut. Le badge rouge indique combien de bagages ont été écartés sur ce vol. Cliquez sur la carte pour ouvrir le détail du vol et la liste de ses alertes.",
                },
                "legende_image": "Tableau de bord : la journée en un coup d'œil.",
                "apres": [
                    "<b>Le détail des alertes s'obtient en ouvrant le vol concerné.</b> La vue d'ensemble "
                    "n'affiche volontairement que le compteur : sur une journée chargée, une liste de "
                    "plusieurs centaines d'alertes serait illisible.",
                ],
            },
            {
                "titre": "3. Suivi des bagages",
                "texte": [
                    "Cet écran suit chaque bagage du vol sélectionné : étiquette, passager, et étape "
                    "atteinte : enregistré au tapis, contrôlé au rayon X, chargé en soute, ou marqué "
                    "pour réacheminement.",
                ],
                "image": "web_2_bagages",
                "ordre": ["titre", "filtres"],
                "explications": {
                    "titre": "L'espace de suivi bagage : chaque étiquette du vol, son passager et l'étape atteinte (enregistré au tapis, contrôlé au rayon X, chargé en soute, ou marqué pour réacheminement).",
                    "filtres": "Restreint la liste par vol, par étiquette ou par passager, pour retrouver un bagage précis sans faire défiler toute la journée.",
                },
                "legende_image": "Écran de suivi des bagages.",
            },
            {
                "titre": "4. Rapports",
                "texte": [
                    "Les rapports produisent un bilan exportable en Excel, par vol ou par période : "
                    "passagers enregistrés, bagages déclarés et confirmés, écarts constatés et alertes "
                    "de la journée. C'est le document à archiver en fin de journée.",
                ],
                "image": "web_3_rapport",
                "ordre": ["titre", "telecharger"],
                "explications": {
                    "titre": "L'espace des rapports. Il produit le bilan exportable en Excel, par vol ou par période : passagers enregistrés, bagages déclarés et confirmés, écarts constatés et alertes de la journée. C'est le document à archiver en fin de service.",
                },
                "legende_image": "Génération d'un rapport de journée.",
            },
            {
                "titre": "5. Gestion des comptes",
                "texte": [
                    "Réservé aux <b>administrateurs</b>. Le formulaire de gauche crée un compte : "
                    "nom, email, mot de passe, rôle et comptoir assigné. Le compte est actif immédiatement.",
                    "Trois rôles existent. L'<b>agent</b> n'accède qu'à l'application mobile de scan. "
                    "Le <b>superviseur</b> accède à ce portail, sauf à la gestion des comptes. "
                    "L'<b>administrateur</b> a tout, y compris la création et la suppression de comptes.",
                ],
                "image": "web_4_admin",
                "ordre": ["creation", "role", "valider"],
                "explications": {
                    "creation": "Le formulaire de création d'un compte : nom complet, email, mot de passe initial, rôle et comptoir assigné. Le compte est actif immédiatement, sans email de confirmation.",
                    "role": "Détermine à lui seul ce que la personne pourra voir et faire. Agent : uniquement l'application mobile de scan. Superviseur : ce portail, sauf la gestion des comptes. Administrateur : tout, y compris créer et supprimer des comptes. Vérifiez-le avant de valider.",
                    "valider": "Enregistre le compte. La personne peut se connecter aussitôt avec l'email et le mot de passe que vous venez de saisir.",
                },
                "legende_image": "Création d'un compte et liste des comptes existants.",
                "note": "Le rôle détermine à lui seul ce que la personne pourra voir et faire : vérifiez-le avant de valider.",
            },
        ],
    )


# ─────────────────────────────────────────────────────────────
# 4. LITIGE : dossiers de reclamation
# ─────────────────────────────────────────────────────────────
def manuel_litige():
    build(
        "Litiges", "Manuel-Portail-Litiges.pdf",
        "Traitement des litiges bagage et des réclamations passager.",
        [
            "Ce portail regroupe les <b>dossiers de litige</b> : bagages en anomalie relevés par "
            "l'exploitation, et réclamations déposées par les passagers depuis le portail de suivi.",
            "Il est réservé aux superviseurs et administrateurs.",
        ],
        [
            {
                "titre": "1. Se connecter",
                "texte": [
                    "Mêmes identifiants que le portail de supervision : les comptes sont communs.",
                ],
                "image": "litige_0_login",
                "ordre": ["email", "motdepasse", "bouton"],
                "explications": {
                    "email": "Les identifiants sont les mêmes que ceux du portail de supervision : les comptes sont communs aux deux portails.",
                    "motdepasse": "Votre mot de passe personnel.",
                    "bouton": "Ouvre la session et affiche la liste des dossiers de litige.",
                },
                "legende_image": "Page de connexion du portail Litiges.",
            },
            {
                "titre": "2. Traiter les dossiers",
                "texte": [
                    "La liste présente les bagages concernés avec leur étiquette, le vol, la route, "
                    "le passager et l'état du dossier. Les filtres permettent de se limiter à un jour, "
                    "un vol ou un statut.",
                    "Un dossier passe par trois états : <b>Ouvert</b> à sa création, <b>En cours</b> "
                    "pendant l'enquête, puis <b>Résolu</b> une fois le bagage retrouvé ou le litige clos. "
                    "Chaque changement est horodaté et attribué à son auteur.",
                    "Les réclamations arrivées du portail passager sont identifiées comme telles et "
                    "reprennent le message du passager ainsi que ses coordonnées.",
                ],
                "image": "litige_1_liste",
                "ordre": ["titre", "filtres"],
                "explications": {
                    "titre": "La liste des dossiers : bagages en anomalie relevés par l'exploitation, et réclamations déposées par les passagers depuis le portail de suivi. Chaque ligne porte l'étiquette, le vol, la route, le passager et l'état du dossier.",
                    "filtres": "Restreint la liste par jour, par vol ou par statut, pour se concentrer sur les dossiers encore ouverts.",
                },
                "legende_image": "Liste des dossiers de litige.",
                "note": "Les notes internes restent invisibles du passager : elles servent au suivi d'enquête.",
            },
        ],
    )


if __name__ == "__main__":
    print("Generation des manuels :")
    manuel_vols()
    manuel_tracking()
    manuel_web()
    manuel_litige()
