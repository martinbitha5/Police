# Spec design "Wise" — suite Police (web, vols, litige, tracking)

> Réplique du design system de wise.com (thème clair Neptune) pour les 4 applis.
> Source : page sauvegardée « Wise _ le compte international » (Desktop, 2026-07-15).

## 1. Tokens CSS (à mettre dans `:root` de chaque `app/globals.css`)

```css
:root {
  /* Marque */
  --brand-green: #9FE870;              /* vert vif — CTA, sections promo */
  --brand-forest: #163300;             /* vert forêt — texte sur vert, boutons sombres, liens */
  --brand-yellow: #FFEB69;
  --brand-orange: #FFC091;
  --brand-blue: #A0E1E1;
  --brand-pink: #FFD7EF;

  /* Sémantique (light) */
  --content-primary: #0E0F0C;          /* texte principal */
  --content-secondary: #454745;        /* texte secondaire */
  --content-tertiary: #6A6C6A;         /* légendes */
  --content-link: #163300;
  --content-link-hover: #0D1F00;
  --bg-screen: #FFFFFF;                /* fond de page */
  --bg-elevated: #FFFFFF;              /* cartes blanches/modales */
  --bg-neutral: rgba(22,51,0,0.08);    /* cartes teintées, footer, pilules */
  --bg-neutral-hover: rgba(22,51,0,0.13);
  --bg-neutral-active: rgba(22,51,0,0.18);
  --border-neutral: rgba(14,15,12,0.12);
  --interactive-accent: #9FE870;
  --interactive-accent-hover: #80E142;
  --interactive-accent-active: #65CF21;
  --interactive-control: #163300;      /* texte du CTA vert */
  --interactive-primary: #163300;      /* bouton sombre */
  --interactive-primary-hover: #0D1F00;
  --negative: #CB272F; --negative-bg: #FBEAEA;
  --positive: #054D28; --positive-bg: #E2F6D5;
  --warning: #FFD11A;  --warning-bg: #FFF7D7; --warning-content: #4A3B1C;

  /* Typo */
  --font-display: var(--font-archivo), "Inter", sans-serif; /* Archivo Black — substitut libre de Wise Sans */
  --font-body: var(--font-inter), "Inter", Helvetica, Arial, sans-serif;
  --lh-display: 0.95;  /* titres très serrés, signature Wise */
  --lh-title: 1.1;
  --lh-body: 1.5;
  --ls-heading: -0.03em;
  --ls-body: 0.005em;

  /* Radius */
  --radius-sm: 10px; --radius-md: 16px; --radius-lg: 24px;
  --radius-xl: 32px; --radius-full: 9999px;

  /* Espacement fluide */
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: clamp(1rem, 0.94rem + 0.26vw, 1.25rem);
  --space-6: clamp(1.5rem, 1.41rem + 0.38vw, 1.875rem);
  --space-8: clamp(2rem, 1.88rem + 0.51vw, 2.5rem);
  --space-12: clamp(3rem, 2.83rem + 0.77vw, 3.75rem);
  --space-16: clamp(4rem, 3.77rem + 1.03vw, 5rem);
  --space-24: clamp(6rem, 5.65rem + 1.54vw, 7.5rem);

  /* Layout */
  --container-max: 1440px; --container-text: 700px; --nav-height: 76px;

  /* Ombre — RARE : uniquement cartes survolées/étendues */
  --shadow-card: 0 1px 10px rgba(0,0,0,0.10);
}
```

### Mapping depuis les anciens tokens (thème sombre → Wise clair)
| Ancien | Nouveau |
|---|---|
| `--bg: #060a13` | `--bg-screen: #FFFFFF` |
| `--primary: #4f7df9` (bleu) | `--interactive-accent: #9FE870` (CTA) / `--interactive-primary: #163300` (liens, boutons sombres) |
| `--text: #eef2f9` | `--content-primary: #0E0F0C` |
| `--muted: #a3adbf` | `--content-secondary: #454745` |
| `--glass: rgba(13,21,40,.42)` + blur | `--bg-neutral: rgba(22,51,0,0.08)` — **plat, sans blur, sans ombre** |
| `--success/--danger/--warning` | `--positive/--negative/--warning` (+ fonds `-bg`) |
| Photo tarmac floutée en fond | **Supprimée.** Fond blanc uni. |

## 2. Fontes (next/font/google, dans `app/layout.tsx`)

```tsx
import { Inter, Archivo_Black } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const archivo = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-archivo", display: "swap" });
// <html lang="fr" className={`${inter.variable} ${archivo.variable}`}>
```

- **Display (h1/h2 marketing)** : Archivo Black, `line-height: 0.95`, `letter-spacing: 0`. H1 héros : `clamp(2.625rem, 5vw + 1rem, 5rem)`. H2 section : `clamp(2rem, 3vw + 1rem, 2.875rem)`.
- **Headings UI (h3, titres de cartes)** : Inter 600, `letter-spacing: -0.03em`, `line-height: 1.1`.
- **Body** : Inter 400, 16–18px, lh 1.5. Small : 14px.
- `html { -webkit-font-smoothing: antialiased; }`

## 3. Boutons — pilules, toujours

