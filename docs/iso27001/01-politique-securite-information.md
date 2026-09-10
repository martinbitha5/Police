# Politique de sécurité de l'information

- Organisation : African Transport Systems (ATS Handling)
- Périmètre : le Centre des Solutions Informatiques (CSI) d'ATS, toutes activités, siège et escales (voir PC-00)
- Référence : PSI-01
- Version : 0.1 (projet)
- Date : 2026-09-07
- Propriétaire du document : Direction Générale d'ATS
- Contrôle ISO/IEC 27001:2022 : Clause 5.2, A.5.1
- Statut : projet à valider par la direction

> Les champs marqués « à définir » attendent une décision de la direction. Ce
> document est un premier jet destiné à être revu, complété puis approuvé
> formellement (date, signataire).

## Comment utiliser ce document

Ce document est l'engagement de la direction sur la sécurité. C'est le texte de référence dont tous les autres découlent. La Direction Générale le lit, vérifie les rôles et les principes qu'il fixe, puis l'approuve et le signe en dernière page. La prochaine étape consiste à faire approuver et signer ce document par le Directeur Général.

## 1. Objet

Cette politique fixe l'engagement d'African Transport Systems (ATS) à protéger la
confidentialité, l'intégrité et la disponibilité des informations traitées par son
Centre des Solutions Informatiques (CSI) : les services informatiques rendus aux
compagnies aériennes partenaires sur les escales, la connectivité de ces escales, les
produits numériques d'ATS dont la plateforme Police Bagage, et l'informatique interne.
Sont particulièrement concernées les données de vol des compagnies, les données
personnelles des passagers et les données anti-fraude bagages.

## 2. Périmètre

Le périmètre du SMSI est le Centre des Solutions Informatiques (CSI) d'ATS dans
l'ensemble de ses activités, depuis le siège de Kinshasa et les escales de Kinshasa,
Lubumbashi, Gemena, Mbuji-Mayi, Kisangani et Kananga. Il est décrit en détail dans le
document PC-00 (Périmètre et contexte du SMSI). En résumé, le SMSI couvre :

- Les services informatiques aux compagnies aériennes partenaires : préparation et test
  des postes et logiciels d'enregistrement avant chaque vol, assistance, présence d'un
  informaticien du CSI sur chaque vol, sur du matériel appartenant aux compagnies.
- La connectivité Internet des escales (liaisons Starlink et réseaux d'escale).
- Les produits numériques d'ATS, dont la plateforme Police Bagage (application mobile,
  tableau de bord, portails publics, API), ses services Supabase, son hébergement et
  ses dépôts de code.
- L'informatique interne d'ATS (postes, messagerie, réseau du siège).
- Les comptes et rôles associés, et les terminaux d'exploitation (PDA, postes).

Les autres métiers d'ATS (assistance au sol, fret, manutention, sûreté physique,
catering) sont hors périmètre à ce stade et pourront être intégrés ultérieurement.

## 3. Objectifs de sécurité

1. Empêcher tout accès non autorisé aux données passagers (nom, PNR, itinéraire).
2. Garantir que la logique anti-fraude ne peut être contournée, et que les alertes
   et preuves associées sont inaltérables.
3. Assurer le cloisonnement strict des données entre compagnies et aéroports.
4. Maintenir la disponibilité du service pendant les fenêtres d'embarquement.
5. Pouvoir restaurer les données en cas d'incident, dans des délais définis.
6. Garantir que les postes d'enregistrement et la connectivité des compagnies sont
   prêts et disponibles avant et pendant chaque vol.
7. Protéger le matériel des compagnies confié au CSI et n'en faire qu'un usage autorisé.

Des indicateurs mesurables seront associés à chaque objectif (à définir lors de
la première revue de direction, voir RD-05).

## 4. Principes

- **Moindre privilège.** Chaque rôle n'a que les accès nécessaires. L'écriture
  opérationnelle passe par l'API ; les rôles terrain n'écrivent pas en base en direct.
- **Défense en profondeur.** Les contrôles existent côté serveur (RLS, API) et pas
  seulement côté interface.
- **Identité vérifiée.** L'identité de l'utilisateur est dérivée de jetons validés,
  jamais du contenu envoyé par le client.
- **Secrets confinés.** La clé de service (service_role) ne quitte jamais le serveur.
- **Traçabilité.** Les actions sensibles sont journalisées de façon fiable.
- **Sécurité intégrée au développement.** Revue, tests et analyse de vulnérabilités
  avant mise en production.

## 5. Rôles et responsabilités

| Rôle | Responsabilité sécurité | Titulaire |
|---|---|---|
| Direction Générale | Approuve la politique, fournit les ressources, préside la revue de direction | Michel TSHEFU, Directeur Général |
| Responsable de la sécurité de l'information | Pilote le SMSI, le registre des risques et les audits ; dirige le CSI | Aristarque Kasonga, Responsable Informatique |
| Administrateur système et développeur | Développement sécurisé, correctifs, migrations, gestion des comptes, exploitation des plateformes | Martin Bitha, Développeur Full Stack |
| Informaticien d'escale | Préparation et test des postes des compagnies, connectivité, garde du matériel confié, signalement des incidents | informaticiens du CSI |
| Superviseur | Traitement des alertes, gestion des litiges | équipe supervision |
| Agent | Scan terrain, signalement des incidents | équipe agents |

## 6. Conformité et exigences légales

ATS respecte, pour les traitements du CSI et notamment ceux de la plateforme Police
Bagage, les obligations applicables en matière de protection des données personnelles
des passagers (base légale, minimisation, conservation), les engagements pris envers
les compagnies partenaires et les exigences de l'autorité de l'aviation civile. Le registre des obligations
légales et réglementaires est à établir (A.5.31).

## 7. Gestion des manquements

Tout manquement à cette politique fait l'objet d'un traitement proportionné,
selon le processus disciplinaire (A.6.4, à définir). Les incidents sont gérés
selon la procédure PGI-04.

## 8. Revue

Cette politique est revue au moins une fois par an et après tout changement majeur
(nouvel environnement, incident significatif, évolution multi-compagnies).

