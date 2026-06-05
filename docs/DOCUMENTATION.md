# Police Bagage — Documentation technique

Système de gestion d'embarquement et de lutte contre la fraude bagages pour
l'Aéroport International de Kinshasa (FIH), exploité par ATS Handling.

Version du document : 1.0
Dernière mise à jour : juin 2026

---

## 1. Présentation générale

Police Bagage est une plateforme complète qui couvre le cycle de vie du
passager et de son bagage, depuis l'enregistrement au comptoir jusqu'au
chargement en soute, en passant par l'embarquement à la porte. Le système
intercepte en temps réel les tentatives de fraude bagage (colis non déclarés
glissés en soute) et fournit aux superviseurs un suivi en direct ainsi que des
rapports d'activité.

La plateforme se compose de cinq applications et d'un service d'interface de
programmation (API), articulés autour d'une base de données unique.

| Composant | Public visé | Rôle |
|---|---|---|
| Application mobile | Agents de piste | Scan des boarding pass et des bagages sur PDA Zebra |
| Tableau de bord web | Superviseurs et administrateurs | Suivi temps réel, rapports, gestion des comptes |
| Application litige | Superviseurs | Traitement des litiges et réclamations bagage |
| Suivi bagage (tracking) | Passagers (public) | Consultation de l'état d'un bagage |
| Vols du jour | Passagers (public) | Tableau des vols et de leur statut |
| API | Applications internes | Logique de scan et anti-fraude |

---

## 2. Architecture technique

### 2.1 Vue d'ensemble

Le projet est organisé en monorepo (Turborepo). Le code source est partagé
entre toutes les applications, ce qui garantit la cohérence des types et des
règles métier.

```
/
├── apps/
│   ├── mobile/      Application React Native (Expo) — agents Zebra
│   ├── web/         Tableau de bord Next.js — superviseurs et admins
│   ├── litige/      Application litiges Next.js — superviseurs
│   ├── tracking/    Suivi bagage public Next.js — passagers
│   └── vols/        Vols du jour public Next.js — passagers
├── packages/
│   ├── api/         Service Fastify (logique de scan et anti-fraude)
│   ├── bcbp-parser/ Analyse des boarding pass et étiquettes bagage
│   └── shared/      Types et règles métier partagés
└── supabase/
    └── migrations/  Schéma et évolutions de la base de données
```

### 2.2 Technologies

| Couche | Technologie |
|---|---|
| Application mobile | React Native, Expo, Expo Router |
| Applications web | Next.js (App Router), React |
| Service API | Node.js, Fastify |
| Base de données | Supabase (PostgreSQL) |
| Temps réel | Supabase Realtime |
| Authentification | Supabase Auth |
| Analyse boarding pass | Bibliothèque IATA BCBP |
| Analyse étiquette bagage | Fonction interne dédiée |
| Génération de rapports | ExcelJS |

### 2.3 Principe de séparation des accès

- Les applications publiques (tracking, vols) ne demandent aucune
  authentification. La lecture des données s'effectue côté serveur avec une
  clé de service, en ne renvoyant que des informations non sensibles. Aucune
  écriture anonyme directe n'est ouverte sur la base.
- Les applications internes (web, litige) sont protégées par authentification.
  Les droits sont vérifiés à la fois par les règles de sécurité de la base et
  par l'interface.
- L'application mobile communique avec la base par l'intermédiaire du service
  API, qui applique les règles anti-fraude de manière centralisée.

---

## 3. Rôles et permissions

Trois rôles structurent l'accès à la plateforme.

| Rôle | Plateforme | Permissions |
|---|---|---|
| Administrateur | Web | Créer et gérer les comptes agents et superviseurs ; tout ce que fait un superviseur |
| Superviseur | Web, Litige | Tableau de bord, statuts de vol, rapports, traitement des litiges |
| Agent | Mobile | Scan des boarding pass et des étiquettes bagage, chargement et réacheminement |

La page de gestion des comptes est strictement réservée aux administrateurs.
Un superviseur qui tenterait d'y accéder est automatiquement redirigé vers le
tableau de bord.

---

## 4. Modèle de données

Les tables principales de la base de données sont les suivantes.