- **Primaire** : fond `#9FE870`, texte `#163300`, `border-radius: 9999px`, Inter 600 16px, padding `12px 24px`, `min-width: 200px` pour les CTA héros, hover fond `#80E142`, active `#65CF21`. Pas d'ombre.
- **Secondaire** : transparent, texte `#163300`, bordure `1px solid #163300`, pilule ; hover fond `var(--bg-neutral)`.
- **Tertiaire (lien)** : texte `#163300` **souligné**, `text-underline-offset: .3em` ; hover `#0D1F00`.
- **Pilule neutre (nav)** : fond transparent, texte `#0E0F0C`, padding `8px 12px`, pilule ; hover fond `var(--bg-neutral)`.
- **Sur fond vert vif** : bouton inversé fond `#163300`, texte `#9FE870`.
- Focus : `outline: 2px solid #163300; outline-offset: 2px`. Transition `.15s ease-in-out`.

## 4. Cartes / tuiles

- **Carte teintée (défaut marketing)** : fond `var(--bg-neutral)`, `border-radius: 24px` (jusqu'à 32px pour les grosses), padding `32px 24px`, **AUCUNE ombre, AUCUNE bordure, AUCUN blur**. Hover : fond `var(--bg-neutral-hover)` (assombrissement, pas d'élévation).
- **Carte blanche (UI, dashboards, listes)** : fond `#FFFFFF`, `border-radius: 16px`, bordure `1px solid var(--border-neutral)` ; ombre `var(--shadow-card)` uniquement au hover si cliquable.
- **Sections thématiques** : alterner blanc / `var(--bg-neutral)` / bandeau vert vif `#9FE870` (texte et boutons inversés `#163300`), bandeaux arrondis `32–48px` à l'intérieur du conteneur.

## 5. Icônes

- Conserver les SVG stroke existants (`src/components/icons.tsx`), couleur `currentColor`.
- **Les poser dans des cercles** : conteneur `border-radius: 9999px`, fond `var(--bg-neutral)`, glyphe `#163300`, `box-shadow: inset 0 0 0 1px var(--border-neutral)`, tailles 40/48/56/72px selon contexte (72px pour les cartes de fonctionnalités).
- Badges de statut : pastilles pilule, fond `--positive-bg`/`--warning-bg`/`--negative-bg`, texte `--positive`/`--warning-content`/`--negative`.

## 6. Navbar & Footer

- **Navbar** : `position: sticky; top: 0`, hauteur 76px, fond blanc, sans bordure dure (ou `1px var(--border-neutral)`), z-index 1050. Liens = pilules neutres. CTA connexion/inscription = pilule verte `#9FE870`. Logo/marque en Inter 700 ou Archivo Black, couleur `#0E0F0C`.
- **Footer** : **clair** — fond `var(--bg-neutral)`, texte 14px, padding vertical ~80px, titres de colonnes Inter 600 14px `#0E0F0C`, liens `#454745` (hover `#163300` souligné).
- Sidebars (AppShell) : fond blanc ou `var(--bg-neutral)`, item actif = pilule `var(--bg-neutral-hover)` texte `#163300` 600 ; plus de sidebar marine sombre.

## 7. Layout

- Conteneur `max-width: 1440px; margin-inline: auto`, gouttières 16→32px. Texte long : 700px.
- Respiration entre sections : `var(--space-12)` à `var(--space-24)`.
- Héros : 2 colonnes (texte gauche, visuel droite), H1 display énorme, sous-titre Inter 18px `#454745`, 2 CTA (primaire + tertiaire souligné).

## 8. Ton & texte (français, à la Wise)

- **Vouvoiement** systématique. Phrases courtes. Verbe d'action en tête. Bénéfice concret et chiffré quand possible. Transparence revendiquée.
- Gabarits :
  - H1 : bénéfice + contexte (« Ici et ailleurs, votre argent à chaque instant » → adapter : « Votre bagage suivi à chaque instant », « Vos vols en temps réel, ici et maintenant », etc.)
  - Titres de section à l'impératif : « Suivez… », « Déclarez… », « Retrouvez… », « Protégez-vous des fraudeurs »
  - CTA courts : « Commencer », « Suivre mon bagage », « Ouvrir un dossier », « Connexion », « En savoir plus », « Voir comment ça marche »
  - Corps : « Le portail pour déclarer, suivre et résoudre vos litiges bagage comme un pro. » / « Sans frais cachés » → adapter en « Sans paperasse inutile », « Sans file d'attente ».
  - Preuve sociale/CHIFFRES : « Chaque jour, des centaines de passagers… »
- Garder le sens métier (police aéroportuaire, bagages, vols, litiges, tracking) — seul le ton et le style changent.

## 9. Interdits (anti-patterns vs Wise)

- ❌ ombres portées par défaut, ❌ glassmorphism/backdrop-blur, ❌ dégradés, ❌ photo de fond pleine page, ❌ bleu `#4f7df9` comme accent, ❌ coins carrés sur les boutons, ❌ thème sombre par défaut.
- Le seul « effet » autorisé : assombrissement du fond au hover + ombre légère sur carte cliquable survolée.
