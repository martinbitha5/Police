# CLAUDE.md — Boarding Pass Scanner System

## 🎯 Contexte du projet

Application de gestion d'embarquement pour aéroport utilisant des PDA Zebra Android pour scanner les boarding pass et étiquettes bagage. Le système lutte activement contre la fraude bagages (colis non déclarés glissés en soute).

**Monorepo Turborepo** contenant :
- `apps/mobile` — React Native + Expo (agents terrain sur Zebra Android)
- `apps/web` — Next.js (dashboard superviseur)
- `packages/api` — Fastify backend
- `packages/bcbp-parser` — Parser boarding pass IATA
- `packages/shared` — Types TypeScript partagés

---

## 🏗️ Stack technique

| Couche | Technologie |
|---|---|
| Mobile | React Native + Expo |
| Web | Next.js (App Router) |
| Backend | Node.js + Fastify |
| Base de données | Supabase (PostgreSQL) |
| Temps réel | Supabase Realtime |
| Auth | Supabase Auth |
| Stockage rapports | Supabase Storage |
| Monorepo | Turborepo |
| Parser boarding pass | librairie npm `bcbp` |
| Parser étiquette bagage | Fonction custom maison |
| LLM | ❌ Aucun — pas de Claude API |

> ⚠️ **Pas de Claude API dans ce projet.** Le BCBP est un standard IATA bien documenté, parsé par la librairie `bcbp`. Les étiquettes bagage sont parsées par une fonction custom. Zéro dépendance LLM.

---

## 📁 Structure du monorepo

```
/
├── apps/
│   ├── mobile/          → React Native + Expo (agents Zebra)
│   └── web/             → Next.js dashboard superviseur
├── packages/
│   ├── api/             → Fastify backend
│   ├── bcbp-parser/     → Parser boarding pass IATA
│   └── shared/          → Types TypeScript partagés (interfaces, enums)
├── turbo.json
└── package.json
```

---

## 📦 Dépôts Git & déploiement

Deux dépôts GitHub **séparés et indépendants** (choix assumé — pas de synchro auto) :

