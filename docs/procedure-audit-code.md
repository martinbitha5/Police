# Procédure d'audit du code et de la configuration

- Organisation : African Transport Systems (ATS Handling), service CSI
- Périmètre : monorepo `police` (API Fastify, apps web et mobile, base Supabase)
- Référence : annexe pratique du programme d'audit interne AI-06 (lot 5, développement sécurisé, mesures A.8.25 à A.8.32)
- Version : 1.0
- Date : 2026-09-10
- Exemple d'application : `docs/audit-securite-pentest-2026-09-07.md`

## À quoi sert ce document

Le programme AI-06 dit quoi auditer et quand. Ce document dit comment on s'y prend concrètement sur le code et la base, avec les commandes exactes. Il a deux usages :

1. Rejouer l'audit soi-même, à chaque cycle ou après un changement majeur.
2. Montrer à un auditeur externe que la méthode existe, qu'elle est reproductible et que chaque constat repose sur une preuve.

Toute l'approche tient en une phrase : on ne croit pas le code sur parole, on lit ce qui est réellement configuré en production et on rejoue les attaques sans rien modifier.

## Règles à respecter avant de commencer

- **Autorisation écrite.** L'audit est demandé par le propriétaire de l'application. Conserver la demande (mail, ticket) dans le dossier de preuves.
- **Aucune modification de données.** Chaque test en base s'exécute dans une transaction annulée (`rollback`). Aucune ligne de production n'est créée, modifiée ni supprimée.
- **Pas d'action sur l'infrastructure mutualisée.** Pas de scan de ports, pas de scanner de vulnérabilités, pas de test de charge sur l'hébergement Hostinger. Ces actions touchent d'autres locataires et relèvent d'un prestataire mandaté.
- **Indépendance.** La personne qui audite le lot « développement sécurisé » n'est pas celle qui a écrit le code audité (voir AI-06, section 7). Si ce n'est pas possible en interne, l'audit est fait par un tiers et le développeur se limite à fournir les accès.
- **Dossier de preuves.** Créer un dossier daté (`audits/AAAA-MM-JJ/`) hors du dépôt Git. Chaque étape y dépose son export brut (sortie de commande, export SQL, capture).

## Vue d'ensemble des étapes

| Étape | Ce qu'on vérifie | Preuve produite |
|---|---|---|
| 1 | Périmètre et état de la production | Comptages en base, liste des applications déployées |
| 2 | Le code compile et les tests passent | Sortie de `typecheck` et `test` |
| 3 | Aucun secret dans le dépôt | Sortie de gitleaks, revue des `.env.example` |
| 4 | Dépendances sans vulnérabilité connue en production | Sortie de `npm audit` |
| 5 | Lecture du code sur les zones sensibles | Liste des fichiers lus et des constats |
| 6 | Ce que la base applique réellement (RLS, fonctions, triggers) | Export `pg_policies`, advisors Supabase |
| 7 | Rejeu d'attaques en base, transaction annulée | Nombre de lignes touchées sous chaque rôle |
| 8 | Configuration d'authentification | Settings GoTrue, comptage MFA |
| 9 | Résistance des parseurs aux entrées aberrantes | Script de fuzzing et son résultat |
| 10 | Comportement des services en ligne, sans intrusion | En-têtes HTTP, codes 401 et 400 |
| 11 | Rédaction du rapport | Rapport classé par gravité et certitude |
| 12 | Correction, vérification, clôture | Journal des correctifs avec preuve de vérification |

## Étape 1. Fixer le périmètre et photographier la production

Le rapport doit dire sur quoi il porte et dans quel état était le système. Lire en base, sans rien modifier :

```sql
select
  (select count(*) from public.profiles) as comptes,
  (select count(*) from public.profiles where role = 'admin') as admins,
  (select count(*) from public.profiles where role = 'supervisor') as superviseurs,
  (select count(*) from public.profiles where role = 'agent') as agents,
  (select count(*) from public.passengers) as passagers,
  (select count(*) from public.baggage) as bagages,
  (select count(*) from public.fraud_alerts) as alertes,
  (select count(distinct airline_code) from public.flights) as compagnies,
  (select count(distinct origin) from public.flights) as aeroports_origine;
```

