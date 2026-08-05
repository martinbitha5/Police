import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Mentions légales · Vols du jour',
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Informations légales relatives au service Vols du jour de l’Aéroport International de Kinshasa (FIH), édité par ATS Handling."
      updated="Juin 2026"
      sections={[
        {
          heading: 'Éditeur du service',
          body: [
            'Le tableau des vols du jour est édité par ATS Handling, société d’assistance en escale opérant sur la plateforme de l’Aéroport International de Kinshasa (FIH), dans le cadre de son activité de contrôle bagage (Police Bagage).',
            'Pour toute question relative à ce service, contactez ATS Handling.',
          ],
        },
        {
          heading: 'Directeur de la publication',
          body: [
            'La publication du service est assurée sous la responsabilité de la direction d’ATS Handling.',
          ],
        },
        {
          heading: 'Hébergement',
          body: [
            'Le site est hébergé sur une infrastructure sécurisée conforme aux standards en vigueur. Les statuts et horaires de vols proviennent des systèmes d’exploitation de l’aéroport et sont relayés à titre informatif.',
          ],
        },
        {
          heading: 'Propriété intellectuelle',
          body: [
            'L’ensemble des contenus de ce site (textes, logos, interface et mise en forme) est protégé. Toute reproduction, représentation ou réutilisation, totale ou partielle, sans autorisation préalable d’ATS Handling est interdite.',
          ],
        },
        {
          heading: 'Responsabilité',
          body: [
            'Les informations de vols sont fournies à titre indicatif et peuvent présenter un décalage avec la situation réelle. Seules les annonces officielles de la compagnie aérienne et de l’aéroport font foi pour l’embarquement.',
            'ATS Handling ne saurait être tenue responsable d’un retard, d’une annulation ou d’un changement de porte non reflété immédiatement, ni de l’usage fait des informations présentées ici.',
          ],
        },
      ]}
    />
  );
}
