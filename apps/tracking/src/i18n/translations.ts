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
    badgeRegistered: string;
    badgeRush: string;
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
      title: 'Suivez votre bagage à chaque instant',
      fieldPnr: 'PNR / Référence de réservation',
      fieldPnrPh: 'Ex. : EYFMKNE',
      fieldFlight: 'Numéro de vol',
      fieldFlightPh: 'Ex. : ET 062',
      fieldDate: 'Date de départ',
      fieldTag: 'Numéro d’étiquette bagage',
      fieldTagPh: '10 chiffres, sur le ticket collé au bagage',
      hint: 'Entrez votre numéro d’étiquette ou votre PNR. Sans file d’attente, sans paperasse.',
      submit: 'Suivre mon bagage',
      submitting: 'Recherche…',
      helperRequired:
        'Renseignez au moins votre PNR ou votre numéro d’étiquette pour lancer le suivi.',
      errNoQuery: 'Entrez votre PNR ou un numéro d’étiquette.',
      errTagLen: 'Le numéro d’étiquette comporte 10 chiffres.',
      errSearch: 'La recherche a échoué. Réessayez.',
      errConn: 'Connexion impossible. Vérifiez votre réseau, puis réessayez.',
      searching: 'Recherche de votre bagage…',
      notFound: 'Aucun bagage trouvé. Vérifiez votre PNR ou votre numéro d’étiquette.',
      summaryLoaded: 'traités',
      badgeLoaded: 'Chargé en soute',
      badgePending: 'En attente',
      badgeRegistered: 'Enregistré',
      badgeRush: 'Réacheminement',
      pnrLabel: 'PNR',
    },
    claim: {
      open: 'Ouvrir une réclamation',
      title: 'Ouvrez une réclamation pour ce bagage',
      category: 'Type de problème',
      catMissing: 'Bagage manquant',
      catDamaged: 'Bagage endommagé',
      catContents: 'Objet manquant dans le bagage',
      catDelayed: 'Bagage retardé',
      catOther: 'Autre problème',
      message: 'Description',
      messagePh: 'Décrivez ce qui s’est passé, en quelques phrases.',
      contact: 'Email ou téléphone (optionnel)',
      contactPh: 'Pour vous répondre rapidement',
      submit: 'Envoyer la réclamation',
      submitting: 'Envoi…',
      cancel: 'Annuler',
      success: 'Réclamation envoyée. Notre équipe la traite en priorité.',
      errEmpty: 'Décrivez le problème pour envoyer la réclamation.',
      errSend: 'L’envoi a échoué. Réessayez.',
      statusTitle: 'Réclamation',
      statusOpen: 'Problème signalé',
      statusInvestigating: 'En cours de traitement',
      statusResolved: 'Réclamation traitée',
    },
    help: {
      title: 'Besoin d’aide ?',
      text: 'Posez votre question, obtenez une réponse claire. Notre équipe vous répond tous les jours, sans file d’attente.',
      contact: 'Contacter le support',
      faq: 'Voir la FAQ',
    },
    about: {
      title: 'À propos',
      intro:
        'Suivez, sécurisez, retrouvez. Police Tracking est le service officiel qui trace chaque bagage à l’aéroport, de l’enregistrement à la soute.',
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
        'Posez votre question, obtenez une réponse claire. Consultez la FAQ ci-dessous ou contactez-nous directement, sans file d’attente.',
      contactTitle: 'Contactez-nous',
      contactText: 'Notre équipe vous répond tous les jours, du lundi au dimanche.',
      email: 'support@police-tracking.cd',
      phone: '+243 000 000 000',
      hours: 'Tous les jours, de 06h00 à 22h00',
      faqTitle: 'Questions fréquentes',
      faq: [
        {
          q: 'Où trouver mon PNR ?',
          a: 'Le PNR (référence de réservation) figure sur votre boarding pass, généralement composé de 6 caractères (ex : EYFMKNE).',
        },
        {
          q: 'Où trouver le numéro d’étiquette bagage ?',
          a: 'Le numéro d’étiquette à 10 chiffres se trouve sur le ticket collé à votre bagage lors de l’enregistrement au comptoir.',
        },
        {
          q: 'Que signifie « En attente » ?',
          a: 'Votre bagage a été déclaré au check-in mais l’étiquette physique n’a pas encore été scannée sur le tapis. Le statut passera à « Enregistré » dès le scan au tapis, puis à « Chargé en soute » après chargement.',
        },
        {
          q: 'Que signifie « Enregistré » ?',
          a: 'L’étiquette physique de votre bagage a été scannée et validée à la zone de tri. Le bagage est contrôlé et confirmé : il va être chargé en soute.',
        },
        {
          q: 'Que signifie « Chargé en soute » ?',
          a: 'Votre bagage est physiquement dans la soute de l’avion. Vous pouvez embarquer sereinement.',
        },
        {
          q: 'Que signifie « Réacheminement » ?',
          a: 'Le bagage a manqué le chargement de votre vol et a été mis à part pour être envoyé sur le prochain vol disponible. Notre équipe vous contactera pour coordonner la livraison.',
        },
        {
          q: 'Comment signaler un problème sur mon bagage ?',
          a: 'Cherchez votre bagage sur cette page avec votre PNR ou numéro d’étiquette. Cliquez sur « Signaler un problème » à côté du bagage concerné, choisissez la catégorie (manquant, endommagé, etc.) et décrivez la situation. Votre signalement est transmis en temps réel aux superviseurs de l’aéroport.',
        },
        {
          q: 'Que se passe-t-il après un signalement ?',
          a: 'Un superviseur reçoit immédiatement une alerte avec votre signalement. Il traite la réclamation depuis son tableau de bord. Le statut de votre signalement passe de « Problème signalé » à « En cours de traitement », puis à « Réclamation traitée » une fois résolu. Vous pouvez relancer le suivi à tout moment pour voir l’avancement.',
        },
        {
          q: 'Mon bagage est endommagé à l’arrivée, que faire ?',
          a: 'Avant de quitter l’aéroport, signalez le dommage en utilisant le formulaire de réclamation (catégorie « Bagage endommagé »). Fournissez une description précise et, si possible, votre numéro d’étiquette. Notre équipe ouvrira un dossier et vous recontactera.',
        },
        {
          q: 'Mon bagage est introuvable après l’atterrissage ?',
          a: 'Effectuez d’abord une recherche avec votre PNR. Si le statut reste « En attente » ou si aucun résultat ne s’affiche, signalez immédiatement un « Bagage manquant » via le formulaire. Restez joignable à l’adresse ou au numéro que vous indiquez dans le formulaire.',
        },
        {
          q: 'Combien de temps pour traiter ma réclamation ?',
          a: 'Les réclamations pour bagages manquants ou endommagés sont traitées en priorité, généralement dans la journée pour les vols du jour. Pour les cas plus complexes (bagage retrouvé sur un autre vol), le délai peut aller jusqu’à 48 h.',
        },
        {
          q: 'Pourquoi mon bagage n’apparaît pas dans le suivi ?',
          a: 'Le suivi est disponible uniquement pour les bagages enregistrés sur les vols opérés par Air Congo / Ethiopian Airlines sur nos aéroports. Si votre PNR ou étiquette est correct mais aucune donnée n’apparaît, contactez le support en indiquant votre numéro de vol et votre date de départ.',
        },
      ],
    },
    footer: {
      tagline: 'Suivez votre bagage à chaque instant, le service officiel de l’aéroport.',
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
      title: 'Track your baggage, every step of the way',
      fieldPnr: 'PNR / Booking reference',
      fieldPnrPh: 'E.g. EYFMKNE',
      fieldFlight: 'Flight number',
      fieldFlightPh: 'E.g. ET 062',
      fieldDate: 'Departure date',
      fieldTag: 'Baggage tag number',
      fieldTagPh: '10 digits, on the sticker attached to your bag',
      hint: 'Enter your tag number or your PNR. No queues, no paperwork.',
      submit: 'Track my baggage',
      submitting: 'Searching…',
      helperRequired:
        'Enter at least your PNR or your tag number to start tracking.',
      errNoQuery: 'Enter your PNR or a tag number.',
      errTagLen: 'The tag number is 10 digits.',
      errSearch: 'The search failed. Please try again.',
      errConn: 'Connection failed. Check your network, then try again.',
      searching: 'Searching for your baggage…',
      notFound: 'No baggage found. Check your PNR or your tag number.',
      summaryLoaded: 'processed',
      badgeLoaded: 'Loaded in hold',
      badgePending: 'Pending',
      badgeRegistered: 'Registered',
      badgeRush: 'Rerouting',
      pnrLabel: 'PNR',
    },
    claim: {
      open: 'Open a claim',
      title: 'Open a claim for this bag',
      category: 'Issue type',
      catMissing: 'Missing baggage',
      catDamaged: 'Damaged baggage',
      catContents: 'Item missing from baggage',
      catDelayed: 'Delayed baggage',
      catOther: 'Other issue',
      message: 'Description',
      messagePh: 'Tell us what happened, in a few sentences.',
      contact: 'Email or phone (optional)',
      contactPh: 'So we can get back to you quickly',
      submit: 'Send claim',
      submitting: 'Sending…',
      cancel: 'Cancel',
      success: 'Claim sent. Our team is treating it as a priority.',
      errEmpty: 'Describe the issue to send your claim.',
      errSend: 'Sending failed. Please try again.',
      statusTitle: 'Claim',
      statusOpen: 'Issue reported',
      statusInvestigating: 'Being processed',
      statusResolved: 'Claim resolved',
    },
    help: {
      title: 'Need help?',
      text: 'Ask your question, get a clear answer. Our team replies every day, no queues.',
      contact: 'Contact support',
      faq: 'View FAQ',
    },
    about: {
      title: 'About',
      intro:
        'Track, secure, recover. Police Tracking is the official service that traces every bag at the airport, from check-in to the hold.',
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
        'Ask your question, get a clear answer. Check the FAQ below or contact us directly, no queues.',
      contactTitle: 'Contact us',
      contactText: 'Our team replies every day, Monday to Sunday.',
      email: 'support@police-tracking.cd',
      phone: '+243 000 000 000',
      hours: 'Every day, 6:00 AM to 10:00 PM',
      faqTitle: 'Frequently asked questions',
      faq: [
        {
          q: 'Where do I find my PNR?',
          a: 'The PNR (booking reference) is on your boarding pass, usually 6 characters (e.g. EYFMKNE).',
        },
        {
          q: 'Where do I find the baggage tag number?',
          a: 'The 10-digit tag number is on the sticker attached to your bag at the check-in counter.',
        },
        {
          q: 'What does "Pending" mean?',
          a: 'Your bag has been declared at check-in but the physical tag has not yet been scanned at the sorting belt. The status will change to "Registered" after belt scan, then to "Loaded in hold" after loading.',
        },
        {
          q: 'What does "Registered" mean?',
          a: 'The physical tag of your bag has been scanned and validated at the sorting area. The bag has passed the security check and will be loaded into the hold.',
        },
        {
          q: 'What does "Loaded in hold" mean?',
          a: 'Your bag is physically in the aircraft hold. You can board without worry.',
        },
        {
          q: 'What does "Rerouting" mean?',
          a: 'The bag missed the loading for your flight and has been set aside to be sent on the next available flight. Our team will contact you to coordinate delivery.',
        },
        {
          q: 'How do I report an issue with my bag?',
          a: 'Search for your bag on this page using your PNR or tag number. Click "Report an issue" next to the bag, select the category (missing, damaged, etc.) and describe the situation. Your report is sent in real time to airport supervisors.',
        },
        {
          q: 'What happens after I report an issue?',
          a: 'A supervisor immediately receives an alert with your report and processes the claim from their dashboard. The status changes from "Issue reported" to "Being processed", then to "Claim resolved" once handled. You can recheck the tracking at any time to see progress.',
        },
        {
          q: 'My bag is damaged on arrival, what should I do?',
          a: 'Before leaving the airport, submit a claim using the report form (category "Damaged baggage"). Provide a precise description and, if possible, your tag number. Our team will open a case and contact you.',
        },
        {
          q: 'My bag cannot be found after landing?',
          a: 'First search with your PNR. If the status stays "Pending" or nothing appears, immediately report a "Missing baggage" via the form. Stay reachable at the contact details you provide in the form.',
        },
        {
          q: 'How long does it take to resolve a claim?',
          a: 'Claims for missing or damaged bags are handled as a priority, usually the same day for current-day flights. For more complex cases (bag found on another flight), the delay may be up to 48 hours.',
        },
        {
          q: 'Why does my bag not appear in tracking?',
          a: 'Tracking is only available for bags registered on flights operated by Air Congo / Ethiopian Airlines at our airports. If your PNR or tag is correct but no data appears, contact support with your flight number and departure date.',
        },
      ],
    },
    footer: {
      tagline: 'Track your baggage, every step of the way, the airport’s official service.',
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
