# Politique de sécurité de l'information

- Organisation : Police Bagage
- Référence : PSI-01
- Version : 0.1 (projet)
- Date : 2026-09-07
- Propriétaire du document : Direction Police Bagage
- Contrôle ISO/IEC 27001:2022 : Clause 5.2, A.5.1
- Statut : projet à valider par la direction

> Les champs marqués « à définir » attendent une décision de la direction. Ce
> document est un premier jet destiné à être revu, complété puis approuvé
> formellement (date, signataire).

## Comment utiliser ce document

Ce document est l'engagement de la direction sur la sécurité. C'est le texte de référence dont tous les autres découlent.

**À faire :**
- La direction le lit et complète les champs « à définir », surtout : qui est responsable de la sécurité.
- La direction l'approuve et le date en dernière page.

**Prochaine étape :** nommer la personne responsable de la sécurité, puis faire approuver ce document.

## 1. Objet

Cette politique fixe l'engagement de Police Bagage à protéger la confidentialité,
l'intégrité et la disponibilité des informations qu'elle traite, en particulier
les données personnelles des passagers et les données anti-fraude bagages, dont
dépendent des interventions physiques en aéroport.

## 2. Périmètre

Le système de management de la sécurité de l'information (SMSI) couvre :

- Les applications : application mobile agents (Expo/React Native sur PDA Zebra),
  dashboard superviseur (Next.js), portails publics tracking, vols et litige,
  et l'API de scan (Fastify).
- La base de données et les services Supabase (PostgreSQL, Auth, Realtime),
  projet de production unique.
- L'hébergement de l'API (Hostinger Cloud) et l'hébergement des applications web.
- Les dépôts de code (GitHub : monorepo et snapshot API).
- Les terminaux d'exploitation (PDA Zebra Android) et les postes des superviseurs.
- Les comptes et rôles : administrateurs, superviseurs, agents.

Aéroports concernés : hub principal FIH (Kinshasa) et escales desservies.
Compagnie(s) : ET (Ethiopian / Air Congo), avec ouverture prévue au multi-compagnies.

## 3. Objectifs de sécurité

1. Empêcher tout accès non autorisé aux données passagers (nom, PNR, itinéraire).
2. Garantir que la logique anti-fraude ne peut être contournée, et que les alertes
   et preuves associées sont inaltérables.
3. Assurer le cloisonnement strict des données entre compagnies et aéroports.
4. Maintenir la disponibilité du service pendant les fenêtres d'embarquement.
5. Pouvoir restaurer les données en cas d'incident, dans des délais définis.

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
| Direction | Approuve la politique, fournit les ressources, revue de direction | à définir |
| Responsable SMSI (RSSI de fait) | Pilote le SMSI, le registre des risques, les audits | Martin Bitha |
| Administrateur système | Gestion des comptes, configuration Supabase/Hostinger, exploitation de la plateforme web | Martin Bitha |
| Développeur | Développement sécurisé, correctifs, migrations | Martin Bitha |
| Superviseur | Traitement des alertes, gestion des litiges | équipe supervision |
| Agent | Scan terrain, signalement des incidents | équipe agents |

## 6. Conformité et exigences légales

Police Bagage respecte les obligations applicables en matière de protection des
données personnelles des passagers (base légale, minimisation, conservation) et
les exigences de l'autorité de l'aviation civile. Le registre des obligations
légales et réglementaires est à établir (A.5.31).

## 7. Gestion des manquements

Tout manquement à cette politique fait l'objet d'un traitement proportionné,
selon le processus disciplinaire (A.6.4, à définir). Les incidents sont gérés
selon la procédure PGI-04.

## 8. Revue

Cette politique est revue au moins une fois par an et après tout changement majeur
(nouvel environnement, incident significatif, évolution multi-compagnies).

## 9. Approbation

| | Nom | Fonction | Date | Signature |
|---|---|---|---|---|
| Rédigé par | | | 2026-09-07 | |
| Approuvé par | | Direction | | |
