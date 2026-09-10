# Périmètre et contexte du SMSI

- Organisation : African Transport Systems (ATS Handling)
- Référence : PC-00
- Version : 0.2 (projet)
- Date : 2026-09-10
- Propriétaire du document : Direction Générale d'ATS
- Contrôle ISO/IEC 27001:2022 : Clauses 4.1, 4.2, 4.3
- Statut : projet à valider par la Direction Générale

## Comment utiliser ce document

C'est le document fondateur de la démarche. Il dit sur quoi porte la certification (le périmètre), dans quel contexte, et pour qui. Tous les autres documents s'y rattachent. La Direction Générale valide ce périmètre et ce contexte, et chaque document du système s'y réfère. La prochaine étape consiste à approuver le périmètre, puis à vérifier que les autres documents sont bien alignés dessus.

## 1. Présentation de l'organisation

African Transport Systems (ATS Handling) est une société de services aéroportuaires opérant en République Démocratique du Congo : assistance en escale, fret, sûreté, manutention et solutions informatiques. Son siège est à Kinshasa (immeuble Equity BCDC, 15, boulevard du 30 Juin, Gombe).

Le Centre des Solutions Informatiques (CSI) est le service informatique d'ATS. Placé sous l'autorité du Responsable Informatique, il rend des services informatiques aux compagnies aériennes partenaires sur les escales desservies, fournit la connectivité Internet de ces escales, conçoit et exploite les produits numériques d'ATS, dont la plateforme Police Bagage, et assure l'informatique interne de l'entreprise.

## 2. Périmètre du SMSI (clause 4.3)

Le périmètre du système de management de la sécurité de l'information est défini comme suit :

> Le système de management de la sécurité de l'information couvre le Centre des Solutions Informatiques (CSI) d'ATS Handling RDC dans l'ensemble de ses activités : les services informatiques rendus aux compagnies aériennes partenaires sur les escales desservies, la fourniture de la connectivité Internet sur ces escales, la conception, le développement et l'exploitation des produits numériques d'ATS, dont la plateforme Police Bagage, et l'informatique interne de l'entreprise, depuis le siège de Kinshasa et les escales de Kinshasa, Lubumbashi, Gemena, Mbuji-Mayi, Kisangani et Kananga.

Activités couvertes :

- Les services informatiques aux compagnies partenaires : préparation et test des postes et des logiciels d'enregistrement avant l'ouverture de chaque vol, assistance pendant les opérations, présence d'un informaticien du CSI sur chaque vol.
- La connectivité Internet des escales : liaisons Starlink et réseaux d'escale associés, exploités par le CSI.
- Les produits numériques d'ATS : la plateforme Police Bagage (application mobile des agents, tableau de bord superviseur, portails publics de suivi bagage, de vols et de litige, API de scan), ses services Supabase (base de données, authentification, temps réel), son hébergement (Hostinger, applications web) et ses dépôts de code (GitHub).
- L'informatique interne d'ATS : postes de travail, messagerie et réseau du siège.

Sites couverts : le siège de Kinshasa (immeuble Equity BCDC) et les escales de Kinshasa (FIH), Lubumbashi (FBM), Gemena (GMA), Mbuji-Mayi (MJM), Kisangani (FKI) et Kananga (KGA).

Compagnies aériennes partenaires servies par le CSI : Turkish Airlines, Air Côte d'Ivoire, Kenya Airways, Air Tanzania, Air Congo, Royal Air Maroc et TAAG.

Frontières du périmètre. Le CSI prépare et teste les postes d'enregistrement ; l'agent passage se connecte ensuite avec ses propres identifiants. Le CSI ne détient donc pas les identifiants d'exploitation des compagnies. Le matériel d'enregistrement appartient aux compagnies et est placé sous la garde du CSI pendant les opérations. Les locaux des escales relèvent de l'exploitant aéroportuaire ; le CSI y applique ses propres règles pour le matériel et les accès dont il a la charge.

L'application mobile des agents de Police Bagage n'est pas publiée au grand public. Elle est distribuée en test fermé, depuis le compte développeur Google Play d'ATS, à une liste nominative de testeurs : seuls les agents dont l'adresse a été inscrite par l'administrateur peuvent l'installer, à partir d'un lien qui leur est envoyé. Les portails web de suivi bagage, de vols et de litige sont, eux, accessibles au public par nature.

Sont exclus du périmètre à ce stade : les autres métiers d'ATS (assistance au sol, fret, manutention, sûreté physique des escales, catering, restauration). Ils pourront être intégrés lors d'un élargissement ultérieur du périmètre.

## 3. Contexte externe (clause 4.1)

- Clients : les sept compagnies aériennes partenaires sont les clientes directes des services du CSI. Elles attendent des postes prêts et fiables à l'ouverture de chaque vol, une connectivité stable, et la confidentialité et l'intégrité de leurs données de vol.
- Autorités : autorité de l'aviation civile et exploitant aéroportuaire (exigences de sûreté sur les escales) ; autorité de protection des données personnelles.
- Fournisseurs : Starlink pour la connectivité des escales, dépendance critique ; Supabase, Hostinger, GitHub et Expo pour les produits numériques.
- Menaces : coupure de connectivité pendant un enregistrement, poste d'enregistrement compromis ou indisponible, perte ou vol de matériel sur une escale, cyberattaques, fuite de données.
- Marché : exigence croissante de preuves de sécurité de la part des compagnies et des partenaires.

## 4. Contexte interne (clause 4.1)

- Une équipe répartie sur six escales, avec un informaticien présent sur chaque vol, en zone aéroportuaire.
- Du matériel appartenant à des tiers (les compagnies) manipulé quotidiennement par le CSI.
- Une infrastructure réseau propre (Starlink et réseaux d'escale) à exploiter et à protéger.
- Une équipe restreinte au siège, avec plusieurs rôles cumulés sur une même personne.
- Des données sensibles traitées : données personnelles des passagers, données anti-fraude, données de vol des compagnies.
- Un environnement encore en consolidation (séparation dev/prod à compléter).

## 5. Parties intéressées et attentes (clause 4.2)

| Partie intéressée | Attente principale |
|---|---|
| Direction Générale d'ATS | Maîtrise du risque, image, conformité pour les contrats |
| Compagnies aériennes partenaires (clientes du CSI) | Postes prêts et fiables à chaque vol, connectivité stable, confidentialité et intégrité de leurs données |
| Exploitant aéroportuaire et autorité de l'aviation civile | Conformité aux exigences de sûreté sur les escales |
| Passagers | Protection de leurs données personnelles |
| Autorité de protection des données | Respect de la réglementation applicable |
| Informaticiens d'escale, agents et superviseurs | Outils fiables, règles claires, matériel en état |
| Fournisseurs (Starlink, Supabase, Hostinger, GitHub, Expo) | Engagements de service et de sécurité |

## 6. Interfaces et dépendances

Le périmètre s'appuie sur des tiers : Starlink pour la connectivité, les compagnies pour le matériel et les logiciels d'enregistrement, l'exploitant aéroportuaire pour les locaux des escales, et des services cloud (Supabase, Hostinger, GitHub, Expo) pour les produits numériques. Ces dépendances sont suivies au titre des relations avec les fournisseurs et les clients (voir SOA-03, mesures A.5.19 à A.5.23).

## 7. Revue

Le périmètre et le contexte sont revus au moins une fois par an, et à chaque changement majeur (nouvelle escale, nouvelle compagnie partenaire, nouveau système, nouvel environnement). Toute évolution est validée par la Direction Générale lors de la revue de direction (RD-05).