Noter aussi la liste des applications en ligne et leur version déployée (voir la topologie : web, tracking, vols, litige, api, plus l'APK mobile). Ce contexte sert ensuite à qualifier l'impact réel d'une faille. Exemple du 7 septembre : une seule compagnie active, donc les failles inter-compagnies étaient réelles dans le code mais sans victime possible à ce jour.

## Étape 2. Vérifier que le socle est sain

Depuis la racine du dépôt, sur un clone propre :

```bash
npm ci
```

```bash
npm run typecheck
```

```bash
npm run test
```

Résultat attendu : zéro erreur de type, tous les tests verts. Les tests qui comptent le plus pour un auditeur sont ceux du parser (`packages/bcbp-parser/src/*.test.ts`) et de l'anti-fraude (`packages/api/src/fraud.test.ts`), parce qu'ils prouvent que les cinq règles de rejet sont testées et non seulement documentées. Conserver la sortie complète dans le dossier de preuves.

## Étape 3. Chercher des secrets dans le dépôt

Deux vérifications :

1. Lancer gitleaks sur tout l'historique (la CI le fait à chaque push, mais l'audit le rejoue localement) :

```bash
npx gitleaks detect --source . --no-banner
```

2. Lire à la main tous les fichiers `.env*` suivis par Git et confirmer qu'ils ne contiennent que des valeurs fictives :

```bash
git ls-files | grep -i "\.env"
```

Point d'attention hérité de l'audit précédent : la clé `service_role` ne doit apparaître que côté serveur, jamais dans une variable `NEXT_PUBLIC_*` ou `EXPO_PUBLIC_*`. Le vérifier avec une recherche :

```bash
grep -rn "SERVICE_ROLE" apps packages --include=*.ts --include=*.tsx -l
```

Chaque fichier remonté doit être un fichier serveur (route API, script admin), jamais un composant ou une page envoyée au navigateur.

## Étape 4. Auditer les dépendances

On sépare ce qui est embarqué en production de ce qui ne sert qu'au build :

```bash
npm audit --omit=dev
```

Puis l'audit complet pour l'hygiène :

```bash
npm audit
```

Pour chaque vulnérabilité critique ou élevée sur une dépendance de production, noter le paquet, la version installée, la version corrigée et la CVE. Vérifier ensuite que la version réellement servie en ligne correspond à celle du dépôt : le snapshot API-POLICE déployé sur Hostinger peut diverger du monorepo, c'est un point de contrôle en soi.

## Étape 5. Lire le code là où le risque se concentre

On ne lit pas tout. On lit dans cet ordre, en entier, les fichiers qui portent la sécurité :