### profiles
Profils des utilisateurs (agents, superviseurs, administrateurs) reliés au
système d'authentification. Champs principaux : nom complet, rôle, porte
assignée.

### flights
Vols du jour. Champs principaux : numéro de vol, origine, destination,
escales, heures de départ et d'arrivée, date, et statut.
Statuts possibles : Programmé, Embarquement, Fermé, Annulé.

### passengers
Passagers enregistrés au check-in. Champs principaux : nom, référence de
réservation (PNR), siège, classe, nombre de bagages déclarés, indicateur
d'embarquement. La combinaison du PNR et du siège identifie un passager sur
un vol.

### passenger_legs
Escales d'un passager pour les vols avec transit, conservées dans l'ordre du
trajet.

### baggage
Bagages. Champs principaux : numéro d'étiquette (unique), numéro de série,
indicateurs d'enregistrement (is_confirmed), de chargement en soute (in_hold)
et de réacheminement (rush), avec les horodatages et auteurs associés.

### fraud_alerts
Alertes de fraude générées automatiquement lors d'un scan suspect. Champs
principaux : passager, PNR, étiquette, motif, porte, date.

### baggage_disputes
Dossiers de litige et réclamations bagage. Champs principaux : bagage
concerné, statut (Ouvert, En cours, Résolu), motif, notes, et indicateur
précisant si la réclamation provient d'un passager.

---

## 5. Cycle de vie du bagage

Le bagage passe par plusieurs états successifs. Cet enchaînement est au cœur
du système et se reflète dans le suivi proposé au passager.

1. **En attente** — Le bagage est déclaré au boarding pass mais son étiquette
   n'a pas encore été scannée au tapis.
2. **Enregistré** — L'étiquette physique a été scannée au tapis. Le contrôle
   anti-fraude a été appliqué avec succès.
3. **Chargé en soute** — Le bagage a été physiquement chargé dans la soute de
   l'avion à destination, via la fonction Charger.
4. **Réacheminement** — Le bagage restant n'a pas pu être chargé et a été
   marqué pour être réacheminé sur le prochain vol, via la fonction Rush.

Le déroulement opérationnel recommandé est le suivant : après le scan des
bagages au tapis, l'agent scanne d'abord les bagages à réacheminer (Rush),
puis déclenche le chargement groupé de tous les bagages enregistrés restants
(Charger).

---

## 6. Règles anti-fraude

Le contrôle anti-fraude s'applique au moment du scan d'une étiquette bagage.
Cinq règles de rejet sont appliquées et ne sont jamais contournables.

1. **Passager non enregistré** — L'étiquette ne correspond à aucun passager
   enregistré pour ce vol. Bagage rejeté, alerte créée.
2. **Zéro bagage déclaré** — Le passager a déclaré zéro bagage sur son
   boarding pass. Bagage rejeté, alerte créée.
3. **Quota dépassé** — Le nombre de bagages confirmés atteint déjà le nombre
   déclaré. Bagage rejeté, alerte créée.
4. **Étiquette déjà scannée** — L'étiquette a déjà été confirmée sur ce vol.
   Bagage rejeté, sans alerte (simple doublon de scan).
5. **Mauvais vol** — Le bagage appartient à un autre vol. Bagage rejeté.

L'agent bagage n'est jamais en faute : il scanne ce qui se présente sur le
tapis. La fraude provient du comptoir d'enregistrement. Le système intercepte
le colis avant son départ en soute et alerte le superviseur pour une
intervention physique. Les alertes sont signalées et affichées, sans
procédure de résolution dans l'application : elles servent de trace et de
signal d'intervention.

### Note sur le code compagnie partagé

Le code numérique 071 correspond à la fois à Ethiopian Airlines et à Air
Congo, qui partagent le code IATA ET. Ce n'est pas une anomalie. Le système ne
se fonde jamais sur le code compagnie pour relier un bagage à un passager. La
clé de liaison est toujours le numéro de série combiné au vol et à la date.

---

## 7. Applications

### 7.1 Application mobile (agents)

Destinée aux PDA Zebra Android, elle s'appuie sur DataWedge qui injecte les
scans comme des frappes clavier ; aucun matériel spécifique n'est requis côté
logiciel.

