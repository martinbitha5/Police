# Programme d'audit interne du SMSI

- Organisation : African Transport Systems (ATS Handling)
- Périmètre : systèmes d'information numériques d'ATS, dont Police Bagage (voir PC-00)
- Référence : AI-06
- Version : 0.1 (projet)
- Date : 2026-09-07
- Contrôle ISO/IEC 27001:2022 : Clause 9.2
- Statut : procédure à valider + premier plan

## Comment utiliser ce document

C'est le contrôle interne planifié qui vérifie que tout fonctionne réellement, pas seulement sur le papier. Faire auditer un domaine par une personne qui n'en est pas responsable. Consigner les écarts trouvés et les corriger. La prochaine étape consiste à réaliser un premier audit interne avant de contacter un certificateur. Si l'indépendance est difficile en interne, prévoir un auditeur externe.

## 1. Objet

Vérifier, de façon planifiée et objective, que le SMSI est conforme à la norme et
aux exigences internes, et qu'il est effectivement mis en œuvre et tenu à jour.

## 2. Principes

- **Indépendance.** L'auditeur ne juge pas son propre travail. Dans une petite
  structure, l'auditeur d'un domaine est une personne différente du responsable
  de ce domaine (ou un prestataire externe).
- **Fondé sur les preuves.** Chaque constat s'appuie sur une preuve vérifiable
  (export de configuration, capture, journal, test rejoué).
- **Couverture.** Sur un cycle (12 mois), toutes les clauses (4 à 10) et les
  mesures applicables de l'annexe A (SOA-03) sont auditées au moins une fois.

## 3. Fréquence

Au moins un audit interne complet par an, plus des audits ciblés après un
changement majeur ou un incident critique.

## 4. Déroulement

1. **Planification.** Définir périmètre, critères (norme + documents internes),
   date, auditeur.
2. **Revue documentaire.** Vérifier l'existence et la cohérence des documents
   (PSI-01, RR-02, SOA-03, PGI-04, RD-05).
3. **Tests sur le terrain.** Vérifier que les mesures fonctionnent réellement.
   Exemples reproductibles et non destructifs :
   - RLS : sous un JWT d'agent, un `UPDATE baggage` doit affecter 0 ligne (C-01) ;
     un `PATCH profiles.airline_code` doit laisser la valeur inchangée (C-02).
   - API : un vol d'une autre compagnie doit renvoyer 403 (E-03).
   - MFA : vérifier l'enrôlement des comptes admin/superviseur (E-06).
   - Sauvegarde : preuve d'un test de restauration daté (R-14).
   - CI : preuve d'exécution des jobs typecheck/tests/audit/secrets.
4. **Constats.** Classer en non-conformité majeure, mineure, ou opportunité.
5. **Rapport.** Transmettre à la direction (entrée de la revue RD-05).
6. **Actions correctives.** Chaque non-conformité reçoit une cause racine, une
   action, un responsable et une échéance ; le suivi est vérifié à l'audit suivant.

## 5. Modèle de constat

```
Constat AI-[année]-[n]
Domaine / mesure : [ex. A.8.5 Authentification]
Type : majeure / mineure / opportunité
Preuve : [export, capture, test rejoué]
Description de l'écart : [...]
Cause racine : [...]
Action corrective : [...]  Responsable : [...]  Échéance : [...]
Vérification de clôture : [date, preuve]
```

## 6. Premier plan d'audit (proposé)

| Lot | Domaine | Mesures clés | Trimestre cible |
|---|---|---|---|
| 1 | Contrôle d'accès | A.5.15, A.8.2, A.8.3, A.5.18 | T1 |
| 2 | Authentification | A.8.5, A.5.17 (MFA, HIBP) | T1 |
| 3 | Journalisation & incidents | A.8.15, A.8.16, A.5.24-5.28 | T2 |
| 4 | Sauvegarde & continuité | A.8.13, A.5.29, A.5.30 | T2 |
| 5 | Développement sécurisé | A.8.25-8.32 (CI, migrations, tests) | T3 |
| 6 | Protection des données / PII | A.5.34, A.8.10, A.8.11 | T3 |
| 7 | Clauses 4-10 (SMSI) | politique, risques, revue de direction | T4 |

## 7. Réserve d'indépendance

Le développeur principal ne peut pas auditer seul le développement sécurisé. Pour
les lots où l'indépendance interne n'est pas atteignable, prévoir un auditeur
externe (cohérent avec l'objectif de certification).
