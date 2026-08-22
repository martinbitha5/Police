# Rapport d'écart ISO/IEC 27001 — Police Bagage

> **Statut du document : ÉTAPE 1–2 de la mission (audit + rapport d'écart).**
> Aucune modification de code n'a été effectuée. Ce rapport constitue la base de la
> remédiation. Police Bagage n'est **pas** certifié ISO/IEC 27001 : ce document décrit
> un état de **readiness** en vue d'un audit par un organisme certificateur indépendant.

- **Date de l'audit :** 2026-08-19
- **Périmètre :** monorepo Turborepo `police` (mobile Expo, 4 apps web Next.js, API Fastify, packages partagés, base Supabase/PostgreSQL `zdnktpdtolyhdischulk`, scripts d'exploitation, dépôt Git).
- **Méthode :** audit statique en lecture seule (aucun fichier modifié), complété par des vérifications directes en base via l'API Supabase (politiques RLS réelles, définitions de fonctions, configuration Auth, comptes MFA) et par les advisors de sécurité Supabase.
- **Système en production :** agents terrain sur PDA + portails publics en ligne. Toute remédiation devra préserver les workflows existants.

---

## 1. Synthèse exécutive

L'architecture applicative est, sur plusieurs points, saine et mieux construite que la
moyenne : les 5 règles anti-fraude sont réellement appliquées **côté serveur** et
couvertes par des tests unitaires ; l'identité du scanneur est toujours dérivée du JWT et
jamais du corps de requête ; la clé `service_role` est correctement confinée au serveur
(jamais dans un bundle mobile/web ni dans une variable `NEXT_PUBLIC_`/`EXPO_PUBLIC_`) ;
aucun secret serveur n'est committé ; le mobile ne conserve aucune donnée passager en local
et communique exclusivement en HTTPS.

Cependant, plusieurs écarts **critiques et élevés** empêchent en l'état une démarche de
certification. Les trois plus graves :

1. **Évasion de cloisonnement inter-compagnies (F-01).** Tout utilisateur authentifié peut
   modifier lui-même sa propre `airline_code` / `airport_code` (le trigger de protection ne
   fige que `id` et `role`). Comme tout le cloisonnement multi-compagnies repose sur ces deux
   colonnes, un agent ou superviseur peut basculer son périmètre vers une autre compagnie et
   lire vols, passagers, bagages et alertes fraude d'un concurrent.
2. **Anti-fraude contournable par écriture directe en base (F-02).** Les politiques RLS
   d'écriture ne vérifient que le rôle, pas le périmètre ni la cohérence métier. Avec la clé
   anon (publique par conception) et un JWT d'agent, on peut appeler PostgREST directement et
   faire `UPDATE baggage SET is_confirmed = true` sans jamais passer par la logique anti-fraude
   de l'API — le cœur de mission du produit est court-circuitable.
3. **Next.js 15.1.3 vulnérable (F-03, CVE-2025-29927).** L'authentification des pages du
   dashboard repose sur le middleware, précisément le composant que cette CVE permet de
   contourner. Impact limité aux pages (les mutations restent protégées côté serveur), mais
   version à corriger sans délai.

Un quatrième point mérite d'être remonté au niveau direction : **le portail public de suivi
(`/api/track`) expose des données personnelles passager** (nom, PNR, itinéraire) à partir
d'un simple PNR ou numéro d'étiquette énumérable (F-04).

### Décompte des constats

| Sévérité | Nombre |
|---|---|
| Critique | 3 |
| Élevé | 13 |
| Moyen | 14 |
| Faible / observation | 7 |
| Conformités positives documentées | 9 |

### Instantané de readiness par domaine (indicatif, avant remédiation)

| Domaine ISO | État | Commentaire |
|---|---|---|
| Contrôle d'accès (A.5.15, A.8.2/8.3) | **Faible** | Cloisonnement contournable (F-01, F-02, F-05) |
| Authentification (A.8.5) | **Faible** | 0 MFA sur 28 comptes ; sessions de facto permanentes |
| Protection des données / PII (A.5.34, A.8.11) | **Faible** | PII exposée sur portail public ; pas de rétention |
| Journalisation & traçabilité (A.8.15/8.16) | **Partiel** | Journal existant mais altérable (vue, pas append-only) |
| Gestion des vulnérabilités (A.8.8) | **Faible** | CVE Next non corrigée, pas de scan de dépendances |
| Développement sécurisé / CI (A.8.25–8.32) | **Faible** | Aucune CI/CD, aucun test sécurité, migrations manuelles |
| Sauvegarde / continuité (A.8.13, A.5.29/5.30) | **Non couvert** | Aucune stratégie documentée ni testée |
| Documentation SMSI | **Non couvert** | Aucun corpus documentaire ISO (ce dossier est le point de départ) |

---

## 2. Registre des constats consolidé

Les constats issus des cinq axes d'audit (API, Web, Mobile, Base de données, Ops/CI) ont été
dédupliqués. Chaque entrée indique les identifiants d'origine entre parenthèses.

### F-01 — CRITIQUE — Auto-modification de la compagnie/aéroport : évasion de tenant complète
*(DB-01, WEB-01)* — **Statut ISO : Non conforme** (A.5.15, A.8.2, A.8.3)

- **Fichiers :** `supabase/migrations/20260601000007_profiles_self_update.sql`,
  `supabase/migrations/20260819000001_profiles_airline_partition.sql`.
- **Preuve (vérifiée en base) :** la policy `profiles_self_update` est
  `using (id = auth.uid()) with check (id = auth.uid())` et le trigger
  `lock_protected_profile_fields()` ne contient que :
  ```sql
  if public.auth_role() <> 'admin' then
    new.id := old.id; new.role := old.role;   -- airline_code / airport_code NON figés
  end if;
  ```
- **Risque :** `auth_airline()`, `auth_airport()` et `flight_in_scope()` lisent
  `profiles.airline_code`/`airport_code`. Un `PATCH /rest/v1/profiles` par un agent
  authentifié réattribue son propre périmètre → lecture des données de toute compagnie /
  aéroport. Le cloisonnement des migrations 07/2026 et 08/2026 est intégralement contournable.
- **Correction :** étendre le trigger pour figer `airline_code` et `airport_code` (et `gate`)
  pour tout non-admin.
- **Preuve d'audit attendue :** test PostgREST montrant le rejet d'un `PATCH airline_code` par
  un agent ; dump du trigger corrigé.

### F-02 — CRITIQUE — Écriture directe en base par le rôle agent : anti-fraude contournable
*(DB-02, DB-03, MOB-01)* — **Statut ISO : Non conforme** (A.8.3, A.8.26)

- **Fichiers :** `supabase/migrations/20260601000003_rls_policies.sql` (policies toujours
  actives), non resserrées par `20260719000001_airline_partition.sql`.
- **Preuve (vérifiée en base) :** `baggage_agent_update` =
  `using (auth_role() in ('admin','supervisor','agent'))` sans restriction de colonne ni de
  périmètre ; `passengers_agent_insert`, `passenger_legs_agent_insert`, `baggage_agent_write`,
  `fraud_alerts_insert` ne vérifient que le rôle, jamais `flight_in_scope(flight_id)`.
- **Risque :** l'app mobile est vertueuse (elle écrit via l'API), mais rien n'oblige à passer
  par elle. Avec la clé anon (dans le bundle) + un JWT agent, on écrit directement via
  PostgREST : confirmer un bagage sans contrôle, insérer un passager sur le vol d'une autre
  compagnie, réécrire `tag_number`/`serial_number`/`passenger_id`. Les 5 règles « non
  négociables » ne sont pas défendues en profondeur.
- **Correction :** retirer les droits INSERT/UPDATE directs au rôle `agent` (le mobile n'écrit
  jamais en direct — impact fonctionnel nul, à confirmer pour le dashboard web) et/ou ajouter
  `flight_in_scope(flight_id)` aux WITH CHECK/USING + trigger figeant les colonnes sensibles et
  validant le quota.
- **Preuve d'audit attendue :** export `pg_policies` sans droit d'écriture direct agent + test
  d'intrusion (UPDATE `is_confirmed` avec JWT agent rejeté).

### F-03 — CRITIQUE — Next.js 15.1.3 : contournement d'authentification middleware (CVE-2025-29927)
*(OPS-04)* — **Statut ISO : Non conforme** (A.8.8)

- **Preuve (vérifiée) :** `node_modules/next` = `15.1.3` ; les 4 apps déclarent `"next": "15.1.3"`.
  L'auth des pages du dashboard repose sur `apps/web/middleware.ts` (redirection `/login`).
  Next < 15.2.3 est vulnérable au bypass via l'en-tête `x-middleware-subrequest`.
  `scripts/fix-repos.mjs` documente une montée en 15.3.3 sur les snapshots de déploiement,
  **jamais reportée dans le monorepo** (source de vérité).
- **Atténuation :** les routes `/api/admin/*` revérifient le rôle côté serveur → l'impact
  porte sur l'affichage des pages, pas sur les mutations de données.
- **Correction :** aligner le monorepo sur Next ≥ 15.3.3, `npm audit fix`, vérifier la version
  réellement servie en prod.
- **Preuve d'audit attendue :** registre des vulnérabilités, preuve de la version déployée,
  délai de remédiation conforme à la politique.

### F-04 — ÉLEVÉ — Portail public de suivi : exposition de PII passager énumérable
*(WEB-02)* — **Statut ISO : Partiellement conforme** (A.5.34, A.8.11)

- **Fichier :** `apps/tracking/app/api/track/route.ts`, `apps/tracking/src/supabase/admin.ts`.
- **Preuve :** endpoint **public non authentifié** utilisant `service_role` (bypass RLS). Une
  recherche par PNR (7 caractères) ou étiquette (10 chiffres) renvoie nom complet, PNR,
  itinéraire, n° et date de vol, statut d'embarquement. Rate-limit 30/min par IP, mais IP tirée
  de `X-Forwarded-For` non validé (usurpable) → énumération ciblée non bloquée.
- **Risque :** à partir d'une étiquette photographiée ou d'un PNR, un tiers obtient identité +
  itinéraire d'un passager. Divulgation de données personnelles, profilage.
- **Correction :** exiger un second facteur de correspondance (nom + PNR, ou date de vol) ;
  masquer le nom ; durcir le rate-limit ; ne pas faire confiance à `X-Forwarded-For` brut.
- **Preuve d'audit attendue :** analyse d'impact PII (registre de traitement), spécification du
  contrôle d'accès du portail, tests d'énumération.

### F-05 — ÉLEVÉ — API en service_role sans vérification de compagnie : IDOR horizontal
*(API-03)* — **Statut ISO : Non conforme** (A.8.3, A.5.15)

- **Fichiers :** `packages/api/src/auth.ts` (le preHandler ne charge que `role`, `airport_code`,
  jamais `airline_code`) ; `packages/api/src/routes/scan.ts` (`stationDenial()` ne contrôle que
  l'aéroport, jamais `flights.airline_code`).
- **Risque :** l'API tourne en `service_role` et ignore la RLS. La partition par compagnie
  n'existe donc **pas** sur le chemin API : un agent de la compagnie A à FIH peut scanner /
  confirmer / charger les bagages d'un vol de la compagnie B au même aéroport en devinant un
  `flightId`.
- **Correction :** charger `airline_code` dans `authenticate()` et refuser dans `stationDenial()`
  tout vol dont la compagnie ne correspond pas.
- **Preuve d'audit attendue :** matrice de contrôle d'accès, test 403 inter-compagnies via l'API.

### F-06 — ÉLEVÉ — Erreurs d'écriture Supabase ignorées, y compris l'insertion des alertes fraude
*(API-05)* — **Statut ISO : Non conforme** (A.8.16)

- **Fichier :** `packages/api/src/routes/scan.ts` — écritures sans contrôle de `error` :
  `passenger_legs`, upsert `baggage`, résolution auto d'alertes, **insertion `fraud_alerts`**,
  confirmation de bagage, et tous les updates rush/in_hold/soute/dolly/arrivee/boarded.
- **Risque :** un rejet anti-fraude peut être annoncé à l'agent alors que l'alerte n'a jamais
  été écrite → superviseur non prévenu, aucune trace. Idem pour un bagage « accepté » non
  réellement confirmé.
- **Correction :** vérifier `error` sur chaque écriture ; pour `fraud_alerts` et la confirmation,
  retourner un 500 explicite plutôt qu'un succès mensonger ; logguer les échecs.
- **Preuve d'audit attendue :** revue de code + test simulant un échec d'insertion.

### F-07 — ÉLEVÉ — Aucune MFA sur des comptes sensibles (admin/superviseur)
*(nouveau, vérifié en base)* — **Statut ISO : Non conforme** (A.8.5)

- **Preuve (vérifiée) :** `auth.mfa_factors` = 0 sur 28 comptes, dont **5 admins et 16
  superviseurs**. La configuration Auth n'impose aucun second facteur.
- **Risque :** un mot de passe admin/superviseur compromis (poste web, phishing) donne un accès
  complet sans second facteur — sur un système anti-fraude alimentant des interventions
  physiques.
- **Correction :** activer et **imposer** la MFA (TOTP) pour les rôles admin et superviseur ;
  documenter la politique d'enrôlement.
- **Preuve d'audit attendue :** politique MFA, export du taux d'enrôlement, capture de la
  configuration d'obligation.

### F-08 — ÉLEVÉ — Aucune limitation de débit ni protection brute force sur l'API
*(API-01)* — **Statut ISO : Non conforme** (A.8.6, A.8.20)

- **Fichier :** `packages/api/src/server.ts` (aucun `@fastify/rate-limit` ; grep négatif sur
  tout `packages/`).
- **Risque :** chaque `/scan/*` déclenche 2 appels Supabase pour l'auth ; martèlement =
  amplification vers Supabase ; un token volé énumère les `flightId` sans frein.
- **Correction :** `@fastify/rate-limit` global + limite serrée sur les routes de scan (par IP et
  par utilisateur).
- **Preuve d'audit attendue :** configuration du plugin, test de charge montrant le 429.

### F-09 — ÉLEVÉ — Suppression d'un vol : destruction en cascade des preuves (alertes comprises)
*(DB-08)* — **Statut ISO : Non conforme** (A.5.33, A.8.15)

- **Fichiers :** `supabase/migrations/20260601000001_initial_schema.sql` (FK `on delete cascade`
  sur `passengers`/`baggage`/`fraud_alerts`), `flights_manage` en `FOR ALL`.
- **Risque :** `flights_manage` étant `FOR ALL`, un **superviseur** (pas seulement un admin) peut
  `DELETE` un vol de son périmètre ; les FK en cascade effacent alors tous les passagers, legs,
  bagages et **toutes les `fraud_alerts`** du vol. Un superviseur complice peut faire disparaître
  les preuves en une requête, sans trace.
- **Correction :** retirer `DELETE` de `flights_manage` (policies séparées par opération) ; passer
  `fraud_alerts.flight_id` en `on delete restrict`/`set null` ; réserver la suppression de vol à
  une procédure admin journalisée.
- **Preuve d'audit attendue :** test de suppression rejeté pour supervisor, politique de
  conservation des alertes.

### F-10 — ÉLEVÉ — Journal d'audit altérable : vue dérivée de données mutables, non append-only
*(DB-04)* — **Statut ISO : Non conforme** (A.8.15, A.8.16, A.5.33)

- **Fichier :** `supabase/migrations/20260817000001_movement_log.sql`.
- **Preuve (vérifiée) :** `movement_log` est une **vue** (`security_invoker=true`, filtre admin,
  `revoke all from anon` — bons points) qui déplie les colonnes `*_at`/`*_by` des tables
  opérationnelles. Via F-02, un agent peut réécrire `scanned_at`/`scanned_by`, donc falsifier
  rétroactivement le journal ; `fraud_alerts_resolve` autorise l'UPDATE de toutes les colonnes de
  l'alerte ; `baggage_disputes_write` (`FOR ALL`) permet le DELETE de lignes de litige.
- **Correction :** table d'audit **append-only** alimentée par triggers AFTER (INSERT système
  uniquement, aucun UPDATE/DELETE) ; a minima fermer F-02 et restreindre `fraud_alerts_resolve`
  aux colonnes `resolved`/`resolved_at`/`resolved_by`.
- **Preuve d'audit attendue :** politique de journalisation, démonstration d'inaltérabilité,
  durée de rétention.

### F-11 — ÉLEVÉ — Token de session mobile en clair (AsyncStorage) + sauvegarde Android active
*(MOB-02)* — **Statut ISO : Non conforme** (A.8.1, A.8.24)

- **Fichiers :** `apps/mobile/src/supabase.ts` (storage = `AsyncStorage`), `apps/mobile/package.json`
  (`expo-secure-store` absent), `apps/mobile/app.json` (`allowBackup` non désactivé).
- **Risque :** access + refresh token en clair dans le sandbox ; PDA perdu/volé + adb/root →
  refresh token valide récupéré. Combiné à F-02, écriture directe en base de prod.
- **Correction :** stocker le token via `expo-secure-store` (Keystore) ; désactiver `allowBackup`
  via `expo-build-properties`.
- **Preuve d'audit attendue :** code client montrant SecureStore, manifeste APK `allowBackup=false`.

### F-12 — ÉLEVÉ — Comptes agents partagés, pas de révocation d'appareil à distance
*(MOB-03)* — **Statut ISO : Non conforme** (A.5.16, A.5.18, A.8.5)

- **Fichiers :** `apps/mobile/src/supabase.ts` (`signOutLocal`, `scope: 'local'`, partage assumé),
  `apps/mobile/src/auth.tsx`.
- **Risque :** (1) imputabilité impossible — `scanned_by` ne distingue pas l'agent physique ;
  (2) déconnexion locale seulement, aucun kill-switch à distance d'un PDA perdu.
- **Correction :** comptes nominatifs par agent ; procédure + bouton admin « révoquer toutes les
  sessions » + rotation de mot de passe. Si le partage est maintenu, le formaliser comme risque
  accepté et compenser par un identifiant d'appareil.
- **Preuve d'audit attendue :** politique de gestion des comptes, journal des révocations.

### F-13 — ÉLEVÉ — Absence totale de CI/CD
*(OPS-03)* — **Statut ISO : Non conforme** (A.8.25, A.8.28, A.8.29, A.8.32)

- **Preuve :** aucun `.github/workflows` ni équivalent ; pas de config ESLint committée ; pas de
  secret scanning ni de scan de dépendances ; `main` est la branche de travail directe.
- **Risque :** rien n'empêche un commit cassé, une régression anti-fraude ou un secret d'atteindre
  la prod.
- **Correction :** workflow GitHub Actions (`npm ci`, `typecheck`, `test`, `npm audit`, gitleaks) +
  protection de branche `main`.
- **Preuve d'audit attendue :** pipeline versionné, journaux d'exécution, règle de protection de
  branche.

### F-14 — ÉLEVÉ — Aucune séparation dev / staging / prod ; migrations appliquées à la main
*(OPS-07, DB-06)* — **Statut ISO : Non conforme** (A.8.31, A.8.32, A.8.9)

- **Preuve :** un seul projet Supabase de prod ; fichiers racine `migration_airport_scope.sql` /
  `migration_soute.sql` (« à exécuter UNE SEULE FOIS dans le SQL Editor ») hors chaîne de
  migration ; colonnes `baggage.soute*` et `profiles.airport_code/airline_code` créées uniquement
  par ces fichiers racine alors que des migrations versionnées en dépendent → `supabase db reset`
  échouerait. `bootstrap.sql` est un instantané périmé (policies `using(true)`).
- **Risque :** toute erreur frappe directement les données réelles ; l'état de prod n'est pas
  reproductible depuis le dépôt.
- **Correction :** projet Supabase de staging (ou branches) ; intégrer les fichiers racine comme
  migrations horodatées idempotentes ; appliquer via `supabase db push` ; marquer `bootstrap.sql`
  obsolète ; valider par `supabase db reset` en CI.
- **Preuve d'audit attendue :** cartographie des environnements, `supabase db diff` vide,
  journal des migrations par environnement.

### F-15 — ÉLEVÉ — Aucune stratégie de sauvegarde / reprise (DR) documentée ni testée
*(OPS-09)* — **Statut ISO : Non conforme** (A.8.13, A.5.29, A.5.30)

- **Preuve :** aucune occurrence de `backup|restore|PITR|RPO|RTO` dans `docs/`, `supabase/`,
  `README`, `CLAUDE.md`. `docs/` contient de bons manuels utilisateurs mais rien sur la
  restauration.
- **Risque :** données de prod (passagers, bagages, alertes) sans garantie documentée de
  restauration ; PITR non prouvé.
- **Correction :** documenter et **tester** : sauvegardes Supabase (rétention, PITR), export
  `pg_dump` chiffré hors plateforme, procédure de restauration, RPO/RTO cibles.
- **Preuve d'audit attendue :** politique de sauvegarde, test de restauration daté, capture de
  la configuration Supabase.

### F-16 — ÉLEVÉ — Scripts d'exploitation en prod : mot de passe par défaut, TLS non vérifié
*(OPS-08)* — **Statut ISO : Partiellement conforme** (A.8.2, A.8.32)

- **Fichiers :** `scripts/create-agent.mjs` (mot de passe par défaut `agent1234`),
  `scripts/apply-bootstrap.mjs` (`ssl: { rejectUnauthorized: false }`),
  `scripts/repair-data.mts` (réécriture massive sans dry-run ni sauvegarde),
  `scripts/fix-repos.mjs` (commit+push auto vers les snapshots → déploiement sans revue).
  Point positif : aucun credential en dur.
- **Correction :** supprimer le mot de passe par défaut (exiger un argument ou générer
  aléatoirement + changement forcé) ; `rejectUnauthorized: true` avec le CA Supabase ;
  `--dry-run` par défaut sur `repair-data` ; revue avant push de déploiement.
- **Preuve d'audit attendue :** procédure d'exploitation, journal d'exécution horodaté, liste des
  détenteurs de la clé service_role.

### F-17 — ÉLEVÉ (atténué par la configuration actuelle) — Rôle dérivé des métadonnées d'inscription
*(DB-05, MOB-06, OPS-11)* — **Statut ISO : Partiellement conforme** (A.5.16, A.8.2)

- **Fichier :** `supabase/migrations/20260718000001_security_hardening.sql` — `handle_new_user()`
  accepte `role` depuis `raw_user_meta_data` avec whitelist incluant `admin`.
- **Preuve d'atténuation (vérifiée par moi ce jour) :** la configuration Auth du projet renvoie
  `disable_signup: true` et `mailer_autoconfirm: false`. **L'auto-inscription publique est donc
  fermée en l'état** — le risque d'auto-attribution du rôle admin n'est pas exploitable
  actuellement. Mais ce réglage vit hors du dépôt (non versionné, non prouvable dans le code) et
  peut être réactivé.
- **Risque résiduel :** si le signup est réactivé, n'importe qui se crée un compte admin.
- **Correction :** ne jamais accepter `admin` depuis les métadonnées (défaut `agent`, promotion
  par un admin existant uniquement) ; figer la configuration Auth as-code (`supabase/config.toml`).
- **Preuve d'audit attendue :** export daté de la config Auth (signup OFF), procédure
  d'attribution des rôles, revue périodique des comptes admin.

---

### Constats de sévérité MOYENNE

| ID | Constat | Origine | Fichier principal | Contrôle ISO |
|---|---|---|---|---|
| F-18 | Validation d'entrées API sans schémas JSON (`flightId` non validé UUID, chaînes non bornées) | API-02 | `packages/api/src/routes/scan.ts` | A.8.26 |
| F-19 | Contrôle de périmètre « fail open » (vol introuvable ou profil sans aéroport → autorisé) | API-04 | `packages/api/src/routes/scan.ts`, `packages/shared/src/flight.ts` | A.5.15 |
| F-20 | Conditions de course sur le quota bagages (règle 3) et l'unicité des alertes | API-06 | `packages/api/src/routes/scan.ts` | A.8.26 |
| F-21 | Autorisation trop large : `/scan/*` ouvert à admin/supervisor/agent indistinctement | API-07 | `packages/api/src/auth.ts` | A.5.3, A.5.15 |
| F-22 | Réclamation publique : réouverture de litiges résolus + injection de formule CSV/Excel | WEB-03 | `apps/tracking/app/api/claim/route.ts` | A.8.3, A.8.28 |
| F-23 | Rapport litige : contrôle de rôle implicite (RLS seule, pas de vérif serveur explicite) | WEB-04 | `apps/litige/app/api/report/route.ts` | A.8.2 |
| F-24 | Absence d'en-têtes de sécurité HTTP (CSP, X-Frame-Options, HSTS, nosniff) sur les 4 apps | WEB-05 | `apps/*/next.config.js` | A.8.9, A.8.23 |
| F-25 | Injection de formule Excel dans les rapports (nom passager, notes de litige) | WEB-07 | `apps/web/app/api/report/route.ts`, `apps/litige/.../report/route.ts` | A.8.28 |
| F-26 | Session mobile de facto permanente (refresh silencieux, pas d'expiration d'inactivité) | MOB-04 | `apps/mobile/src/supabase.ts`, `api.ts` | A.8.5 |
| F-27 | Pas de mécanisme OTA : correctifs de sécurité diffusés manuellement par APK | MOB-08 | `apps/mobile/eas.json`, `app.json` | A.8.8, A.8.19 |
| F-28 | Version régressive de `handle_new_user` (SECURITY DEFINER sans search_path) dans un fichier racine | DB-07 | `migration_airport_scope.sql` | A.8.28, A.8.32 |
| F-29 | Aucune politique de conservation / minimisation des données passager (`raw_bcbp` conservé indéfiniment) | DB-09 | `supabase/migrations/20260601000001_initial_schema.sql` | A.5.34, A.8.10 |
| F-30 | Valeurs de production réelles (URL projet + clé anon) dans `.env.example` mobile versionné | OPS-01, MOB-05 | `apps/mobile/.env.example` | A.8.24 |
| F-31 | Aucun test de sécurité (RBAC/RLS/routes API) ; apps web en `--passWithNoTests` | OPS-05 | `apps/*`, `supabase/migrations` | A.8.29 |
| F-32 | Dépendances en ranges caret sans audit automatisé (Dependabot/`npm audit`) | OPS-06 | tous les `package.json` | A.8.8, A.5.21 |
| F-33 | Protection « mot de passe compromis » (HaveIBeenPwned) désactivée dans Auth | advisor Supabase | Configuration Auth | A.8.5 |

### Constats FAIBLES / observations

| ID | Constat | Origine | Contrôle ISO |
|---|---|---|---|
| F-34 | Pas de gestionnaire d'erreurs global Fastify : un message interne peut fuiter en 500 | API-08 | A.8.26 |
| F-35 | Détails d'erreur PostgREST (PNR/siège possible) loggués sur incident | API-09 | A.8.15 |
| F-36 | `.env` API réel présent en clair sur le poste dev ; `--env-file=.env` dans le script `start` | API-10 | A.8.24 |
| F-37 | Ni CORS, ni helmet, ni `requestTimeout`/`connectionTimeout` sur l'API | API-11 | A.8.20, A.8.26 |
| F-38 | Parser boarding tolère PNR/siège vide ; pas de fuzzing ; dérive doc CLAUDE.md (`slice(4,7)` vs `slice(4,10)`) | API-13 | A.8.26, A.8.29 |
| F-39 | Confiance dans `X-Forwarded-For` pour le rate-limit du portail public | WEB-06 | A.8.6 |
| F-40 | Hygiène du dépôt : profils navigateur dans `docs/` (non suivis mais dans l'arbre), fichier verrou `~$*.docx`, SQL racine, arbre de travail non committé | OPS-10 | A.5.37, A.8.32 |

---

## 3. Conformités positives à documenter comme preuves

Ces points sont **conformes** et doivent être conservés + formalisés comme preuves lors de
l'audit :

- **Anti-fraude appliqué côté serveur et testé** (API-12) : `packages/api/src/fraud.ts`
  (`evaluateBaggageScan`, fonction pure) applique les 5 règles ; 11 tests dans `fraud.test.ts`.
- **Identité dérivée du JWT** : `scanned_by` = `request.authUserId`, le champ du corps est ignoré.
- **`service_role` confinée au serveur** : jamais dans un bundle mobile/web ni en
  `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`.
- **Aucun secret serveur committé** : `.gitignore` correct, seuls les `.env.example` sont suivis,
  aucune clé `service_role` dans les 88 commits.
- **Routes `/api/admin/*` (web)** : double barrière (rôle `admin` vérifié serveur + filtre
  `airline_code` + RLS `profiles_admin_write`), protection IDOR sur delete-user.
- **Mobile privacy-by-design** : aucune donnée passager en local (seulement le token + 2
  préférences), aucun `console.log` de PII, tout en HTTPS.
- **Fonctions SECURITY DEFINER durcies** dans la chaîne de migrations (`set search_path=public`,
  GRANTs réduits) — sauf la version racine régressive (F-28).
- **Contraintes d'intégrité métier** : UNIQUE `(flight_id, pnr, seat)`, UNIQUE
  `(flight_id, tag_number)`, colonne générée `flights.airline_code` non falsifiable.
- **Accès anonyme** : aucune policy `TO anon`, aucun GRANT anon ; les portails publics écrivent
  via `service_role` côté serveur uniquement.

> Réserve (advisor Supabase) : les fonctions `auth_role/auth_airline/auth_airport/flight_in_scope`
> sont exécutables par le rôle `authenticated` via RPC. C'est **intentionnel** (elles servent la
> RLS) et à faible risque, mais à documenter dans la SoA comme choix assumé.

---

## 4. Plan de remédiation proposé (ordre)

Conforme à la méthode de la mission (étapes 3 à 11). À exécuter **après validation** de ce
rapport ; chaque correctif devra préserver les workflows en production.

1. **Vulnérabilités critiques d'abord :** F-01 (trigger profils — 2 lignes), F-02 (RLS
   d'écriture), F-03 (Next ≥ 15.3.3). Ce sont les trois portes ouvertes.
2. **Authentification / RBAC / RLS :** F-05 (cloisonnement compagnie dans l'API), F-07 (MFA
   admin/superviseur), F-08 (rate limiting), F-09 (cascade de suppression), F-17/F-33
   (config Auth as-code), F-21 (rôles par route).
3. **Journalisation & traçabilité :** F-10 (table d'audit append-only), F-06 (erreurs d'écriture
   non ignorées).
4. **Protection des données & secrets :** F-04 (PII portail public), F-11 (SecureStore),
   F-29 (rétention), F-30/F-36 (hygiène des secrets), F-22/F-25 (injection formule).
5. **Sauvegarde / monitoring / incidents :** F-15 (DR testée), monitoring, procédures d'incident.
6. **Secure SDLC / CI :** F-13 (CI/CD), F-14 (environnements + migrations versionnées),
   F-31 (tests sécurité), F-32 (scan dépendances), F-16 (scripts).
7. **Documentation ISO 27001 :** corpus `/docs/iso27001/` (politiques, registre des risques,
   SoA, registre des preuves), puis dashboard de readiness alimenté par de vrais contrôles.

---

## 5. Ce qui est prêt vs ce qui reste à faire

**Déjà solide (à formaliser en preuves) :** logique anti-fraude serveur testée, confinement
`service_role`, identité dérivée du JWT, absence de secrets serveur committés, routes admin web à
double barrière, hygiène mobile (pas de PII locale, HTTPS, pas de logs sensibles), contraintes
d'intégrité en base, configuration Auth actuelle avec signup fermé.

**À faire avant de contacter un organisme certificateur :** fermer les 3 critiques et les 13
élevés ; mettre en place MFA, rate limiting, journal inaltérable, sauvegarde testée, CI/CD,
séparation des environnements et migrations reproductibles ; rédiger le corpus documentaire SMSI
(politiques, analyse et registre des risques, SoA, registre des preuves, plan d'audit interne) ;
et produire les preuves d'application de chaque contrôle (tests, exports de configuration,
journaux).

---

*Rapport généré en phase d'audit. Prochaine étape : validation de ce rapport, puis démarrage de
la remédiation dans l'ordre ci-dessus, à votre demande.*