| Dépôt | Contenu | Usage |
|---|---|---|
| [martinbitha5/Police](https://github.com/martinbitha5/Police) | Monorepo complet (mobile, web, api, packages) | Source de vérité du projet |
| [martinbitha5/API-POLICE](https://github.com/martinbitha5/API-POLICE) | **Snapshot autonome de l'API** (`packages/api` + `shared` + `bcbp-parser` + `package.json` racine workspaces) | Déploiement Hostinger Cloud (option A : API autonome) |

> ⚠️ **Le dépôt API-POLICE est un snapshot indépendant**, vit dans un dossier
> séparé (`Desktop/api-police-repo`), **non relié au monorepo**. Modifier l'API
> dans le monorepo ne se propage PAS vers API-POLICE — il faut recopier/repousser
> manuellement. C'est voulu : on garde les deux séparés. Si une synchro devient
> nécessaire, écrire un script dédié plutôt que de relier les deux repos.

Déploiement API sur **Hostinger Cloud** (mutualisé hPanel, fonction « Node.js App ») :
variables d'env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`) à fournir
côté hPanel — jamais committées. Retirer `--env-file=.env` du script `start` en prod.

---

## 🗄️ Schéma base de données Supabase

```sql
-- Profils utilisateurs (agents, superviseurs, admins)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'agent')),
  gate TEXT,                        -- gate assignée à l'agent
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Vols du jour
flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number TEXT NOT NULL,      -- ex: "ET0062"
  origin TEXT NOT NULL,             -- ex: "FIH"
  destination TEXT NOT NULL,        -- ex: "FBM"
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',  -- scheduled | boarding | closed
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Passagers enregistrés (depuis scan boarding pass)
passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID REFERENCES flights(id),
  full_name TEXT NOT NULL,
  pnr TEXT NOT NULL,                -- ex: "EYFMKNE"
  seat TEXT,                        -- ex: "13A"
  class TEXT,                       -- ex: "Y" (Economy)
  sequence_number INT,
  declared_baggage_count INT DEFAULT 0,  -- source de vérité anti-fraude
  raw_bcbp TEXT,                    -- données brutes conservées
  scanned_at TIMESTAMPTZ DEFAULT now(),
  scanned_by UUID REFERENCES profiles(id),
  UNIQUE(pnr, flight_id)
)

-- Legs (escales par passager)
passenger_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES passengers(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  flight_number TEXT,
  leg_order INT NOT NULL             -- ordre des escales : 1, 2, 3...
)

-- Bagages
baggage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES passengers(id),
  flight_id UUID REFERENCES flights(id),
  tag_number TEXT NOT NULL UNIQUE,   -- numéro complet 10 chiffres
  issuer_code TEXT,                  -- chiffre 1
  airline_numeric_code TEXT,         -- chiffres 2-4
  serial_number TEXT,                -- chiffres 5-10
  is_confirmed BOOLEAN DEFAULT false,-- true = étiquette physique scannée
  scanned_at TIMESTAMPTZ DEFAULT now(),
  scanned_by UUID REFERENCES profiles(id)
)

-- Alertes fraude
fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID REFERENCES flights(id),
  pnr TEXT,
  passenger_name TEXT,
  tag_number TEXT,                   -- étiquette tentée
  declared_baggage_count INT,        -- ce que le boarding pass dit
  gate TEXT,
  reason TEXT,                       -- description de l'alerte
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Codes compagnies aériennes
airline_codes (
  numeric_code TEXT PRIMARY KEY,     -- ex: "071"
  iata_code TEXT,                    -- ex: "ET"
  name TEXT                          -- ex: "Ethiopian / Air Congo"
)
```

---

## 🔐 Rôles et accès

| Rôle | Plateforme | Permissions |
|---|---|---|
| `admin` | Web uniquement | Créer/gérer comptes agents et superviseurs |
| `supervisor` | Web uniquement | Dashboard, rapports, alertes fraude |
| `agent` | Mobile uniquement | Scan boarding pass et étiquettes bagage |

### Création de compte (admin)

```typescript
// Création immédiate sans confirmation email
const { data, error } = await supabase.auth.admin.createUser({
  email: 'agent@airport.com',
  password: 'motdepasse',
  email_confirm: true,    // actif immédiatement
  user_metadata: {
    full_name: 'Jean Mukeba',
    role: 'agent',
    gate: 'Gate 3'
  }
})
```

---

## 📱 App Mobile — Flux complet

### Écran 1 : Login
```
Email + mot de passe
→ supabase.auth.signInWithPassword()
→ Récupère profil depuis table profiles
→ Redirige vers Écran 2
```

### Écran 2 : Sélection du vol
```
Liste des vols du jour filtrée par date
→ Agent sélectionne son vol assigné
→ Stocke flight_id en contexte local
→ Deux boutons : [ CHECK-IN ] [ BAGAGES ]
```

### Section CHECK-IN — Scan boarding pass

```
┌─────────────────────────────┐
│   ET 0062 | FIH → FBM      │
│   47 / 150 passagers        │
├─────────────────────────────┤
│                             │
│   📷 En attente scan        │
│   boarding pass...          │
│                             │
├─────────────────────────────┤
│ Dernier scan :              │
│ KALONJI KABWE Oscar         │
│ Siège 13A · Éco · 2 bag.   │
│ FIH → FBM                  │
└─────────────────────────────┘
```

**Flux technique :**
```
DataWedge injecte texte brut du boarding pass
→ App reçoit via TextInput (keystroke injection)
→ packages/bcbp-parser parse le BCBP
→ Données structurées extraites
→ INSERT dans passengers + passenger_legs
→ Supabase Realtime notifie le dashboard
→ UI affiche résumé passager
→ Prêt pour prochain scan
```

### Section BAGAGES — Scan étiquettes

```
┌─────────────────────────────┐
│   ET 0062 | FIH → FBM      │
│   🧳 Mode scan bagages      │
├─────────────────────────────┤
│                             │
│   📷 En attente scan        │
│   étiquette bagage...       │
│                             │
├─────────────────────────────┤
│ Dernier scan :              │
│ KALONJI KABWE Oscar         │
│ Tag: 0071161863 ✅          │
│ 1/2 bagages confirmés       │
└─────────────────────────────┘
```

**Flux technique :**
```
DataWedge injecte numéro étiquette (10 chiffres)
→ packages/bcbp-parser/baggage parse le tag
→ Système cherche passager via serial_number + flight_id
→ Vérifie : bagages confirmés < declared_baggage_count ?
  OUI → UPDATE baggage.is_confirmed = true
        → Supabase Realtime notifie dashboard ✅
  NON → ❌ REJET + INSERT fraud_alerts
        → 🚨 Alerte temps réel dashboard superviseur
```

---

## 🧳 Parser étiquette bagage — Format IATA 10 chiffres

```
Exemple : 0 071 161863 002
          │  │     │    │
          │  │     │    └── 3 derniers chiffres : nombre bagages déclarés
          │  │     └─────── 6 chiffres : numéro de série (clé de liaison)
          │  └───────────── 3 chiffres : code numérique compagnie
          └──────────────── 1 chiffre  : Baggage Tag Issuer Code
```

```typescript
// packages/bcbp-parser/src/baggage.ts

export interface ParsedBaggageTag {
  issuerCode: string
  airlineNumericCode: string
  serialNumber: string
  declaredBaggageCount: number
  rawTag: string
}

export function parseBaggageTag(tag: string): ParsedBaggageTag {
  if (tag.length !== 10) {
    throw new Error(`Invalid baggage tag length: ${tag.length}, expected 10`)
  }

  return {
    issuerCode: tag[0],
    airlineNumericCode: tag.slice(1, 4),
    serialNumber: tag.slice(4, 7),         // chiffres 5-7 (index 4-6)
    declaredBaggageCount: parseInt(tag.slice(7, 10)), // 3 derniers
    rawTag: tag
  }
}

// Clé de liaison passager ↔ bagage
export function buildBaggageKey(serialNumber: string, flightId: string, date: string): string {
  return `${serialNumber}-${flightId}-${date}`
}
```

> ⚠️ **Note importante sur ET (Ethiopian / Air Congo)** : Le code numérique "071" correspond à la fois à Ethiopian Airlines et Air Congo — ces deux compagnies partagent le code IATA "ET" sur les routes (ex: FIH-FBM). Ce n'est **pas un bug**. Le système ne se base **jamais** sur le code compagnie pour lier un bagage à un passager. La clé de liaison est toujours : `serial_number + flight_id + date`.

---

## 🔄 Parser boarding pass BCBP

```typescript
// packages/bcbp-parser/src/boarding.ts
import bcbp from 'bcbp'

export interface ParsedBoardingPass {
  fullName: string
  pnr: string
  flightNumber: string
  seat: string
  class: string
  sequenceNumber: number
  declaredBaggageCount: number
  baggageTags: string[]
  legs: {
    origin: string
    destination: string
    flightNumber: string
    order: number
  }[]
  rawBcbp: string
}

export function parseBoardingPass(raw: string): ParsedBoardingPass {
  const parsed = bcbp.decode(raw)

  // Extraire les legs (escales)
  const legs = parsed.legs.map((leg: any, index: number) => ({
    origin: leg.operatingCarrierPNRCode,
    destination: leg.toAirportCode,
    flightNumber: leg.flightNumber,
    order: index + 1
  }))

  return {
    fullName: formatName(parsed.passengerName),
    pnr: parsed.legs[0]?.operatingCarrierPNRCode,
    flightNumber: parsed.legs[0]?.flightNumber,
    seat: parsed.legs[0]?.seatNumber,
    class: parsed.legs[0]?.compartmentCode,
    sequenceNumber: parseInt(parsed.legs[0]?.checkInSequenceNumber),
    declaredBaggageCount: parsed.legs[0]?.baggageAllowance ?? 0,
    baggageTags: extractBaggageTags(parsed),
    legs,
    rawBcbp: raw
  }
}

function formatName(raw: string): string {
  // Format BCBP : "NOM/PRENOM" → "NOM Prenom"
  const [last, first] = raw.split('/')
  return `${last} ${first?.charAt(0).toUpperCase()}${first?.slice(1).toLowerCase()}`
}
```

---

## 🚨 Logique anti-fraude — Règles strictes

### Règle 1 : Bagage sans passager enregistré
```
Étiquette scannée → PNR introuvable en base pour ce vol
→ ❌ REJET
→ 🚨 INSERT fraud_alerts (reason: "Passager non enregistré")
→ Alerte temps réel dashboard
```

### Règle 2 : Bagage sur PNR avec 0 bagage déclaré
```
Étiquette scannée → passenger.declared_baggage_count = 0
→ ❌ REJET
→ 🚨 INSERT fraud_alerts (reason: "0 bagage déclaré sur boarding pass")
→ Alerte temps réel dashboard
→ Message app agent : "Bagage non autorisé — superviseur alerté"
```

### Règle 3 : Nombre de bagages dépassé
```
Étiquette scannée → bagages confirmés >= declared_baggage_count
→ ❌ REJET
→ 🚨 INSERT fraud_alerts (reason: "Quota bagage dépassé")
→ Alerte temps réel dashboard
```

### Règle 4 : Étiquette déjà scannée
```
Étiquette scannée → tag_number déjà dans table baggage avec is_confirmed = true
→ ❌ REJET
→ Message app agent : "Bagage déjà enregistré"
```

### Règle 5 : Étiquette mauvais vol
```
Étiquette scannée → passenger trouvé mais sur un autre flight_id
→ ❌ REJET
→ Message app agent : "Bagage appartient à un autre vol"
```

> ⚠️ **L'agent bagages n'est jamais fautif.** Il scanne ce qui arrive sur le tapis. La fraude vient du comptoir d'enregistrement où une étiquette a été imprimée sur un PNR sans bagage déclaré. Le système intercepte le colis **avant qu'il parte en soute** et alerte le superviseur pour intervention physique.

---

## 🖥️ Web App — Dashboard superviseur

### Sidebar
```
Vols DÉPART du jour (triés par heure)
  ├── ET 0062 FIH→FBM 08h30 🟢
  ├── ET 0105 FIH→FKI 11h00 🟡
  └── ET 0203 FIH→LUN 14h00 ⚪

Vols ARRIVÉE du jour
  ├── ET 0061 FBM→FIH 09h45 🟢
  └── ET 0104 FKI→FIH 12h30 ⚪
```

### Contenu principal (vol sélectionné)
```
ET 0062 | FIH → FBM | 08h30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Passagers : 47 / 150        Bagages : 38 / 72
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 2 ALERTES FRAUDE                [Voir alertes]

PASSAGER              SIÈGE  ROUTE          BAGAGES
KALONJI KABWE Oscar   13A    FIH→FBM        ✅ 2/2
MUKEBA Jean           07C    FIH→FKI→FBM   🔴 0/1
DIASOLWA Marie        22F    FIH→FBM        ✅ 1/1
...

                              [📥 Télécharger rapport]
```

### Alerte fraude temps réel
```
🚨 ALERTE FRAUDE — 14h32
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Passager    : KALONJI KABWE Oscar
PNR         : EYFMKNE
Boarding    : 0 bagage déclaré
Étiquette   : 0071161863002
Vol         : ET 0062 | Gate 3
Raison      : 0 bagage déclaré sur boarding pass
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Intercepter bagage sur tapis Gate 3
[Marquer résolu]
```

### Rapport téléchargeable
Contenu du rapport (PDF ou Excel) :
- En-tête : vol, date, aéroport
- Liste complète passagers : nom, PNR, siège, classe, route, bagages déclarés vs confirmés
- Résumé bagages : total déclarés, total confirmés, écarts
- Liste alertes fraude de la journée : PNR, étiquette, heure, statut résolution
- Stats globales journée : vols traités, passagers, bagages, fraudes détectées

---

## 🔁 Supabase Realtime — Souscriptions

```typescript
// Web app — écoute en temps réel pour un vol
supabase
  .channel(`flight-${flightId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'passengers',
    filter: `flight_id=eq.${flightId}`
  }, (payload) => {
    // Nouveau passager → ajouter à la liste
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'baggage',
    filter: `flight_id=eq.${flightId}`
  }, (payload) => {
    // Bagage confirmé → mettre à jour compteur
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'fraud_alerts',
    filter: `flight_id=eq.${flightId}`
  }, (payload) => {
    // 🚨 Alerte fraude → notification immédiate
  })
  .subscribe()
```

---

## 🔌 DataWedge — Intégration Zebra Android

DataWedge est l'outil Zebra qui intercepte les scans et les injecte comme frappe clavier dans l'app active. **Aucun SDK spécial requis** — fonctionne comme un clavier.

```typescript
// React Native — écoute les scans DataWedge
// Le texte brut arrive dans un TextInput via keystroke injection

const [scanBuffer, setScanBuffer] = useState('')

// TextInput caché qui reçoit les scans
<TextInput
  ref={inputRef}
  style={{ height: 0, width: 0, opacity: 0 }}
  value={scanBuffer}
  onChangeText={setScanBuffer}
  onSubmitEditing={() => handleScan(scanBuffer)}
  autoFocus={true}
  showSoftInputOnFocus={false}  // pas de clavier virtuel
/>
```

Configuration DataWedge recommandée :
- Output : Keystroke
- Terminator : Enter (déclenche onSubmitEditing)
- Prefix/Suffix : aucun
- Scanner : tous types activés (PDF417 pour boarding pass, Code 128 pour étiquettes)

---

## 📋 Scénarios complets

### Scénario 1 — Passager normal, 2 bagages
```
1. Agent CHECK-IN scanne boarding pass KALONJI KABWE Oscar
   → Parser BCBP : nom="KALONJI KABWE Oscar", PNR="EYFMKNE",
     vol="ET0062", siège="13A", classe="Y", 
     legs=[{FIH→FBM}], declared_baggage_count=2
   → INSERT passengers ✅
   → Dashboard : 48/150 passagers

2. Agent BAGAGES scanne étiquette 0071161863002
   → Parser : serial="161863", declared_count=002
   → Trouve passenger EYFMKNE sur vol ET0062
   → Vérifie : 0 confirmés < 2 déclarés ✅
   → UPDATE baggage is_confirmed=true (1/2)
   → Dashboard : bagage 1/2 ✅

3. Agent BAGAGES scanne étiquette 0071161863003
   → Même logique
   → UPDATE baggage is_confirmed=true (2/2)
   → Dashboard : bagage 2/2 ✅ COMPLET
```

### Scénario 2 — Passager 0 bagage, tentative fraude
```
1. Agent CHECK-IN scanne boarding pass DIASOLWA Pierre
   → declared_baggage_count = 0
   → INSERT passengers ✅

2. Agent BAGAGES scanne étiquette 0071161899001
   → Parser trouve passenger DIASOLWA Pierre
   → Vérifie : declared_baggage_count = 0
   → ❌ REJET
   → INSERT fraud_alerts :
     {pnr: "XXXX", passenger: "DIASOLWA Pierre",
      tag: "0071161899001", reason: "0 bagage déclaré",
      gate: "Gate 3"}
   → 🚨 Dashboard superviseur alerte immédiate
   → App agent : "Bagage non autorisé — superviseur alerté"
   → Superviseur envoie agent intercepter le colis physiquement
```

### Scénario 3 — Vol multi-leg FIH → FKI → FBM
```
1. Agent CHECK-IN scanne boarding pass MUKEBA Jean
   → Parser BCBP legs :
     [{origin:"FIH", destination:"FKI", order:1},
      {origin:"FKI", destination:"FBM", order:2}]
   → INSERT passengers + 2 INSERT passenger_legs
   → Dashboard affiche route : FIH → FKI → FBM

2. Dashboard superviseur voit la route complète avec escale
   → Important pour savoir que le bagage doit transiter via FKI
```

### Scénario 4 — Étiquette déjà scannée (doublon)
```
1. Agent BAGAGES scanne étiquette 0071161863002
   → Déjà is_confirmed = true en base
   → ❌ REJET
   → App agent : "⚠️ Bagage déjà enregistré"
   → Pas d'alerte fraude — juste un doublon de scan
```

### Scénario 5 — Boarding pass déjà scanné
```
1. Agent CHECK-IN scanne boarding pass KALONJI KABWE Oscar (2ème fois)
   → UNIQUE(pnr, flight_id) déclenche erreur Supabase
   → App agent : "⚠️ Passager déjà enregistré"
   → Aucune donnée modifiée
```

---

## ⚠️ Règles pour l'IA qui aide sur ce projet

### NE JAMAIS faire sans vérifier d'abord

1. **Avant toute modification de code** → lire le fichier concerné en entier
2. **Avant d'ajouter une fonction** → vérifier qu'elle n'existe pas déjà dans le package
3. **Avant de modifier le schéma Supabase** → vérifier les dépendances (RLS, triggers, foreign keys)
4. **Avant d'installer un package** → vérifier qu'il n'y a pas déjà un équivalent dans le monorepo

### Types partagés — toujours dans `packages/shared`

```typescript
// packages/shared/src/types.ts
// TOUS les types utilisés par mobile + web + api sont ici
// Ne jamais dupliquer un type dans un autre package
```

### Conventions de nommage

```
Tables Supabase    → snake_case (passengers, flight_legs)
Types TypeScript   → PascalCase (ParsedBoardingPass)
Fonctions          → camelCase (parseBaggageTag)
Constantes         → UPPER_SNAKE (MAX_BAGGAGE_COUNT)
Composants React   → PascalCase (FlightCard)
```

### Anti-fraude — ne jamais contourner

Les 5 règles de rejet bagage sont **non négociables**. Ne jamais ajouter de logique qui permettrait de bypass ces règles même pour des "cas particuliers". Toute exception doit passer par le superviseur manuellement.

### Realtime Supabase — toujours unsubscribe

```typescript
// Toujours cleanup les souscriptions
useEffect(() => {
  const channel = supabase.channel(...)
  return () => { supabase.removeChannel(channel) }
}, [flightId])
```

### Code ET (Ethiopian / Air Congo)

Le code numérique "071" = code IATA "ET" = Ethiopian Airlines = Air Congo. C'est **voulu et correct**. Ne pas essayer de distinguer les deux compagnies par le code. La clé de liaison bagage ↔ passager est toujours `serial_number + flight_id + date`.

---

## 🚀 Ordre de développement recommandé

```
Phase 1 — Foundation
  1. Setup monorepo Turborepo
  2. Config Supabase (tables + RLS + Realtime)
  3. packages/shared — types TypeScript
  4. packages/bcbp-parser — parser boarding pass + étiquettes

Phase 2 — Backend
  5. packages/api — Fastify
  6. Routes : POST /scan/boarding, POST /scan/baggage
  7. Logique anti-fraude

Phase 3 — Mobile
  8. Auth (login agent)
  9. Sélection vol
  10. Section CHECK-IN (scan boarding pass)
  11. Section BAGAGES (scan étiquettes)
  12. Intégration DataWedge Zebra

Phase 4 — Web
  13. Auth (login superviseur/admin)
  14. Dashboard temps réel
  15. Sidebar vols départ/arrivée
  16. Alertes fraude
  17. Gestion comptes (admin)
  18. Rapport téléchargeable (PDF/Excel)
```
