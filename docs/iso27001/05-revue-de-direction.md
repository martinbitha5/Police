# Revue de direction du SMSI — Police Bagage

- Référence : RD-05
- Version : 0.1 (projet)
- Date : 2026-09-07
- Contrôle ISO/IEC 27001:2022 : Clause 9.3
- Statut : procédure à valider + modèle de compte rendu

## Comment utiliser ce document

C'est la réunion par laquelle la direction pilote la sécurité et prend les décisions.

**À faire :**
- Planifier et tenir une première vraie réunion (l'ordre du jour est fourni à la fin).
- En rédiger un compte rendu daté.

**Prochaine étape :** fixer la date de la première revue de direction. Le compte rendu daté est une preuve que l'auditeur demande.

## 1. Objet

La direction revoit le SMSI à intervalle planifié pour s'assurer qu'il reste
pertinent, adéquat et efficace, et pour décider des améliorations et des ressources.

## 2. Fréquence

Au moins une fois par an, et après tout incident critique ou changement majeur
(ouverture multi-compagnies, nouvel environnement, incident de données).

## 3. Participants

- Direction (décideur).
- Responsable SMSI.
- Développeur / administrateur système.
- Représentant supervision (selon ordre du jour).

## 4. Données d'entrée (exigées par la clause 9.3.2)

1. Suivi des actions décidées lors des revues précédentes.
2. Évolutions internes et externes pertinentes (multi-compagnies, réglementation).
3. Besoins et attentes des parties intéressées (passagers, autorité, compagnies).
4. Retour sur la performance de la sécurité :
   - non-conformités et actions correctives ;
   - résultats de la surveillance et des mesures (indicateurs) ;
   - résultats des audits (interne AI-06, et audit technique du 2026-09-07) ;
   - atteinte des objectifs de sécurité (PSI-01 §3).
5. Retour des parties intéressées.
6. Résultats de l'appréciation des risques et état du plan de traitement (RR-02).
7. Opportunités d'amélioration continue.

## 5. Données de sortie (exigées par la clause 9.3.3)

- Décisions d'amélioration continue.
- Changements du SMSI (périmètre, politique, objectifs).
- Ressources allouées.
- Actions, responsables et échéances.

## 6. Modèle de compte rendu

```
Revue de direction SMSI — [date]
Participants : [...]

1. Suivi des actions précédentes : [...]
2. Changements de contexte : [...]
3. Performance sécurité
   - Incidents depuis la dernière revue : [nombre, gravité]
   - Non-conformités / actions correctives : [...]
   - Indicateurs : [voir §7]
   - Résultats d'audits : [...]
   - Objectifs de sécurité : atteints / non atteints
4. Risques : risques ouverts > appétit (RR-02) : R-05, R-08, R-09, [...]
5. Décisions et actions
   | Action | Responsable | Échéance |
   | ------ | ----------- | -------- |
6. Prochaine revue : [date]
```

## 7. Indicateurs proposés (à valider)

| Indicateur | Cible proposée |
|---|---|
| Comptes admin/superviseur avec MFA | 100 % |
| Risques résiduels > 9 sans plan daté | 0 |
| Correctifs de vulnérabilités critiques appliqués | < 30 jours |
| Test de restauration de sauvegarde réussi | 1 / an minimum |
| Incidents critiques non clôturés | 0 |
| Couverture CI (typecheck + tests) sur les poussées | 100 % |

## 8. Première revue — ordre du jour suggéré

1. Approuver la politique (PSI-01) et nommer le responsable SMSI.
2. Valider l'appétit au risque et le registre (RR-02).
3. Décider des trois risques prioritaires ouverts (R-05, R-08, R-09).
4. Planifier sauvegarde/DR (R-14) et le premier audit interne (AI-06).
5. Fixer les indicateurs et leurs cibles.