1. **Contrôle d'accès et périmètre.** `packages/api/src/auth.ts` (qui est l'appelant, de quelle compagnie, de quel aéroport), `packages/api/src/routes/scan.ts` (refus si hors périmètre).
2. **Logique anti-fraude.** `packages/api/src/fraud.ts` et son test. Vérifier que les cinq règles sont là, qu'aucune exception ne les contourne et que le comptage se fait côté serveur.
3. **Écritures en base.** Tout appel `.insert`, `.update`, `.upsert`, `.delete` dans `packages/api`, `apps/web`, `apps/tracking`, `apps/litige`, `apps/vols`. Pour chacun : l'erreur est-elle testée ? L'identité vient-elle du JWT ou du corps de requête ?
4. **Endpoints publics sans authentification.** `apps/tracking/app/api/track/route.ts`, `apps/tracking/app/api/claim/route.ts`, `apps/vols/app/api/flights/route.ts`. Quelles données sortent, quel frein contre l'énumération, quelle validation d'entrée.
5. **Migrations SQL.** Tout `supabase/migrations/*.sql` qui touche `policy`, `security definer`, `trigger`, `on delete cascade`.
6. **Configuration des apps.** `apps/*/next.config.js` (en-têtes), `apps/mobile/src/supabase.ts` (stockage du token), `packages/api/src/server.ts` (limites, timeouts, gestion d'erreurs).

Recherches utiles pour ne rien oublier :

```bash
grep -rn "dangerouslySetInnerHTML\|eval(\|new Function" apps --include=*.tsx --include=*.ts
```

```bash
grep -rn "\.from('" packages/api/src apps/web/app apps/tracking/app apps/litige/app | grep -v "\.select"
```

Chaque constat relevé à cette étape est noté « EXPLOITABLE » tant qu'il n'a pas été rejoué (étape 7). La lecture seule ne suffit pas à dire « CONFIRMÉ ».

## Étape 6. Lire ce que la base applique vraiment

Les migrations disent ce qu'on a voulu. Seule la base dit ce qui est en vigueur. Exporter :

```sql
select schemaname, tablename, policyname, cmd, roles,
       qual::text as using_clause, with_check::text as with_check_clause
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Lire cet export ligne par ligne et se poser pour chaque table : les policies d'écriture ont-elles le même périmètre que les policies de lecture ? En septembre, c'est exactement cette divergence qui a donné les trois constats critiques : la lecture était cloisonnée par `flight_in_scope`, l'écriture ne vérifiait que le rôle.

Compléter avec :

```sql
select n.nspname, p.proname, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;
```

```sql
select conrelid::regclass as table_name, conname, confdeltype as on_delete
from pg_constraint
where contype = 'f' and connamespace = 'public'::regnamespace;
```

Un `on_delete = c` (cascade) sur une table de preuves comme `fraud_alerts` est un constat à lui seul.

Lancer enfin les advisors Supabase (onglet Advisors du projet, catégories sécurité et performance) et joindre l'export. Chaque avis de niveau ERROR doit être soit corrigé, soit justifié par écrit dans la déclaration d'applicabilité SOA-03.

## Étape 7. Rejouer les attaques en base, sans rien modifier

C'est l'étape qui transforme une lecture en preuve. Le principe : se placer dans le contexte RLS d'un vrai compte (un agent, un superviseur), tenter l'écriture interdite, compter les lignes touchées, puis annuler.

```sql
begin;
-- Prendre l'identité d'un agent réel (remplacer l'UUID)
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);

-- Test C-01 : un agent ne doit pas pouvoir confirmer un bagage en direct
with tentative as (
  update public.baggage set is_confirmed = true
  where id = (select id from public.baggage limit 1)
  returning 1
)
select count(*) as lignes_modifiees from tentative;

-- Test C-02 : un agent ne doit pas pouvoir changer sa compagnie
update public.profiles set airline_code = 'XX'
where id = '00000000-0000-0000-0000-000000000000';
select airline_code from public.profiles
where id = '00000000-0000-0000-0000-000000000000';

rollback;
```

Lecture du résultat :

- `lignes_modifiees = 0` et `airline_code` inchangé : la mesure fonctionne, on le note comme point positif confirmé.
- `lignes_modifiees = 1` ou `airline_code = 'XX'` : constat CONFIRMÉ, même si la transaction a été annulée.

Refaire le même exercice avec un compte superviseur sur un vol hors de son périmètre, et avec la suppression d'un vol (`delete from public.flights`). Toujours terminer par `rollback`. Consigner pour chaque test : le rôle, la requête, le nombre de lignes, la date.

Cette liste de tests est celle de AI-06, section 4, point 3. Elle doit s'allonger à chaque nouveau constat corrigé : un correctif sans test de non-régression n'est pas clos.

## Étape 8. Vérifier la configuration d'authentification

Trois lectures :

1. Les réglages publics du service d'authentification :

```bash
curl -s https://<ref-projet>.supabase.co/auth/v1/settings -H "apikey: <cle-anon>"
```

Vérifier `disable_signup` (l'inscription publique doit être fermée) et les réglages MFA.

2. L'enrôlement effectif du second facteur :

```sql
select p.role, count(*) as comptes,
       count(f.id) filter (where f.status = 'verified') as avec_mfa
from public.profiles p
left join auth.mfa_factors f on f.user_id = p.id
group by p.role;
```

3. Les advisors Auth (protection contre les mots de passe compromis, expiration des OTP).

Un compte admin ou superviseur sans MFA est un constat, quelle que soit la qualité du code.

## Étape 9. Fuzzer les parseurs

Les parseurs reçoivent ce que le scanner envoie, donc n'importe quoi. Le test consiste à leur envoyer des dizaines de milliers d'entrées aléatoires et à vérifier qu'ils ne plantent jamais et ne renvoient jamais une valeur hors bornes. Script minimal, à exécuter depuis `packages/bcbp-parser` :

```ts
// fuzz-baggage.ts (hors dépôt, dossier de preuves)
import { parseBaggageTag } from './src/baggage';

const alphabet = '0123456789ABCDEFabc /\\\'"{}[]<>éè ￿';
let ok = 0, rejets = 0;
for (let i = 0; i < 200000; i++) {
  const len = Math.floor(Math.random() * 40);
  let s = '';
  for (let j = 0; j < len; j++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  try {
    const r = parseBaggageTag(s);
    if (r.declaredBaggageCount < 0 || r.declaredBaggageCount > 20) throw new Error('borne violée: ' + s);
    ok++;
  } catch (e) {
    if (!(e instanceof Error)) throw e; // seul un Error propre est accepté
    rejets++;
  }
}
console.log({ ok, rejets });
```

```bash
npx tsx fuzz-baggage.ts
```

Même exercice sur `parseBoardingPass` avec des boarding pass encodés volontairement aberrants (trois étiquettes à 999 bagages, par exemple). C'est ce test qui a révélé en septembre l'amplification à 2997 insertions pour un seul scan, et qui a justifié le plafond `MAX_DECLARED_BAGGAGE_PER_TAG`.

## Étape 10. Vérifier les services en ligne, sans intrusion

Uniquement des requêtes que n'importe quel navigateur ferait. Pour chaque hôte (`api-police.brsats.com`, portail web, `tracking`, `vols`, `litige`) :

```bash
curl -sI https://api-police.brsats.com/ | grep -i "strict-transport\|x-frame\|x-content-type\|referrer-policy\|permissions-policy\|x-powered-by"
```

Attendu : les cinq en-têtes de sécurité présents, `X-Powered-By` absent.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api-police.brsats.com/scan/baggage -H "Content-Type: application/json" -d "{}"
```

Attendu : `401` (pas de token). Répéter avec un token invalide, attendu `401` aussi.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api-police.brsats.com/scan/baggage -H "Content-Type: application/json" -H "Authorization: Bearer x" -d "{pas du json"
```

Attendu : `400` propre, sans trace de pile dans le corps.

Enfin, avec la seule clé anon, tenter une lecture de table sensible :

```bash
curl -s "https://<ref-projet>.supabase.co/rest/v1/passengers?select=id&limit=1" -H "apikey: <cle-anon>"
```

Attendu : `[]`. La RLS bloque l'anonyme.

Ce qu'on ne fait pas, et qu'on écrit noir sur blanc dans le rapport : scan de ports, scanner de vulnérabilités, brute force, test de charge.

## Étape 11. Rédiger le rapport

Le rapport suit toujours la même structure, ce qui permet à un auditeur de comparer deux audits :

1. **En-tête** : date, périmètre, méthode, autorisation.
2. **Comment lire** : définition des trois niveaux de certitude.
   - CONFIRMÉE : rejouée pendant l'audit, ou état lu directement en base.
   - EXPLOITABLE : chemin établi par le code, non rejoué.
   - THÉORIQUE : dépend d'une configuration ou d'un état futur.
3. **Contexte de production** (étape 1) et décompte par gravité.
4. **Constats**, un par section, identifiés `C-nn` (critique), `E-nn` (élevée), `M-nn` (moyenne), `F-nn` (faible), `I-nn` (informationnelle). Chaque constat contient exactement ces rubriques :
   - Gravité et certitude
   - Localisation (fichier et lignes, ou objet de base)
   - Description
   - Reproduction (la requête ou la commande exacte)
   - Ce que le test démontre (le résultat brut obtenu)
   - Impact
   - Correction recommandée (avec le code ou le SQL proposé)
   - Vérification (le test qui prouvera la clôture)
5. **Points positifs confirmés.** Un audit qui ne liste que des failles n'est pas complet : l'auditeur doit aussi voir ce qui tient.
6. **Ordre de remédiation conseillé.**

Correspondance avec le modèle de constat d'AI-06 : la « Vérification » du rapport est la « Vérification de clôture » du constat ; la gravité critique ou élevée correspond à une non-conformité majeure, moyenne à une mineure, faible et informationnelle à une opportunité.

## Étape 12. Corriger, vérifier, clore

Pour chaque constat corrigé :

1. Appliquer le correctif (migration SQL versionnée, ou commit de code).
2. Rejouer le test de « Vérification » du constat, dans les mêmes conditions que l'étape 7.
3. Ajouter, au début du constat, une ligne `STATUT : CORRIGÉ le AAAA-MM-JJ` avec la référence du correctif et le résultat du test de vérification.
4. Reporter le tout dans le « Journal des correctifs » en tête de rapport, en distinguant ce qui est en production de ce qui attend un redéploiement.

Un correctif qui régresse (cas M-09 en septembre : vue passée en `security_invoker`, rapports annuels en erreur 500, correctif annulé le lendemain) reste documenté avec sa raison. C'est une preuve de maîtrise, pas un échec à cacher.

Les constats non corrigés portent une raison explicite : décision produit à prendre, test sur appareil requis, doublons en base à arbitrer. Un constat sans statut ni raison est un écart d'audit.

## Ce qu'un auditeur externe demandera, et où le trouver

| Question probable | Réponse |
|---|---|
| Qui a autorisé l'audit ? | En-tête du rapport, demande conservée dans le dossier de preuves |
| Comment prouvez-vous que la RLS fonctionne ? | Export `pg_policies` (étape 6) et tests rejoués avec nombre de lignes (étape 7) |
| Les règles anti-fraude sont-elles testées ? | `packages/api/src/fraud.test.ts`, sortie de `npm run test` |
| Comment suivez-vous les dépendances vulnérables ? | Job `audit` de `.github/workflows/ci.yml`, sortie de `npm audit` datée |
| Comment savez-vous qu'aucun secret n'est dans le dépôt ? | Job `secrets` (gitleaks) de la CI, rejeu local (étape 3) |
| Qu'avez-vous fait des constats ? | Journal des correctifs, statut sur chaque constat, migrations nommées |
| Qu'est-ce que vous n'avez pas testé, et pourquoi ? | Section « non réalisé volontairement » du rapport |
| L'auditeur était-il indépendant ? | AI-06 section 7, nom de l'auditeur dans l'en-tête |
