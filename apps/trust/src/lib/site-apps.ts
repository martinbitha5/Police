/**
 * Les autres applications du projet, listées dans le pied de page. Chacune vit
 * sur son sous-domaine de brsats.com ; une variable d'environnement peut
 * remplacer l'adresse (préproduction) sans toucher au code.
 */

export interface SiteApp {
  label: string;
  url: string;
}

function resolve(url: string | undefined, fallback: string): string {
  return (url ?? '').trim() || fallback;
}

export const WEB_URL = resolve(process.env.NEXT_PUBLIC_URL_WEB, 'https://brsats.com');

export const SITE_APPS: SiteApp[] = [
  { label: 'Suivi bagage', url: resolve(process.env.NEXT_PUBLIC_URL_TRACKING, 'https://tracking.brsats.com') },
  { label: 'Vols du jour', url: resolve(process.env.NEXT_PUBLIC_URL_VOLS, 'https://vols.brsats.com') },
  { label: 'Litiges bagage', url: resolve(process.env.NEXT_PUBLIC_URL_LITIGE, 'https://litige.brsats.com') },
  { label: 'Espace superviseur', url: WEB_URL },
];

/** Pages publiques du portail principal, référencées depuis le pied de page. */
export const WEB_PAGES = {
  status: `${WEB_URL}/status`,
  legal: `${WEB_URL}/legal`,
  conditions: `${WEB_URL}/conditions`,
  faq: `${WEB_URL}/faq`,
};
