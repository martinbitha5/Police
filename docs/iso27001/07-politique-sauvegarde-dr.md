# Politique de sauvegarde et de reprise (DR)

- Organisation : African Transport Systems (ATS Handling)
- Périmètre : systèmes d'information numériques d'ATS, dont Police Bagage (voir PC-00)
- Référence : DR-07
- Version : 0.1 (projet)
- Date : 2026-09-08
- Contrôle ISO/IEC 27001:2022 : A.8.13 (Sauvegarde), A.5.29 (Sécurité pendant une perturbation), A.5.30 (Continuité ICT)
- Constat lié : F-15 / R-14
- Statut : projet à valider + procédure à exécuter et dater

## Comment utiliser ce document

C'est comment sauvegarder vos données et les restaurer en cas d'incident. Mettre en place les sauvegardes (l'offre Supabase Pro est conseillée pour les sauvegardes quotidiennes). Lancer une sauvegarde, puis tester une restauration dans une copie isolée, jamais sur la production. Noter le résultat daté dans le journal du document. La prochaine étape consiste à réaliser et dater un premier test de restauration. C'est la preuve clé exigée pour la certification.

## 1. Objet

Garantir que les données de Police Bagage peuvent être restaurées après un
incident (corruption, suppression, panne du fournisseur, erreur humaine), dans
des délais définis, et que cette capacité est **prouvée par un test**.

## 2. Contexte technique (relevé le 2026-09-08)

| Élément | Valeur |
|---|---|
| Projet Supabase | `zdnktpdtolyhdischulk` (eu-west-1) |
| Moteur | PostgreSQL 17.6 |
| Taille totale de la base | 47 Mo |

Manifeste par table (ce qu'une sauvegarde doit contenir) :

| Table | Lignes (est.) | Taille |
|---|---|---|
| passengers | 17 899 | 17 Mo |
| baggage | 18 708 | 13 Mo |
| passenger_legs | 18 072 | 2,9 Mo |
| fraud_alerts | 3 292 | 1,8 Mo |
| flights | 228 | 120 Ko |
| profiles | 24 | 48 Ko |
| baggage_disputes | 0 | 48 Ko |
| airline_codes | 1 | 32 Ko |

La base est petite : une sauvegarde logique complète prend quelques secondes et
pèse quelques Mo compressés. Le coût n'est donc pas un obstacle.

À sauvegarder aussi, hors base : les variables d'environnement (clés, hors dépôt),
la configuration Auth (signup, MFA), et le code (déjà sur GitHub).

## 3. Objectifs (proposés, à valider par la direction)

- **RPO (perte de données maximale tolérée) : 24 h.** Atteint par une sauvegarde
  quotidienne. Peut descendre à quelques minutes si le PITR Supabase est activé.
- **RTO (délai de remise en service) : 4 h.** La restauration technique de 47 Mo
  prend quelques minutes ; la marge couvre la décision, la reconfiguration des
  variables d'environnement et la vérification.

## 4. Stratégie à deux niveaux

La sauvegarde ne doit pas dépendre uniquement du fournisseur.

1. **Sauvegardes gérées Supabase.** Vérifier l'offre du projet : sauvegardes
   quotidiennes automatiques, et **PITR** (restauration à un instant précis) si
   disponible/activé. À confirmer dans le dashboard et à documenter.
2. **Export indépendant, chiffré, hors plateforme.** Un `pg_dump` quotidien
   chiffré, stocké ailleurs que chez Supabase (autre fournisseur ou stockage
   froid). C'est la garantie en cas de perte d'accès au compte Supabase lui-même.
   Script fourni : `scripts/backup.mjs`.

## 5. Procédure de sauvegarde (export indépendant)

Pré-requis : `pg_dump` (client PostgreSQL 17) et, pour le chiffrement, `openssl`.

1. Récupérer la chaîne de connexion base dans le dashboard Supabase
   (Settings → Database → Connection string, mode « Session »/direct).
2. La fournir en variable d'environnement, **jamais en clair dans le dépôt** :

   ```bash
   export SUPABASE_DB_URL='postgresql://postgres:[MOT_DE_PASSE]@db.zdnktpdtolyhdischulk.supabase.co:5432/postgres'
   export BACKUP_PASSPHRASE='<phrase-secrète-forte>'
   node scripts/backup.mjs
   ```

3. Le script écrit une sauvegarde horodatée et chiffrée sous `./backups/`
   (dossier ignoré par git). Vérifier le message de fin (taille > 0).

Alternative avec la CLI Supabase (si installée) :

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f backups/schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" --data-only -f backups/data.sql
```

Automatisation : planifier l'exécution quotidienne (tâche planifiée Windows, cron,
ou job CI programmé avec le secret stocké côté plateforme). Conserver au moins
30 jours de sauvegardes, avec rotation.

## 6. Procédure de restauration (à tester, NON destructive)

Ne **jamais** tester une restauration sur la base de production. Restaurer dans
une cible isolée :

- **Sur une branche Supabase.** Créer une branche du projet (isolée), y
  restaurer la sauvegarde, vérifier, puis supprimer la branche.
- **Sur un PostgreSQL local ou un conteneur.** Restaurer dans une base jetable.

Étapes :

1. Déchiffrer la sauvegarde :
   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 -in backups/<fichier>.dump.enc -out /tmp/restore.dump -pass env:BACKUP_PASSPHRASE
   ```
2. Restaurer dans la cible isolée :
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges -d "$CIBLE_DB_URL" /tmp/restore.dump
   ```
3. **Vérifier l'intégrité** (à comparer au manifeste du jour) :
   ```sql
   select 'passengers', count(*) from passengers
   union all select 'baggage', count(*) from baggage
   union all select 'fraud_alerts', count(*) from fraud_alerts
   union all select 'flights', count(*) from flights;
   ```
4. Consigner le test (date, durée, écarts) dans le journal ci-dessous.

## 7. Journal des tests de restauration

Un test de restauration réussi, au moins une fois par an et après tout changement
majeur, est **exigé** pour la certification. Sans entrée datée ici, l'exigence
A.8.13 / A.5.30 n'est pas satisfaite.

| Date | Sauvegarde testée | Cible | Durée | Résultat / écarts | Testé par |
|---|---|---|---|---|---|
| | | | | | |

## 8. Responsabilités

- Exécution et vérification des sauvegardes : administrateur système (à nommer).
- Test de restauration annuel : responsable SMSI + administrateur.
- Revue de la politique : à chaque revue de direction (RD-05).
