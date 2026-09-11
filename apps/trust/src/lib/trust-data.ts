/**
 * Contenu du Trust Center. Tout ce qui est écrit ici est public et doit être
 * vrai et vérifiable : ce qui n'est pas encore en place est marqué « en cours »,
 * et aucun certificat n'est affiché tant qu'il n'est pas obtenu.
 */

export const COMPANY = 'Police Bagage';
export const EDITOR = 'African Transport Systems (ATS Handling)';
export const CONTACT = 'contact@ats-handling-rdc.com';
export const UPDATED = '11 septembre 2026';

export const DESCRIPTION =
  "Police Bagage est la plateforme de contrôle d'embarquement et de lutte contre la fraude bagages " +
  "d'African Transport Systems, conçue et exploitée par son Centre des Solutions Informatiques. " +
  'Nous prenons la sécurité au sérieux, dans le produit comme dans nos opérations, pour protéger les ' +
  'données des compagnies aériennes partenaires et des passagers.';

export type Status = 'en place' | 'en cours';

export function requestMailto(subject: string): string {
  return `mailto:${CONTACT}?subject=${encodeURIComponent(`Trust Center Police Bagage : ${subject}`)}`;
}

// ── Conformité ──────────────────────────────────────────────────

export interface ComplianceItem { name: string; detail: string; status: Status }

export const COMPLIANCE: ComplianceItem[] = [
  {
    name: 'ISO/IEC 27001:2022',
    detail: "Démarche de certification en cours, sur le périmètre du Centre des Solutions Informatiques d'ATS, dont Police Bagage. Le certificat sera publié ici dès son obtention.",
    status: 'en cours',
  },
  {
    name: 'Audit de sécurité indépendant',
    detail: "Audit et test d'intrusion réalisés en septembre 2026 ; les vulnérabilités critiques ont été corrigées et vérifiées en production.",
    status: 'en place',
  },
  {
    name: 'Protection des données des passagers',
    detail: "Données traitées aux seules fins de sûreté aéroportuaire, hébergées dans l'Union européenne, sans usage commercial.",
    status: 'en place',
  },
];

// ── Ressources ──────────────────────────────────────────────────

export interface Resource { id: string; title: string; note?: string; kind: 'request' | 'soon' }

export const AUDITS: Resource[] = [
  { id: 'audit-2026-09', title: "Rapport d'audit de sécurité et de test d'intrusion (septembre 2026)", kind: 'request' },
  { id: 'iso-27001', title: "Rapport d'audit ISO/IEC 27001", note: 'Disponible après la certification', kind: 'soon' },
];

export const OTHER_RESOURCES: Resource[] = [
  { id: 'pc-00', title: 'PC-00 · Périmètre et contexte du système de management', kind: 'request' },
  { id: 'psi-01', title: "PSI-01 · Politique de sécurité de l'information", kind: 'request' },
  { id: 'pgi-04', title: 'PGI-04 · Procédure de gestion des incidents de sécurité', kind: 'request' },
  { id: 'dr-07', title: 'DR-07 · Politique de sauvegarde et de reprise', kind: 'request' },
  { id: 'soa-03', title: "SOA-03 · Déclaration d'applicabilité", kind: 'request' },
];

// ── Contrôles ───────────────────────────────────────────────────

export interface Control { title: string; desc: string; status: Status }
export interface ControlGroup { slug: string; title: string; items: Control[] }

