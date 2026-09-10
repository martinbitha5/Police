# Périmètre et contexte du SMSI

- Organisation : African Transport Systems (ATS Handling)
- Référence : PC-00
- Version : 0.1 (projet)
- Date : 2026-09-10
- Propriétaire du document : Direction d'ATS
- Contrôle ISO/IEC 27001:2022 : Clauses 4.1, 4.2, 4.3
- Statut : projet à valider (périmètre choisi par la direction : option A)

## Comment utiliser ce document

C'est le document fondateur de la démarche. Il dit sur quoi porte la certification (le périmètre), dans quel contexte, et pour qui. Tous les autres documents s'y rattachent.

**À faire :**
- Faire valider ce périmètre et ce contexte par la direction.
- S'y référer dans tous les autres documents (politique, risques, etc.).

**Prochaine étape :** approuver le périmètre, puis vérifier que les autres documents sont bien alignés dessus.

## 1. Présentation de l'organisation

African Transport Systems (ATS Handling) est une société de services aéroportuaires opérant en République Démocratique du Congo : assistance en escale, fret, sûreté, manutention et support informatique. Son siège est à Kinshasa (immeuble Equity BCDC, 15 boulevard du 30 juin, Gombe).

Sa division de solutions informatiques conçoit et exploite des produits numériques, dont la plateforme Police Bagage, destinée à la lutte contre la fraude bagages en aéroport.

## 2. Périmètre du SMSI (clause 4.3)

La direction a retenu, le 2026-09-10, le périmètre suivant (option A) :

> Le système de management de la sécurité de l'information couvre la conception, le développement, l'exploitation et la maintenance des systèmes d'information numériques d'ATS Handling RDC, dont la plateforme Police Bagage (application mobile, tableau de bord web, API) et les données associées, opérés depuis le siège de Kinshasa.

Sont inclus dans le périmètre :

- Les applications : application mobile des agents (PDA Zebra Android), tableau de bord superviseur, portails publics (suivi bagage, vols, litige), et l'API de scan.
- La base de données et les services Supabase (PostgreSQL, authentification, temps réel).
- L'hébergement : Hostinger pour l'API, et l'hébergement des applications web.
- Les dépôts de code source (GitHub).
- Les comptes et les rôles : administrateurs, superviseurs, agents.
- Les terminaux d'exploitation (PDA) et les postes des superviseurs utilisés pour ces systèmes.

Sont exclus du périmètre à ce stade : les autres métiers d'ATS (fret physique, manutention, sûreté physique des escales, catering, restauration). Ils pourront être intégrés lors d'un élargissement ultérieur du périmètre.

## 3. Contexte externe (clause 4.1)

- Clients : compagnies aériennes assistées (Air Congo, CAA), attentives à la confidentialité et à l'intégrité de leurs données de vol.
- Autorités : autorité de l'aviation civile et exploitant aéroportuaire (exigences de sûreté) ; autorité de protection des données personnelles.
- Fournisseurs : dépendance à des services externes (Supabase, Hostinger, GitHub, Expo).
- Menaces : cyberattaques, fuite de données, indisponibilité pendant les fenêtres d'embarquement.
- Marché : exigence croissante de preuves de sécurité de la part des partenaires.

## 4. Contexte interne (clause 4.1)

- Une petite équipe informatique, avec plusieurs rôles cumulés sur une même personne.
- Des données sensibles traitées : données personnelles des passagers, données anti-fraude.
- Une croissance prévue vers le multi-compagnies.
- Un environnement encore en consolidation (séparation dev/prod à compléter).

## 5. Parties intéressées et attentes (clause 4.2)

| Partie intéressée | Attente principale |
|---|---|
| Direction d'ATS | Maîtrise du risque, image, conformité pour les contrats |
| Compagnies aériennes clientes | Confidentialité et intégrité de leurs données de vol |
| Autorité de l'aviation civile et aéroport | Conformité aux exigences de sûreté |
| Passagers | Protection de leurs données personnelles |
| Autorité de protection des données | Respect de la réglementation applicable |
| Agents et superviseurs | Outils fiables et règles claires |
| Fournisseurs (Supabase, Hostinger, GitHub, Expo) | Engagements de service et de sécurité |

## 6. Interfaces et dépendances

Le périmètre s'appuie sur des services externes (Supabase, Hostinger, GitHub, Expo) qui hébergent ou soutiennent les systèmes. Leur sécurité est suivie au titre des relations fournisseurs (voir SOA-03, mesures A.5.19 à A.5.23).

## 7. Revue

Le périmètre et le contexte sont revus au moins une fois par an, et à chaque changement majeur (élargissement du périmètre, nouveau système, nouvel environnement). Toute évolution est validée par la direction lors de la revue de direction (RD-05).
