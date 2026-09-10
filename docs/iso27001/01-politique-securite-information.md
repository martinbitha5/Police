# Politique de sécurité de l'information

- Organisation : African Transport Systems (ATS Handling)
- Périmètre : systèmes d'information numériques d'ATS, dont Police Bagage (voir PC-00)
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
confidentialité, l'intégrité et la disponibilité des informations traitées par ses
systèmes d'information numériques, dont la plateforme Police Bagage. Sont
particulièrement concernées les données personnelles des passagers et les données
anti-fraude bagages, dont dépendent des interventions physiques en aéroport.

## 2. Périmètre

Le périmètre du SMSI est centré sur les systèmes d'information
numériques d'ATS, dont la plateforme Police Bagage, opérés depuis le siège de
Kinshasa. Le périmètre complet, le contexte et les parties intéressées sont décrits
dans le document PC-00 (Périmètre et contexte du SMSI). En résumé, le SMSI couvre :

- Les applications : application mobile agents (Expo/React Native sur PDA Zebra),
  dashboard superviseur (Next.js), portails publics tracking, vols et litige,
  et l'API de scan (Fastify).
- La base de données et les services Supabase (PostgreSQL, Auth, Realtime),
  projet de production unique.
- L'hébergement de l'API (Hostinger Cloud) et l'hébergement des applications web.
- Les dépôts de code (GitHub : monorepo et snapshot API).
- Les terminaux d'exploitation (PDA Zebra Android) et les postes des superviseurs.
- Les comptes et rôles : administrateurs, superviseurs, agents.

Les autres métiers d'ATS (fret, manutention, sûreté physique, catering) sont hors
périmètre à ce stade et pourront être intégrés lors d'un élargissement ultérieur.

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
| Direction | Approuve la politique, fournit les ressources, revue de direction | Michel TSHEFU (Directeur Général) |
| Responsable SMSI (RSSI de fait) | Pilote le SMSI, le registre des risques, les audits | Martin Bitha |
| Administrateur système | Gestion des comptes, configuration Supabase/Hostinger, exploitation de la plateforme web | Martin Bitha |
| Développeur | Développement sécurisé, correctifs, migrations | Martin Bitha |
| Superviseur | Traitement des alertes, gestion des litiges | équipe supervision |
| Agent | Scan terrain, signalement des incidents | équipe agents |

## 6. Conformité et exigences légales

ATS respecte, pour les traitements de la plateforme Police Bagage, les obligations
applicables en matière de protection des données personnelles des passagers (base
légale, minimisation, conservation) et les exigences de l'autorité de l'aviation civile. Le registre des obligations
légales et réglementaires est à établir (A.5.31).

## 7. Gestion des manquements

Tout manquement à cette politique fait l'objet d'un traitement proportionné,
selon le processus disciplinaire (A.6.4, à définir). Les incidents sont gérés
selon la procédure PGI-04.

## 8. Revue

Cette politique est revue au moins une fois par an et après tout changement majeur
(nouvel environnement, incident significatif, évolution multi-compagnies).

