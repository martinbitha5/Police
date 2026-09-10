# Déclaration d'Applicabilité (SoA)

- Organisation : African Transport Systems (ATS Handling)
- Périmètre : le Centre des Solutions Informatiques (CSI) d'ATS, toutes activités, siège et escales (voir PC-00)
- Référence : SOA-03
- Version : 0.1 (projet)
- Date : 2026-09-07
- Référentiel : ISO/IEC 27001:2022, Annexe A (93 mesures)
- Contrôle ISO : Clause 6.1.3 d)
- Statut : projet à valider

## Comment utiliser ce document

C'est la liste complète des 93 mesures de la norme et votre position sur chacune. Elle sert surtout de référence à l'auditeur. L'utiliser comme une liste de contrôle, sans chercher à tout remplir d'un coup. Planifier progressivement les lignes marquées « à faire ». La prochaine étape consiste à choisir trois à cinq mesures « à faire » à traiter ce trimestre.

## Légende

- **Applicable** : O (oui) / N (non, avec justification).
- **Statut** : En place / Partiel / À faire / N/A.

L'état reflète la situation après l'audit et les correctifs du 2026-09-07. Les
références F-xx / C-xx renvoient au rapport d'audit (`00-rapport-ecart.md`,
`../audit-securite-pentest-2026-09-07.md`).

## A.5 Mesures organisationnelles (37)

| Mesure | Applicable | Justification / mise en œuvre | Statut |
|---|---|---|---|
| 5.1 Politiques de sécurité | O | PSI-01 rédigée, à approuver | Partiel |
| 5.2 Fonctions et responsabilités | O | Rôles définis dans PSI-01, titulaires à nommer | Partiel |
| 5.3 Séparation des tâches | O | admin/superviseur/agent séparés ; suppression de vol admin only | Partiel |
| 5.4 Responsabilités de la direction | O | Revue de direction RD-05 à instaurer | À faire |
| 5.5 Relations avec les autorités | O | Contact autorité aviation civile / protection données à formaliser | À faire |
| 5.6 Relations avec groupes spécialisés | O | Veille via advisors Supabase, avis CVE | Partiel |
| 5.7 Renseignement sur les menaces | O | Advisors Supabase + npm audit en CI | Partiel |
| 5.8 Sécurité dans la gestion de projet | O | À intégrer au processus de dev | À faire |
| 5.9 Inventaire des actifs | O | Actifs de Police Bagage dans RR-02 ; inventaire du matériel des compagnies sous garde du CSI et des terminaux Starlink à tenir par escale | Partiel |
| 5.10 Utilisation acceptable des actifs | O | Charte d'usage à rédiger : PDA, comptes, matériel des compagnies confié au CSI | À faire |
| 5.11 Restitution des actifs | O | Procédure de départ (PDA, comptes) à définir | À faire |
| 5.12 Classification de l'information | O | PII passagers / anti-fraude à classifier | À faire |
| 5.13 Marquage de l'information | O | Découle de 5.12 | À faire |
| 5.14 Transfert de l'information | O | HTTPS partout ; règles d'échange à documenter | Partiel |
| 5.15 Contrôle d'accès | O | RLS + rôles ; renforcé (C-01/C-02/C-03) | En place |
| 5.16 Gestion des identités | O | Comptes nominatifs à généraliser (E-12) ; matricule staff_code | Partiel |
| 5.17 Informations d'authentification | O | Mots de passe Supabase ; MFA à imposer (E-06) ; HIBP (F-02) | Partiel |
| 5.18 Droits d'accès | O | Attribution/retrait par admin ; revue périodique à instaurer | Partiel |
| 5.19 Sécurité dans les relations fournisseurs | O | Starlink (connectivité critique), Supabase, Hostinger, GitHub, Expo | Partiel |
| 5.20 Sécurité dans les accords fournisseurs | O | Engagements Starlink et cloud à documenter ; responsabilités sur le matériel et les postes à préciser dans les accords avec chaque compagnie | À faire |
| 5.21 Sécurité dans la chaîne ICT | O | Dépendances npm ; audit en CI (F-32) | Partiel |
| 5.22 Suivi des services fournisseurs | O | Suivi des changements Supabase/Hostinger à formaliser | À faire |
| 5.23 Sécurité des services cloud | O | Supabase/Hostinger : config, sauvegarde, accès | Partiel |
| 5.24 Préparation gestion des incidents | O | PGI-04 rédigée | Partiel |
| 5.25 Évaluation des événements | O | Classification définie dans PGI-04 | Partiel |
| 5.26 Réponse aux incidents | O | Fiches réflexes dans PGI-04 | Partiel |
| 5.27 Tirer les leçons des incidents | O | Retour d'expérience prévu (PGI-04 §7) | Partiel |
| 5.28 Collecte de preuves | O | Journaux Supabase/API/movement_log ; journal inaltérable à faire (F-01) | Partiel |
| 5.29 Sécurité pendant une perturbation | O | Continuité pendant incident à cadrer | À faire |
| 5.30 Continuité ICT | O | PITR/DR à mettre en place et tester (F-15) | À faire |
| 5.31 Exigences légales et réglementaires | O | Registre des obligations (PII, aviation) à établir | À faire |
| 5.32 Propriété intellectuelle | O | Licences des dépendances à suivre | À faire |
| 5.33 Protection des enregistrements | O | Alertes protégées de la suppression (E-05) ; rétention à définir (F-29) | Partiel |
| 5.34 Protection de la vie privée (PII) | O | PII passager ; exposition portail à corriger (E-01) | Partiel |
| 5.35 Revue indépendante de la sécurité | O | Audit du 2026-09-07 ; à répéter | Partiel |
| 5.36 Conformité aux politiques | O | Vérifiée en revue de direction et audit interne | À faire |
| 5.37 Procédures d'exploitation documentées | O | Manuels existants (docs/) ; procédures secours à compléter | Partiel |

