# Registre des risques — Police Bagage

- Référence : RR-02
- Version : 0.1 (projet)
- Date : 2026-09-07
- Contrôle ISO/IEC 27001:2022 : Clause 6.1.2, 6.1.3, 8.2, 8.3
- Statut : projet à valider

## Comment utiliser ce document

C'est la liste de vos risques, avec leur gravité et leur état de traitement. C'est le document que vous consulterez le plus souvent.

**À faire :**
- Relire les risques et confirmer ceux que vous acceptez tels quels.
- Pour les risques encore ouverts (portail public, double authentification, appareil mobile perdu), décider quoi faire et fixer une date.
- Le mettre à jour après chaque correctif ou incident.

**Prochaine étape :** traiter en priorité les trois risques les plus élevés encore ouverts.

## Méthode

Chaque risque est coté sur **Vraisemblance (V)** et **Impact (I)** de 1 (faible)
à 5 (élevé). Le **niveau de risque = V × I** (1 à 25).

- 1 à 6 : faible — 7 à 12 : moyen — 13 à 19 : élevé — 20 à 25 : critique.

**Appétit au risque (proposé, à valider par la direction) :** aucun risque
résiduel supérieur à 9 n'est accepté sans plan de traitement daté. Options de
traitement : réduire, accepter, transférer, éviter.

Les cotations « après » reflètent l'état une fois les correctifs de l'audit du
2026-09-07 appliqués et déployés. « Résiduel » = risque restant à ce jour.

## Actifs primaires

| Actif | Sensibilité | Support |
|---|---|---|
| Données passagers (nom, PNR, itinéraire) | PII — confidentialité | table `passengers`, Supabase |
| Données anti-fraude (alertes, bagages) | Intégrité forte | tables `baggage`, `fraud_alerts` |
| Comptes et rôles | Contrôle d'accès | table `profiles`, Supabase Auth |
| Jetons de session | Confidentialité | PDA (AsyncStorage), navigateurs |
| Clé service_role | Secret critique | env serveur API / web |
| Code source | Intégrité, disponibilité | GitHub |

## Registre

| ID | Risque | Actif | Constat lié | V | I | Avant | Traitement | Statut | V | I | Résiduel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Contournement de l'anti-fraude par écriture directe en base | anti-fraude | C-01 | 4 | 5 | 20 | Réduire : RLS d'écriture scopée, rôle agent retiré | Traité (base) | 1 | 5 | 5 |
| R-02 | Évasion de cloisonnement par auto-modification du profil | données inter-compagnies | C-02 | 4 | 5 | 20 | Réduire : trigger figeant compagnie/aéroport | Traité (base) | 1 | 5 | 5 |
| R-03 | Écritures inter-tenant depuis le dashboard | données inter-compagnies | C-03 | 3 | 5 | 15 | Réduire : `flight_in_scope` sur écritures | Traité (base) | 1 | 5 | 5 |
| R-04 | Destruction des preuves par suppression de vol | alertes fraude | E-05 | 3 | 5 | 15 | Réduire : FK RESTRICT, suppression admin only | Traité (base) | 1 | 5 | 5 |
| R-05 | Exposition de PII passager sur le portail public | données passagers | E-01 | 4 | 4 | 16 | Réduire : second facteur, masquage, rate-limit fiable | En attente (décision) | 4 | 4 | 16 |
| R-06 | Réouverture/altération de litiges par le public | intégrité litiges | E-02 | 3 | 3 | 9 | Réduire : pas de réouverture, notes bornées | Traité (code, à déployer) | 1 | 3 | 3 |
| R-07 | IDOR inter-compagnies via l'API | données inter-compagnies | E-03 | 3 | 4 | 12 | Réduire : contrôle compagnie dans l'API | Traité (code, à déployer) | 1 | 4 | 4 |
| R-08 | Vol d'un PDA : jeton en clair, session non révocable | jetons | E-07, E-12 | 3 | 4 | 12 | Réduire : SecureStore, révocation, verrou appareil | En attente (test PDA) | 3 | 4 | 12 |
| R-09 | Compromission d'un compte sans second facteur | comptes admin/superviseur | E-06 | 3 | 5 | 15 | Réduire : MFA imposée | En attente (console) | 3 | 5 | 15 |
| R-10 | Déni de service / amplification (scan, rapports, API) | disponibilité | E-08, M-03, N-01 | 3 | 3 | 9 | Réduire : rate-limit, plafonds, bornes | Traité (code, à déployer) | 1 | 3 | 3 |
| R-11 | Vulnérabilité de dépendance exploitée (Next CVE) | applications | N-02, F-03 | 3 | 4 | 12 | Réduire : montée Next/Fastify, audit en CI | Partiel (versions bumpées, à déployer) | 2 | 4 | 8 |
| R-12 | Alerte fraude non écrite : superviseur non prévenu | anti-fraude | E-04 | 2 | 5 | 10 | Réduire : contrôle des erreurs d'écriture | Traité (code, à déployer) | 1 | 5 | 5 |
| R-13 | Journal d'audit falsifiable | traçabilité | F-01 | 2 | 4 | 8 | Réduire : journal append-only par triggers (`audit_log`) | Traité (base) | 1 | 4 | 4 |
| R-14 | Perte de données sans sauvegarde testée | tous | F-15 | 2 | 5 | 10 | Réduire : PITR + export chiffré + test restauration | En attente | 2 | 5 | 10 |
| R-15 | Fuite de la clé service_role | secret critique | (positif actuel) | 2 | 5 | 10 | Réduire : confinement serveur, rotation, scan secrets CI | Partiel (scan CI ajouté) | 1 | 5 | 5 |
| R-16 | Escalade de privilège si l'inscription publique est réactivée | comptes | I-01 | 1 | 5 | 5 | Réduire : figer config Auth, ne pas accepter admin en métadonnées | En attente | 1 | 5 | 5 |
| R-17 | Absence de séparation dev/prod : erreur directe sur la prod | tous | F-14 | 3 | 4 | 12 | Réduire : environnement de staging, migrations reproductibles | Partiel (migrations rangées) | 2 | 4 | 8 |
| R-18 | Régression de sécurité mise en prod sans contrôle | tous | F-13 | 3 | 3 | 9 | Réduire : CI (typecheck, tests, audit, secrets) | Traité (CI ajoutée, à activer) | 1 | 3 | 3 |
| R-19 | MITM sur un PDA partagé (pas de pinning) | jetons, PII | I-03 | 2 | 3 | 6 | Réduire : certificate pinning | En attente | 2 | 3 | 6 |
| R-20 | Injection de formule / en-tête via rapports et champs libres | intégrité rapports | M-02, M-08 | 2 | 2 | 4 | Réduire : assainissement | Traité (code, à déployer) | 1 | 2 | 2 |

## Risques ouverts prioritaires (résiduel élevé)

- **R-05** (16) — PII portail public. Décision produit attendue.
- **R-09** (15) — MFA absente. Réglage console.
- **R-08** (12) — PDA volé. Test appareil requis.

Ces trois dépassent l'appétit proposé et doivent recevoir un plan de traitement daté.

## Revue

Le registre est revu à chaque revue de direction et après tout incident. Chaque
ligne « En attente » ou « Partiel » porte une date cible (à renseigner).
