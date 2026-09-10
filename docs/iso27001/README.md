# Corpus documentaire SMSI — Police Bagage (ISO/IEC 27001:2022)

Ce dossier rassemble les documents du système de management de la sécurité de
l'information (SMSI) de Police Bagage. Tous sont des **projets version 0.1**
(2026-09-07) à revoir, compléter et **approuver formellement par la direction**.
Les champs « à définir » attendent une décision d'organisation.

## Documents

| Réf | Document | Objet | Clause / Annexe ISO |
|---|---|---|---|
| n/a | [Rapport d'écart](00-rapport-ecart.md) | Audit initial de readiness | n/a |
| n/a | [Audit pentest 2026-09-07](../audit-securite-pentest-2026-09-07.md) | Constats techniques, correctifs, preuves | n/a |
| PC-00 | [Périmètre et contexte](00-perimetre-contexte-smsi.md) | Périmètre, contexte, parties intéressées | 4.1, 4.2, 4.3 |
| PSI-01 | [Politique de sécurité](01-politique-securite-information.md) | Engagement, périmètre, principes, rôles | 5.2, A.5.1 |
| RR-02 | [Registre des risques](02-registre-des-risques.md) | Risques cotés, traitement, statut | 6.1, 8.2, 8.3 |
| SOA-03 | [Déclaration d'Applicabilité](03-declaration-applicabilite-soa.md) | Les 93 mesures de l'annexe A | 6.1.3 d) |
| PGI-04 | [Gestion des incidents](04-procedure-gestion-incidents.md) | Signalement, réponse, preuves | A.5.24-5.28, A.6.8 |
| RD-05 | [Revue de direction](05-revue-de-direction.md) | Pilotage par la direction | 9.3 |
| AI-06 | [Audit interne](06-programme-audit-interne.md) | Vérification planifiée | 9.2 |
| DR-07 | [Sauvegarde et reprise](07-politique-sauvegarde-dr.md) | Sauvegarde, RPO/RTO, restauration testée | A.8.13, A.5.29, A.5.30 |

## Ce qui manque encore pour un dossier complet

Ces documents couvrent le cœur du SMSI. Restent à produire, en grande partie avec
des décisions d'organisation :

- **Périmètre et contexte du SMSI** (clause 4) et **charte / objectifs** signés.
- **Registre des obligations légales et réglementaires** (A.5.31, PII, aviation).
- **Politique de contrôle d'accès** détaillée et **revue périodique des accès**.
- **Charte d'usage** des PDA et des comptes, **NDA**, **processus RH** (A.6).
- **Politique de conservation / minimisation des données** (F-29).
- **Inventaire des actifs** formel (A.5.9).

## État de la remédiation technique

Le suivi précis (corrigé / en attente / décision) est tenu dans le
[rapport d'audit](../audit-securite-pentest-2026-09-07.md), section « Journal des
correctifs ». À ce jour : 3 critiques et plusieurs élevés corrigés (base en
production, code prêt à déployer), CI et migrations reproductibles ajoutées.

## Avertissement

Police Bagage n'est **pas** certifié ISO/IEC 27001. Ce corpus est une base de
readiness. La certification passe par un organisme accrédité, après mise en œuvre
effective des mesures, tenue des preuves, et au moins un cycle d'audit interne et
de revue de direction.