export const CONTROL_GROUPS: ControlGroup[] = [
  {
    slug: 'infrastructure',
    title: "Sécurité de l'infrastructure",
    items: [
      { title: 'Échanges chiffrés', desc: 'Les échanges entre les applications (mobile, portail, portails publics) et les serveurs sont chiffrés en TLS, avec les en-têtes de sécurité HTTP appliqués.', status: 'en place' },
      { title: "Données hébergées dans l'Union européenne", desc: "La base de données et l'authentification sont hébergées chez Supabase, dans la région eu-west-1.", status: 'en place' },
      { title: 'Cloisonnement des données', desc: "Chaque compte ne voit que les données de sa compagnie et de son escale. La règle est appliquée dans la base elle-même (politiques de sécurité au niveau des lignes), pas seulement dans l'interface.", status: 'en place' },
      { title: 'Accès aux clés restreint', desc: "La clé de service de la base ne quitte jamais le serveur ; les applications n'utilisent que des jetons à droits limités.", status: 'en place' },
      { title: 'Surveillance de la disponibilité', desc: "Chaque service est vérifié toutes les cinq minutes ; l'état et l'historique sont publiés sur la page État des systèmes.", status: 'en place' },
      { title: 'Sauvegardes et restauration', desc: "Sauvegardes gérées par l'hébergeur et export chiffré indépendant ; un test de restauration daté reste à réaliser.", status: 'en cours' },
    ],
  },
  {
    slug: 'organisation',
    title: 'Sécurité organisationnelle',
    items: [
      { title: 'Rôles et responsabilités définis', desc: "La direction a défini les rôles de sécurité : Directeur Général, Responsable Informatique en charge de la sécurité de l'information, administrateur système, informaticiens d'escale.", status: 'en place' },
      { title: 'Registre des risques tenu', desc: 'Les risques sont identifiés, cotés et suivis dans un registre, revu lors de la revue de direction et après tout incident.', status: 'en place' },
      { title: 'Gestion des incidents', desc: 'Une procédure décrit le signalement, la classification, la réponse, la préservation des preuves et le retour d’expérience des incidents de sécurité.', status: 'en place' },
      { title: 'Politique de sécurité établie', desc: "La politique de sécurité de l'information est rédigée ; elle est soumise à l'approbation de la Direction Générale et revue au moins une fois par an.", status: 'en cours' },
      { title: 'Revue de direction', desc: 'La direction revoit le système de management de la sécurité au moins une fois par an, avec compte rendu.', status: 'en cours' },
      { title: 'Audit interne', desc: "Un programme d'audit interne annuel est défini ; chaque domaine est audité par une personne qui n'en est pas responsable.", status: 'en cours' },
      { title: 'Sensibilisation du personnel', desc: "Les informaticiens d'escale, les superviseurs et les agents sont sensibilisés aux règles de sécurité et au signalement des incidents.", status: 'en cours' },
    ],
  },
  {
    slug: 'produit',
    title: 'Sécurité du produit',
    items: [
      { title: 'Double authentification', desc: "L'accès au portail superviseur exige un mot de passe et un code à usage unique généré par une application d'authentification.", status: 'en place' },
      { title: 'Comptes nominatifs et rôles séparés', desc: "Chaque personne dispose d'un compte nominatif ; les rôles administrateur, superviseur et agent séparent les droits.", status: 'en place' },
      { title: "Distribution contrôlée de l'application mobile", desc: "L'application des agents n'est pas publique : elle est distribuée en test fermé, à une liste nominative de personnes autorisées.", status: 'en place' },
      { title: 'Journal des opérations inaltérable', desc: 'Les actions sensibles sont consignées dans un journal en ajout seul, qui ne peut être ni modifié ni effacé, consultable par les administrateurs.', status: 'en place' },
      { title: 'Validation des entrées et limitation de débit', desc: "L'API valide toutes les données reçues et limite le nombre de requêtes par utilisateur.", status: 'en place' },
      { title: 'Règles anti-fraude non contournables', desc: "Les règles de rejet d'un bagage non déclaré sont appliquées côté serveur et ne peuvent pas être contournées depuis les terminaux.", status: 'en place' },
      { title: "Tests d'intrusion", desc: "Un audit de sécurité et un test d'intrusion ont été réalisés en septembre 2026 ; les correctifs ont été appliqués et vérifiés en production.", status: 'en place' },
    ],
  },
  {
    slug: 'procedures',
    title: 'Procédures internes',
    items: [
      { title: 'Cycle de développement maîtrisé', desc: 'Le code est sous contrôle de version ; les modifications de la base sont versionnées et reproductibles.', status: 'en place' },
      { title: 'Gestion des vulnérabilités', desc: 'Les dépendances logicielles sont surveillées et les vulnérabilités corrigées selon leur gravité.', status: 'en place' },
      { title: 'Gestion des accès', desc: "Les accès sont attribués par un administrateur et retirés au départ d'une personne ; les comptes sont revus périodiquement.", status: 'en cours' },
      { title: 'Séparation des environnements', desc: 'Un environnement de préproduction, distinct de la production, est en cours de mise en place.', status: 'en cours' },
    ],
  },
  {
    slug: 'donnees',
    title: 'Données et vie privée',
    items: [
      { title: 'Finalité et minimisation', desc: 'Seules les données nécessaires à la sûreté et à la lutte contre la fraude sont collectées : identité du passager, référence de réservation, siège, vol, étiquettes bagage.', status: 'en place' },
      { title: 'Aucun usage commercial', desc: "Aucune donnée n'est vendue ni utilisée à des fins publicitaires ; les applications n'embarquent aucun traceur publicitaire.", status: 'en place' },
      { title: 'Classification des données', desc: 'Les données de passagers et les preuves anti-fraude sont identifiées comme sensibles dans le registre des actifs.', status: 'en place' },
      { title: 'Conservation et suppression', desc: 'La politique de conservation et de purge des données est en cours de formalisation.', status: 'en cours' },
    ],
  },
];

export const CONTROLS_TOTAL = CONTROL_GROUPS.reduce((n, g) => n + g.items.length, 0);

// ── Sous-traitants ──────────────────────────────────────────────

export interface Subprocessor { name: string; role: string; where: string; url: string }

export const SUBPROCESSORS: Subprocessor[] = [
  { name: 'Supabase', role: 'Base de données, authentification, temps réel', where: 'Union européenne (eu-west-1)', url: 'https://supabase.com/' },
  { name: 'Hostinger', role: "Hébergement de l'API de scan", where: 'Europe', url: 'https://www.hostinger.com/' },
  { name: 'GitHub', role: 'Contrôle de version du code source', where: 'États-Unis', url: 'https://github.com/' },
  { name: 'Expo', role: "Construction de l'application mobile", where: 'États-Unis', url: 'https://expo.dev/' },
  { name: 'Google Play', role: "Distribution de l'application mobile (test fermé)", where: 'États-Unis', url: 'https://play.google.com/' },
  { name: 'Starlink', role: 'Connectivité Internet des escales', where: 'États-Unis', url: 'https://www.starlink.com/' },
];
