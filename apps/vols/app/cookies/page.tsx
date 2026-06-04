import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Politique cookies — Vols du jour',
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Politique relative aux cookies"
      intro="Ce site est volontairement sobre. Voici notre utilisation des cookies et technologies similaires."
      updated="Juin 2026"
      sections={[
        {
          heading: 'Pas de cookies publicitaires',
          body: [
            'Nous n’utilisons aucun cookie publicitaire ni traceur tiers de profilage. Votre navigation n’est pas suivie à des fins commerciales.',
          ],
        },
        {
          heading: 'Cookies strictement nécessaires',
          body: [
            'Seuls des cookies ou stockages techniques indispensables au bon fonctionnement du site peuvent être utilisés (par exemple pour assurer la stabilité de l’affichage). Ils ne nécessitent pas de consentement et ne servent pas à vous identifier.',
          ],
        },
        {
          heading: 'Rafraîchissement automatique',
          body: [
            'Le tableau des vols se met à jour automatiquement à intervalles réguliers pour afficher les statuts en temps réel. Cette mise à jour se fait côté navigateur et n’enregistre aucune information vous concernant.',
          ],
        },
        {
          heading: 'Gestion des cookies',
          body: [
            'Vous pouvez à tout moment configurer votre navigateur pour bloquer ou supprimer les cookies. Le site restant essentiellement informatif, son fonctionnement n’en sera pas affecté.',
          ],
        },
      ]}
    />
  );
}