## A.6 Mesures liées aux personnes (8)

| Mesure | Applicable | Justification / mise en œuvre | Statut |
|---|---|---|---|
| 6.1 Sélection (screening) | O | Vérification préalable des informaticiens d'escale, agents et superviseurs à cadrer | À faire |
| 6.2 Conditions d'embauche | O | Clause de sécurité dans les contrats | À faire |
| 6.3 Sensibilisation et formation | O | Sensibilisation phishing/PDA à mettre en place | À faire |
| 6.4 Processus disciplinaire | O | Référencé dans PSI-01 §7 | À faire |
| 6.5 Responsabilités après départ | O | Retrait des accès, restitution PDA | À faire |
| 6.6 Accords de confidentialité (NDA) | O | Pour les personnes accédant aux PII et pour les informaticiens en contact avec le matériel et les données des compagnies | À faire |
| 6.7 Travail à distance | O | Superviseurs sur poste web ; règles à définir | À faire |
| 6.8 Signalement des événements | O | Canal de signalement dans PGI-04 §3 | Partiel |

## A.7 Mesures physiques (14)

| Mesure | Applicable | Justification / mise en œuvre | Statut |
|---|---|---|---|
| 7.1 Périmètres de sécurité physique | O | Six escales sous contrôle de l'exploitant ; zones et rangement du matériel CSI à définir par escale | À faire |
| 7.2 Entrées physiques | O | Idem, à documenter | À faire |
| 7.3 Bureaux, salles et installations | O | Poste superviseur | À faire |
| 7.4 Surveillance physique | O | Selon l'aéroport | À faire |
| 7.5 Menaces physiques et environnementales | O | Hébergement délégué (Supabase/Hostinger) | Partiel |
| 7.6 Travail en zones sécurisées | O | Salle de supervision | À faire |
| 7.7 Bureau et écran net | O | Verrouillage écran superviseur | À faire |
| 7.8 Emplacement et protection du matériel | O | Postes des compagnies, terminaux Starlink, PDA, postes du siège | À faire |
| 7.9 Sécurité des actifs hors site | O | PDA et matériel des compagnies en escale (E-07, E-12) | Partiel |
| 7.10 Supports de stockage | O | Pas de support amovible prévu | Partiel |
| 7.11 Services supports (utilities) | O | Alimentation et liaisons Starlink des escales ; secours à prévoir | À faire |
| 7.12 Sécurité du câblage | O | Câblage et équipements réseau des escales exploités par le CSI | À faire |
| 7.13 Maintenance du matériel | O | PDA (flotte à gérer) | À faire |
| 7.14 Mise au rebut / réemploi sécurisé | O | Effacement d'un PDA réformé | À faire |

## A.8 Mesures technologiques (34)