Parcours de l'agent :
- Connexion avec identifiants nominatifs.
- Sélection du vol assigné parmi les vols du jour.
- Cinq fonctions disponibles : Check-in, Bagages, Embarquement, Charger, Rush.

### 7.2 Tableau de bord web (superviseurs et administrateurs)

- Vue d'ensemble des vols du jour, séparés en départs et arrivées.
- Détail d'un vol : passagers, embarquement, bagages confirmés, bagages
  chargés en soute, bagages en réacheminement, alertes fraude.
- Changement de statut d'un vol.
- Page Rapports avec filtre par jour, semaine, mois, année ou période
  personnalisée, statistiques affichées et export Excel.
- Page Comptes réservée aux administrateurs.

### 7.3 Application litige (superviseurs)

- Liste des bagages filtrable par date, vol, état de chargement et statut de
  litige.
- Ouverture et suivi des dossiers de litige.
- Réception automatique des réclamations soumises par les passagers depuis
  l'application de suivi.
- Rapport journalier téléchargeable au format Excel.

### 7.4 Suivi bagage public (passagers)

- Recherche par référence de réservation (PNR) : affiche tous les bagages du
  passager avec leur statut.
- Recherche par numéro d'étiquette : affiche uniquement le bagage concerné.
- Possibilité de signaler un problème, qui crée une réclamation transmise
  directement à l'application litige.
- Liens vers le portail officiel de l'aéroport.

### 7.5 Vols du jour public (passagers)

- Tableau des vols du jour uniquement, avec bascule automatique au changement
  de journée.
- Statut de chaque vol et indication de retard estimé.
- Liens vers les services du portail officiel de l'aéroport.

---

## 8. Rapports

Deux types de rapports Excel sont produits par le tableau de bord.

**Rapport de vol** : détail complet d'un vol, organisé en cinq feuilles —
Résumé, Passagers, Bagages, Alertes fraude, et statistiques de la journée.

**Rapport de période** : bilan agrégé sur la période choisie (jour, semaine,
mois, année ou plage personnalisée), organisé en cinq feuilles — Résumé
comptable, Vols, Passagers, Bagages et Alertes fraude. Le résumé comptable
présente les volumes, les moyennes et les taux (embarquement, confirmation,
alerte).

---

## 9. Déploiement

### 9.1 Applications web

Les quatre applications web sont déployées sur Hostinger Cloud à partir de
dépôts GitHub autonomes et indépendants, connectés en déploiement automatique
sur la branche principale.

| Application | Dépôt | Port local |
|---|---|---|
| Tableau de bord | police-web | 3000 |
| Suivi bagage | police-tracking | 3002 |
| Litige | police-litige | 3003 |
| Vols du jour | police-vols | 3004 |

Réglages de déploiement : cadre Next.js, commande de compilation standard,
gestionnaire de paquets npm, version de Node 20 ou supérieure.

Les variables d'environnement (adresse et clés Supabase, hub) sont fournies
dans la configuration de l'hébergeur et ne sont jamais inscrites dans le code.

Les pages HTML sont servies sans mise en cache afin de garantir qu'elles
référencent toujours la version courante de l'application ; les ressources
statiques conservent un cache long. Un mécanisme de récupération recharge
automatiquement la page en cas de ressource obsolète après une mise à jour.

### 9.2 Service API

Le service API est déployé séparément sur Hostinger Cloud à partir d'un dépôt
autonome. Les variables d'environnement sont fournies par l'hébergeur.

### 9.3 Application mobile

L'application mobile est compilée via Expo EAS et publiée sur Google Play. Le
numéro de version interne s'incrémente automatiquement à chaque compilation.

---

## 10. Sécurité et confidentialité

- Les échanges sont chiffrés de bout en bout.
- Les clés sensibles restent côté serveur et ne sont jamais exposées aux
  applications clientes ni inscrites dans le code source.
- Les applications publiques ne collectent aucune donnée personnelle à des
  fins commerciales et n'intègrent aucun traceur publicitaire.
- L'accès aux données internes est limité aux comptes habilités.
- Les règles anti-fraude ne peuvent être contournées par aucun rôle ; toute
  exception relève d'une intervention manuelle du superviseur.

---

Fin du document.
