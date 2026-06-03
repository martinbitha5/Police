export type Lang = 'fr' | 'en';

export interface FaqItem {
  q: string;
  a: string;
}

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalPage {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

export interface Dictionary {
  brand: string;
  nav: {
    home: string;
    about: string;
    support: string;
  };
  breadcrumb: {
    home: string;
    tracking: string;
    about: string;
    support: string;
    mentions: string;
    privacy: string;
    terms: string;
    cookies: string;
  };
  home: {
    title: string;
    fieldPnr: string;
    fieldPnrPh: string;
    fieldFlight: string;
    fieldFlightPh: string;
    fieldDate: string;
    fieldTag: string;
    fieldTagPh: string;
    hint: string;
    submit: string;
    submitting: string;
    helperRequired: string;
    errNoQuery: string;
    errTagLen: string;
    errSearch: string;
    errConn: string;
    searching: string;
    notFound: string;
    summaryLoaded: string;
    badgeLoaded: string;
    badgePending: string;
    pnrLabel: string;
  };
  claim: {
    open: string;
    title: string;
    category: string;
    catMissing: string;
    catDamaged: string;
    catContents: string;
    catDelayed: string;
    catOther: string;
    message: string;
    messagePh: string;
    contact: string;
    contactPh: string;
    submit: string;
    submitting: string;
    cancel: string;
    success: string;
    errEmpty: string;
    errSend: string;
    statusTitle: string;
    statusOpen: string;
    statusInvestigating: string;
    statusResolved: string;
  };
  help: {
    title: string;
    text: string;
    contact: string;
    faq: string;
  };
  about: {
    title: string;
    intro: string;
    sections: LegalSection[];
  };
  support: {
    title: string;
    intro: string;
    contactTitle: string;
    contactText: string;
    email: string;
    phone: string;
    hours: string;
    faqTitle: string;
    faq: FaqItem[];
  };
  footer: {
    tagline: string;
    navTitle: string;
    legalTitle: string;
    contactTitle: string;
    rights: string;
  };
  mentions: LegalPage;
  privacy: LegalPage;
  terms: LegalPage;
  cookies: LegalPage;
}

export const translations: Record<Lang, Dictionary> = {
  fr: {
    brand: 'Police Tracking',
    nav: { home: 'Accueil', about: 'À propos', support: 'Support' },
    breadcrumb: {
      home: 'Accueil',
      tracking: 'Suivi Bagages',
      about: 'À propos',
      support: 'Support',
      mentions: 'Mentions légales',
      privacy: 'Confidentialité',
      terms: 'Conditions d’utilisation',
      cookies: 'Cookies',
    },
    home: {
      title: 'SUIVI BAGAGES',
      fieldPnr: 'PNR / Référence de réservation',
      fieldPnrPh: 'Entrez le PNR (ex : EYFMKNE)',
      fieldFlight: 'Numéro de vol',
      fieldFlightPh: 'Entrez le numéro de vol',
      fieldDate: 'Date de départ',
      fieldTag: 'Numéro d’étiquette bagage',
      fieldTagPh: 'Numéro d’étiquette (10 chiffres)',
      hint: 'Le suivi se fait par n° d’étiquette (prioritaire) ou par PNR.',
      submit: 'Suivre le bagage',
      submitting: 'Recherche…',
      helperRequired:
        'Champ obligatoire. Entrez au moins votre PNR ou numéro d’étiquette pour suivre votre bagage.',
      errNoQuery: 'Entrez au moins votre PNR ou un numéro d’étiquette.',
      errTagLen: 'Le numéro d’étiquette doit comporter 10 chiffres.',
      errSearch: 'Erreur lors de la recherche.',
      errConn: 'Connexion impossible. Réessayez.',
      searching: 'Recherche de votre bagage en cours…',
      notFound: 'Aucun bagage trouvé.',
      summaryLoaded: 'chargés',
      badgeLoaded: 'Chargé en soute',
      badgePending: 'En attente',
      pnrLabel: 'PNR',
    },
    claim: {
      open: 'Signaler un problème',
      title: 'Signaler un problème sur ce bagage',
      category: 'Type de problème',
      catMissing: 'Bagage manquant',
      catDamaged: 'Bagage endommagé',
      catContents: 'Objet manquant dans le bagage',
      catDelayed: 'Bagage retardé',
      catOther: 'Autre problème',
      message: 'Description',
      messagePh: 'Décrivez le problème rencontré…',
      contact: 'Email ou téléphone (optionnel)',
      contactPh: 'Pour vous recontacter',
      submit: 'Envoyer la réclamation',
      submitting: 'Envoi…',
      cancel: 'Annuler',
      success: 'Réclamation envoyée. Notre équipe va la traiter.',
      errEmpty: 'Veuillez décrire le problème.',
      errSend: 'Échec de l’envoi. Réessayez.',
      statusTitle: 'Réclamation',
      statusOpen: 'Problème signalé',
      statusInvestigating: 'En cours de traitement',
      statusResolved: 'Réclamation traitée',
    },
    help: {
      title: 'Besoin d’aide ?',
      text: 'Si vous avez besoin d’assistance pour suivre votre bagage ou avez des questions, veuillez contacter notre équipe de support.',
      contact: 'Contacter le support',
      faq: 'Voir la FAQ',
    },
    about: {
      title: 'À propos',
      intro:
        'Police Tracking est le service officiel de suivi des bagages mis en place pour sécuriser et tracer chaque bagage à l’aéroport.',
      sections: [
        {
          heading: 'Notre mission',
          body: [
            'Police Tracking permet à chaque passager de suivre en temps réel l’état de son bagage, de l’enregistrement au chargement en soute.',
            'Le système relie chaque étiquette bagage à un passager enregistré afin de garantir qu’aucun colis non déclaré ne parte en soute.',
          ],
        },
        {
          heading: 'Comment ça marche',
          body: [
            'À l’enregistrement, votre boarding pass est scanné et le nombre de bagages déclarés est enregistré.',
            'À chaque point de contrôle, l’étiquette physique du bagage est scannée. Dès qu’un bagage est confirmé chargé, son statut passe à « Chargé en soute » et devient visible ici.',
          ],
        },
        {
          heading: 'Sécurité & lutte anti-fraude',
          body: [
            'Le service vérifie en permanence que chaque bagage correspond à un passager réellement enregistré et au nombre de bagages autorisés.',
            'Toute tentative d’embarquer un bagage non déclaré est interceptée avant le départ et signalée aux superviseurs.',
          ],
        },
      ],
    },
    support: {
      title: 'Support',
      intro:
        'Une question sur votre bagage ? Notre équipe est disponible pour vous aider. Consultez la FAQ ci-dessous ou contactez-nous directement.',
      contactTitle: 'Nous contacter',
      contactText: 'Notre équipe support répond du lundi au dimanche.',
      email: 'support@police-tracking.cd',
      phone: '+243 000 000 000',
      hours: 'Tous les jours, 06h00 – 22h00',
      faqTitle: 'Questions fréquentes',
      faq: [
        {
          q: 'Où trouver mon PNR ?',
          a: 'Le PNR (référence de réservation) figure sur votre boarding pass, généralement composé de 6 caractères (ex : EYFMKNE).',
        },
        {
          q: 'Où trouver le numéro d’étiquette bagage ?',
          a: 'Le numéro d’étiquette à 10 chiffres se trouve sur le ticket collé à votre bagage lors de l’enregistrement.',
        },
        {
          q: 'Que signifie « En attente » ?',
          a: 'Le bagage a été déclaré mais n’a pas encore été scanné comme chargé en soute. Son statut passera à « Chargé en soute » dès confirmation.',
        },
        {
          q: 'Mon bagage est introuvable, que faire ?',
          a: 'Vérifiez votre PNR ou numéro d’étiquette. Si le problème persiste, contactez notre support avec votre référence de réservation.',
        },
      ],
    },
    footer: {
      tagline: 'Suivi sécurisé des bagages — service officiel aéroportuaire.',
      navTitle: 'Navigation',
      legalTitle: 'Légal',
      contactTitle: 'Contact',
      rights: 'Tous droits réservés.',
    },
    mentions: {
      title: 'Mentions légales',
      intro: 'Informations légales relatives au service Police Tracking.',
      updated: 'Dernière mise à jour',
      sections: [
        {
          heading: 'Éditeur du service',
          body: [
            'Le service Police Tracking est édité par l’autorité aéroportuaire compétente dans le cadre de la sécurité des bagages.',
            'Contact : support@police-tracking.cd',
          ],
        },
        {
          heading: 'Hébergement',
          body: [
            'Les données sont hébergées sur une infrastructure sécurisée conforme aux standards en vigueur.',
          ],
        },
        {
          heading: 'Propriété intellectuelle',
          body: [
            'L’ensemble des contenus de ce site (textes, logos, interface) est protégé et ne peut être reproduit sans autorisation.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Politique de confidentialité',
      intro: 'Comment nous traitons et protégeons vos données personnelles.',
      updated: 'Dernière mise à jour',
      sections: [
        {
          heading: 'Données collectées',
          body: [
            'Pour le suivi des bagages, nous traitons : votre référence de réservation (PNR), le numéro de vol, la date et le numéro d’étiquette bagage.',
            'Ces données proviennent du processus d’enregistrement et de scan en aéroport.',
          ],
        },
        {
          heading: 'Finalité du traitement',
          body: [
            'Les données sont utilisées uniquement pour vous permettre de suivre l’état de votre bagage et pour assurer la sécurité aéroportuaire.',
          ],
        },
        {
          heading: 'Conservation',
          body: [
            'Les données de suivi sont conservées pour la durée nécessaire au traitement du vol, puis archivées conformément à la réglementation.',
          ],
        },
        {
          heading: 'Vos droits',
          body: [
            'Vous disposez d’un droit d’accès, de rectification et de suppression de vos données. Pour l’exercer, contactez support@police-tracking.cd.',
          ],
        },
      ],
    },
    terms: {
      title: 'Conditions d’utilisation',
      intro: 'Règles d’utilisation du service de suivi de bagages.',
      updated: 'Dernière mise à jour',
      sections: [
        {
          heading: 'Objet',
          body: [
            'Le service Police Tracking permet aux passagers de consulter l’état de leurs bagages enregistrés.',
          ],
        },
        {
          heading: 'Utilisation autorisée',
          body: [
            'Vous vous engagez à n’utiliser le service que pour suivre vos propres bagages, à l’aide de votre référence de réservation ou numéro d’étiquette.',
            'Toute utilisation frauduleuse ou tentative d’accès à des données tierces est interdite.',
          ],
        },
        {
          heading: 'Disponibilité',
          body: [
            'Le service est fourni « en l’état ». Nous nous efforçons d’assurer sa disponibilité mais ne garantissons pas une absence totale d’interruption.',
          ],
        },
      ],
    },
    cookies: {
      title: 'Politique cookies',
      intro: 'Utilisation des cookies et du stockage local.',
      updated: 'Dernière mise à jour',
      sections: [
        {
          heading: 'Cookies techniques',
          body: [
            'Ce site utilise uniquement le stockage local de votre navigateur pour mémoriser votre préférence de langue.',
            'Aucun cookie de suivi publicitaire n’est utilisé.',
          ],
        },
        {
          heading: 'Gestion',
          body: [
            'Vous pouvez à tout moment effacer le stockage local depuis les paramètres de votre navigateur.',
          ],
        },
      ],
    },
  },

  en: {
    brand: 'Police Tracking',
    nav: { home: 'Home', about: 'About', support: 'Support' },
    breadcrumb: {
      home: 'Home',
      tracking: 'Baggage Tracking',
      about: 'About',
      support: 'Support',
      mentions: 'Legal notice',
      privacy: 'Privacy',
      terms: 'Terms of use',
      cookies: 'Cookies',
    },
    home: {
      title: 'BAGGAGE TRACKING',
      fieldPnr: 'PNR / Booking reference',
      fieldPnrPh: 'Enter PNR (e.g. EYFMKNE)',
      fieldFlight: 'Flight number',
      fieldFlightPh: 'Enter flight number',
      fieldDate: 'Departure date',
      fieldTag: 'Baggage tag number',
      fieldTagPh: 'Tag number (10 digits)',
      hint: 'Track by tag number (preferred) or by PNR.',
      submit: 'Track baggage',
      submitting: 'Searching…',
      helperRequired:
        'Required field. Enter at least your PNR or tag number to track your baggage.',
      errNoQuery: 'Enter at least your PNR or a tag number.',
      errTagLen: 'The tag number must be 10 digits.',
      errSearch: 'Error during search.',
      errConn: 'Connection failed. Please try again.',
      searching: 'Searching for your baggage…',
      notFound: 'No baggage found.',
      summaryLoaded: 'loaded',
      badgeLoaded: 'Loaded in hold',
      badgePending: 'Pending',
      pnrLabel: 'PNR',
    },
    claim: {
      open: 'Report an issue',
      title: 'Report an issue with this bag',
      category: 'Issue type',
      catMissing: 'Missing baggage',
      catDamaged: 'Damaged baggage',
      catContents: 'Item missing from baggage',
      catDelayed: 'Delayed baggage',
      catOther: 'Other issue',
      message: 'Description',
      messagePh: 'Describe the issue you encountered…',
      contact: 'Email or phone (optional)',
      contactPh: 'So we can get back to you',
      submit: 'Send claim',
      submitting: 'Sending…',
      cancel: 'Cancel',
      success: 'Claim sent. Our team will handle it.',
      errEmpty: 'Please describe the issue.',
      errSend: 'Sending failed. Please try again.',
      statusTitle: 'Claim',
      statusOpen: 'Issue reported',
      statusInvestigating: 'Being processed',
      statusResolved: 'Claim resolved',
    },
    help: {
      title: 'Need help?',
      text: 'If you need assistance tracking your baggage or have any questions, please contact our support team.',
      contact: 'Contact support',
      faq: 'View FAQ',
    },
    about: {
      title: 'About',
      intro:
        'Police Tracking is the official baggage tracking service set up to secure and trace every bag at the airport.',
      sections: [
        {
          heading: 'Our mission',
          body: [
            'Police Tracking lets every passenger follow the status of their baggage in real time, from check-in to loading in the hold.',
            'The system links each baggage tag to a registered passenger to ensure no undeclared item is loaded into the hold.',
          ],
        },
        {
          heading: 'How it works',
          body: [
            'At check-in, your boarding pass is scanned and the number of declared bags is recorded.',
            'At each checkpoint, the physical baggage tag is scanned. Once a bag is confirmed loaded, its status becomes "Loaded in hold" and appears here.',
          ],
        },
        {
          heading: 'Security & anti-fraud',
          body: [
            'The service continuously verifies that each bag matches a genuinely registered passenger and the allowed number of bags.',
            'Any attempt to board an undeclared bag is intercepted before departure and reported to supervisors.',
          ],
        },
      ],
    },
    support: {
      title: 'Support',
      intro:
        'A question about your baggage? Our team is available to help. Check the FAQ below or contact us directly.',
      contactTitle: 'Contact us',
      contactText: 'Our support team is available every day.',
      email: 'support@police-tracking.cd',
      phone: '+243 000 000 000',
      hours: 'Every day, 6:00 AM – 10:00 PM',
      faqTitle: 'Frequently asked questions',
      faq: [
        {
          q: 'Where do I find my PNR?',
          a: 'The PNR (booking reference) is on your boarding pass, usually 6 characters (e.g. EYFMKNE).',
        },
        {
          q: 'Where do I find the baggage tag number?',
          a: 'The 10-digit tag number is on the ticket attached to your bag at check-in.',
        },
        {
          q: 'What does "Pending" mean?',
          a: 'The bag has been declared but not yet scanned as loaded in the hold. Its status changes to "Loaded in hold" once confirmed.',
        },
        {
          q: 'My baggage cannot be found, what should I do?',
          a: 'Check your PNR or tag number. If the issue persists, contact our support with your booking reference.',
        },
      ],
    },
    footer: {
      tagline: 'Secure baggage tracking — official airport service.',
      navTitle: 'Navigation',
      legalTitle: 'Legal',
      contactTitle: 'Contact',
      rights: 'All rights reserved.',
    },
    mentions: {
      title: 'Legal notice',
      intro: 'Legal information about the Police Tracking service.',
      updated: 'Last updated',
      sections: [
        {
          heading: 'Service publisher',
          body: [
            'The Police Tracking service is published by the competent airport authority as part of baggage security.',
            'Contact: support@police-tracking.cd',
          ],
        },
        {
          heading: 'Hosting',
          body: ['Data is hosted on a secure infrastructure compliant with applicable standards.'],
        },
        {
          heading: 'Intellectual property',
          body: [
            'All content on this site (text, logos, interface) is protected and may not be reproduced without authorization.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy policy',
      intro: 'How we process and protect your personal data.',
      updated: 'Last updated',
      sections: [
        {
          heading: 'Data collected',
          body: [
            'For baggage tracking we process: your booking reference (PNR), flight number, date and baggage tag number.',
            'This data comes from the airport check-in and scanning process.',
          ],
        },
        {
          heading: 'Purpose of processing',
          body: [
            'Data is used solely to let you track the status of your baggage and to ensure airport security.',
          ],
        },
        {
          heading: 'Retention',
          body: [
            'Tracking data is kept for as long as needed to process the flight, then archived in accordance with regulations.',
          ],
        },
        {
          heading: 'Your rights',
          body: [
            'You have the right to access, correct and delete your data. To exercise it, contact support@police-tracking.cd.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of use',
      intro: 'Rules for using the baggage tracking service.',
      updated: 'Last updated',
      sections: [
        {
          heading: 'Purpose',
          body: ['The Police Tracking service lets passengers check the status of their checked baggage.'],
        },
        {
          heading: 'Permitted use',
          body: [
            'You agree to use the service only to track your own baggage, using your booking reference or tag number.',
            'Any fraudulent use or attempt to access third-party data is prohibited.',
          ],
        },
        {
          heading: 'Availability',
          body: [
            'The service is provided "as is". We strive to keep it available but do not guarantee uninterrupted access.',
          ],
        },
      ],
    },
    cookies: {
      title: 'Cookie policy',
      intro: 'Use of cookies and local storage.',
      updated: 'Last updated',
      sections: [
        {
          heading: 'Technical cookies',
          body: [
            'This site only uses your browser local storage to remember your language preference.',
            'No advertising tracking cookies are used.',
          ],
        },
        {
          heading: 'Management',
          body: ['You can clear local storage at any time from your browser settings.'],
        },
      ],
    },
  },
};