| Mesure | Applicable | Justification / mise en œuvre | Statut |
|---|---|---|---|
| 8.1 Terminaux utilisateurs | O | Application non publique (test fermé) ; PDA : stockage sécurisé (E-07), backup off, pinning (I-03) à compléter | Partiel |
| 8.2 Droits d'accès privilégiés | O | Rôle admin restreint ; suppression vol admin only | Partiel |
| 8.3 Restriction d'accès à l'information | O | RLS scopée par compagnie/aéroport | En place |
| 8.4 Accès au code source | O | GitHub ; protection de branche à activer | Partiel |
| 8.5 Authentification sécurisée | O | Supabase Auth ; MFA à imposer (E-06), re-auth (M-07) | Partiel |
| 8.6 Gestion de la capacité | O | Cache/compteurs bornés (F-05) ; suivi charge | Partiel |
| 8.7 Protection contre les logiciels malveillants | O | Surface réduite (pas d'upload de fichiers) | Partiel |
| 8.8 Gestion des vulnérabilités techniques | O | npm audit en CI (F-32), montée Next/Fastify (N-02) | Partiel |
| 8.9 Gestion de la configuration | O | Config Auth as-code à figer (I-01) | À faire |
| 8.10 Suppression de l'information | O | Rétention et purge PII à définir (F-29) | À faire |
| 8.11 Masquage des données | O | Masquage nom sur portail public (E-01) | À faire |
| 8.12 Prévention de fuite de données | O | service_role confinée ; scan secrets CI | Partiel |
| 8.13 Sauvegarde | O | PITR + export chiffré + test restauration (F-15) | À faire |
| 8.14 Redondance | O | Redondance Supabase (offre) à confirmer | Partiel |
| 8.15 Journalisation | O | Logs Supabase/API ; journal métier movement_log | Partiel |
| 8.16 Surveillance des activités | O | movement_log ; alerting à mettre en place | Partiel |
| 8.17 Synchronisation d'horloge | O | Journée d'exploitation calculée serveur (jour PDA non fiable) | En place |
| 8.18 Utilitaires privilégiés | O | Accès SQL restreint (service_role serveur) | Partiel |
| 8.19 Installation de logiciels | O | Application mobile distribuée en test fermé Google Play, sur liste nominative de testeurs ; déploiements web contrôlés | En place |
| 8.20 Sécurité des réseaux | O | Réseaux d'escale sur Starlink à protéger ; HTTPS et en-têtes de sécurité (M-01) côté applications | Partiel |
| 8.21 Sécurité des services réseau | O | Service de connectivité rendu aux compagnies ; endpoints API/portails, rate-limit (E-08) | Partiel |
| 8.22 Cloisonnement des réseaux | O | Séparer le trafic des compagnies, de Police Bagage et de l'usage interne sur chaque escale | À faire |
| 8.23 Filtrage web | O | Filtrage sur les réseaux d'escale et internes à définir | À faire |
| 8.24 Cryptographie | O | TLS ; jetons ; stockage sécurisé PDA à venir (E-07) | Partiel |
| 8.25 Cycle de développement sécurisé | O | CI ajoutée (F-13) ; revue à formaliser | Partiel |
| 8.26 Exigences de sécurité applicative | O | Anti-fraude serveur testée ; validation d'entrée (M-04) | Partiel |
| 8.27 Architecture et ingénierie sécurisées | O | Identité dérivée du JWT ; défense en profondeur | En place |
| 8.28 Codage sécurisé | O | Assainissement (M-02) ; gestion d'erreurs (F-03) | Partiel |
| 8.29 Tests de sécurité | O | Tests unitaires anti-fraude ; fuzzing ; tests RBAC à ajouter (F-31) | Partiel |
| 8.30 Développement externalisé | N | Développement interne | N/A |
| 8.31 Séparation dev/test/prod | O | Environnement de staging à créer (F-14) | À faire |
| 8.32 Gestion des changements | O | Migrations versionnées reproductibles (F-14) ; CI | Partiel |
| 8.33 Informations de test | O | Pas de données de test dédiées ; à cadrer | À faire |
| 8.34 Protection lors des tests d'audit | O | Audit non destructif (transactions annulées) | En place |

## Synthèse

| Statut | Nombre (indicatif) |
|---|---|
| En place | 6 |
| Partiel | 46 |
| À faire | 40 |
| N/A | 1 |

La seule mesure « N/A » restante (développement externalisé) est justifiée par un
développement entièrement interne. Toute évolution
(infra propre, sous-traitance) rouvrira ces mesures.
