# Développement

Guide d'installation et de contribution au monorepo. Pour la présentation du
projet, voir [README.md](./README.md) ; pour la spécification fonctionnelle
complète, voir [CLAUDE.md](./CLAUDE.md).

---

## Architecture (monorepo Turborepo)

```
apps/
  mobile/   → React Native + Expo (agents Zebra Android)
  web/      → Next.js dashboard superviseur/admin
  vols/     → Next.js tableau des vols public
packages/
  api/          → Fastify backend (logique anti-fraude)
  bcbp-parser/  → Parser boarding pass IATA + étiquettes bagage
  shared/       → Types TypeScript partagés
supabase/
  migrations/   → migrations SQL (schéma, trigger, RLS, realtime)
  seed.sql      → codes compagnies
  config.toml   → config Supabase local
```

| Couche | Techno |
|---|---|
| Mobile | React Native 0.76 + Expo SDK 52 + Expo Router 4 |
| Web | Next.js 15 (App Router) + @supabase/ssr |
| Backend | Node + Fastify 5 |
| DB / Auth / Realtime / Storage | Supabase (PostgreSQL) |
| Parser BCBP | librairie npm `bcbp` v6 |
| Parser étiquette | fonction custom (`parseBaggageTag`) |

> Aucune dépendance LLM / Claude API. Le BCBP est un standard IATA, parsé par `bcbp`.

---

## Prérequis

- **Node.js ≥ 20** (testé sur 24.x)
- **npm 11** (gestionnaire du monorepo)
- **Docker Desktop** + **Supabase CLI** — pour lancer la base en local
  ([install](https://supabase.com/docs/guides/cli))
- **Expo Go** ou un device/émulateur Android — pour l'app mobile

---

## Démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Lancer Supabase en local

Depuis la racine (lit `supabase/config.toml`, applique les migrations + le seed) :

```bash
supabase start          # démarre Postgres + Auth + Realtime via Docker
supabase db reset       # applique les migrations puis seed.sql
```

`supabase start` affiche les clés à reporter dans les `.env` :

```
API URL: http://127.0.0.1:54321
anon key: eyJ...           → NEXT_PUBLIC_SUPABASE_ANON_KEY / EXPO_PUBLIC_SUPABASE_ANON_KEY
service_role key: eyJ...   → SUPABASE_SERVICE_ROLE_KEY (backend + admin uniquement)
```

### 3. Configurer les variables d'environnement

Copier chaque `.env.example` en `.env` et y coller les clés ci-dessus :

| Fichier | Variables |
|---|---|
| `packages/api/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT` |
| `apps/web/.env` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_HUB`, `SUPABASE_SERVICE_ROLE_KEY` |
| `apps/vols/.env` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_HUB` |
| `apps/mobile/.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL` |

> La `service_role key` ne doit **jamais** être exposée côté client : elle n'est lue
> que par le backend Fastify et par les routes serveur Next.js (`admin.createUser`).

### 4. Créer le premier compte admin

Aucune UI publique d'inscription (par conception). Créer l'admin initial via SQL ou via
`supabase.auth.admin.createUser`. Le trigger `handle_new_user` remplit alors `profiles`
à partir de `user_metadata` (`full_name`, `role`, `gate`). Une fois cet admin connecté au
dashboard web, il peut créer agents et superviseurs via **/admin**.

### 5. Lancer les services

```bash
# API anti-fraude (port 3001)
npm run dev -w @police/api

# Dashboard web (port 3000)
npm run dev -w @police/web

# Tableau des vols public (port 3004)
npm run dev -w @police/vols

# App mobile (Expo)
npm run dev -w @police/mobile
```

Ou tout en parallèle via Turborepo :

```bash
npm run dev
```

---

## Vérifications

```bash
npm run typecheck       # tsc --noEmit sur tous les packages
npm run test            # vitest (tests parser + anti-fraude)
npm run build           # build complet
```

Les tests anti-fraude (`packages/api/src/fraud.test.ts`) couvrent les **5 règles de rejet**
non négociables ; le parser (`packages/bcbp-parser`) couvre BCBP v6 + étiquettes 10 chiffres.

---

## Rôles & accès

| Rôle | Plateforme | Permissions |
|---|---|---|
| `admin` | Web | Créer/gérer comptes agents & superviseurs |
| `supervisor` | Web | Dashboard temps réel, alertes fraude, rapports |
| `agent` | Mobile | Scan boarding pass + étiquettes bagage |

Les accès sont appliqués par **RLS Postgres** (`supabase/migrations/...rls_policies.sql`),
pas seulement côté UI.

---

## Logique anti-fraude

Cœur pur et testable : [`packages/api/src/fraud.ts`](./packages/api/src/fraud.ts)
(`evaluateBaggageScan`). Les 5 règles de rejet (passager non enregistré, 0 bagage déclaré,
quota dépassé, doublon, mauvais vol) sont décrites dans [CLAUDE.md](./CLAUDE.md) et **ne
doivent jamais être contournées** — toute exception passe par le superviseur manuellement.

---

## Déploiement

Les apps publiques (`apps/vols`, etc.) sont déployées sur Hostinger via des dépôts
**snapshots autonomes** séparés du monorepo (voir [CLAUDE.md](./CLAUDE.md) §« Dépôts Git
& déploiement »). Un nouveau commit sur le dépôt snapshot déclenche le redéploiement.

---

## Notes & limites connues

- **Liaison bagage ↔ passager** : une étiquette physique 10 chiffres ne porte **pas** de PNR.
  Le modèle pré-enregistre les bagages depuis les tags du BCBP au scan d'embarquement et fait
  la correspondance par `serial_number + flight_id + date`. Hypothèse à valider terrain avec
  une vraie étiquette + un vrai boarding pass ET (Ethiopian / Air Congo, code 071).
- **Rapport** : export **CSV** (UTF-8 BOM, séparateur `;`, ouvrable Excel) — pas encore
  PDF/Excel natif.
- **Web** épinglé à **React 18.3** (cohérence avec React Native), pas React 19.
