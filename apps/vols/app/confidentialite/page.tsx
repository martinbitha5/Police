import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Politique de confidentialité — Vols du jour',
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro="Cette page explique quelles données sont traitées lorsque vous consultez le tableau des vols. Notre principe : collecter le strict minimum."
      updated="Juin 2026"
      sections={[
        {
          heading: 'Aucune donnée personnelle collectée',
          body: [
            'La consultation des vols du jour ne nécessite aucun compte, aucune inscription et aucune saisie d’informations personnelles. Nous ne demandons ni nom, ni email, ni téléphone.',
            'Aucun profil publicitaire n’est constitué et aucune donnée n’est revendue.',
          ],
        },
        {
          heading: 'Données techniques',
          body: [
            'Comme tout site web, notre hébergeur peut enregistrer des données techniques minimales (adresse IP, type de navigateur) à des fins de sécurité et de bon fonctionnement. Ces journaux sont conservés pour une durée limitée puis supprimés.',
          ],
        },
        {
          heading: 'Données des vols',
          body: [
            'Les informations affichées (numéro de vol, route, horaire, statut) proviennent du système d’exploitation aéroportuaire. Elles ne contiennent aucune donnée nominative de passager.',
          ],
        },
        {
          heading: 'Vos droits',
          body: [
            'Aucune donnée personnelle n’étant collectée à des fins d’identification, il n’y a pas de profil à consulter, rectifier ou supprimer. Pour toute question, contactez ATS Handling.',
          ],
        },
      ]}
    />
  );
}
