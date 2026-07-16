import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Conditions d’utilisation · Vols du jour',
};

export default function ConditionsPage() {
  return (
    <LegalPage
      title="Conditions d’utilisation"
      intro="En consultant ce tableau des vols, vous acceptez les conditions ci-dessous. Ce service est fourni à titre informatif par ATS Handling."
      updated="Juin 2026"
      sections={[
        {
          heading: 'Objet du service',
          body: [
            'Ce site affiche les vols du jour de l’Aéroport International de Kinshasa (FIH) et leur statut (programmé, embarquement, fermé ou annulé). Il s’adresse au grand public, sans création de compte.',
            'Les informations sont fournies à titre indicatif. Seules les annonces officielles de la compagnie aérienne et de l’aéroport font foi pour l’embarquement.',
          ],
        },
        {
          heading: 'Exactitude des informations',
          body: [
            'Les statuts et horaires sont mis à jour automatiquement mais peuvent présenter un décalage. ATS Handling ne saurait être tenue responsable d’un retard, d’une annulation ou d’un changement de porte non reflété immédiatement.',
            'Présentez-vous à l’aéroport selon les délais recommandés par votre compagnie, indépendamment du statut affiché ici.',
          ],
        },
        {
          heading: 'Usage autorisé',
          body: [
            'Le service est destiné à un usage personnel et non commercial. Toute extraction massive, automatisée ou revente des données est interdite.',
          ],
        },
        {
          heading: 'Liens externes',
          body: [
            'Des liens renvoient vers le portail officiel de l’aéroport (fih-rva.com) et d’autres services. ATS Handling n’est pas responsable du contenu des sites tiers.',
          ],
        },
      ]}
    />
  );
}
