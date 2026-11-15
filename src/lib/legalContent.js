export const LEGAL_UPDATED_AT = '10 novembre 2026';
export const LEGAL_CONTACT_EMAIL = 'support@kloud-music.fr';
export const LEGAL_SITE = 'https://kloud-music.fr';

export const LEGAL_PAGES = [
  {
    slug: 'cgu',
    path: '/cgu',
    title: 'Conditions générales d’utilisation',
    short: 'CGU',
    kicker: 'Compte & usage'
  },
  {
    slug: 'cgv',
    path: '/cgv',
    title: 'Conditions générales de vente',
    short: 'CGV',
    kicker: 'Achats & artistes'
  },
  {
    slug: 'mentions-legales',
    path: '/mentions-legales',
    title: 'Mentions légales',
    short: 'Mentions',
    kicker: 'Éditeur'
  },
  {
    slug: 'confidentialite',
    path: '/confidentialite',
    title: 'Politique de confidentialité',
    short: 'Confidentialité',
    kicker: 'RGPD'
  },
  {
    slug: 'cookies',
    path: '/cookies',
    title: 'Politique cookies',
    short: 'Cookies',
    kicker: 'Traceurs'
  }
];

export const getLegalPage = (slug) => LEGAL_PAGES.find((p) => p.slug === slug) || null;

const p = (...paragraphs) => paragraphs;

export const LEGAL_SECTIONS = {
  cgu: [
    {
      title: 'Objet',
      body: p(
        'Les présentes conditions générales d’utilisation (CGU) régissent l’accès et l’usage de la plateforme Kloud, accessible notamment via kloud-music.fr.',
        'Kloud permet de découvrir de la musique, d’écouter des extraits, d’acheter des titres ou albums numériques, et de les conserver dans une bibliothèque personnelle. Les artistes peuvent publier leurs œuvres, suivre leurs ventes et retirer leurs revenus.'
      )
    },
    {
      title: 'Acceptation',
      body: p(
        'L’inscription, la connexion ou l’usage du service vaut acceptation des CGU, des CGV pour tout achat, et de la politique de confidentialité.',
        'Si tu n’acceptes pas ces documents, tu ne dois pas créer de compte ni utiliser les fonctions payantes.'
      )
    },
    {
      title: 'Compte',
      body: p(
        'Tu es responsable de l’exactitude des informations fournies et de la confidentialité de tes identifiants. Un compte peut être auditeur, artiste, ou les deux (changement de mode dans le menu).',
        'Kloud peut suspendre ou clôturer un compte en cas de fraude, d’atteinte aux droits de tiers, d’usage abusif de la plateforme ou de non-paiement.',
        'Les comptes créés via Google sont liés à l’adresse e-mail fournie par Google. Sans mot de passe Kloud, la réinitialisation classique ne s’applique pas.'
      )
    },
    {
      title: 'Règles d’usage',
      body: p(
        'Il est interdit de : extraire massivement le catalogue ; contourner les previews ou les contrôles d’accès aux fichiers achetés ; usurper l’identité d’un artiste ; publier des contenus dont tu n’as pas les droits ; harceler, spammer ou perturber le service.',
        'Les extraits (previews) sont destinés à la découverte. Le fichier complet n’est délivré qu’après achat, ajout gratuit autorisé par l’artiste, ou licence équivalente.'
      )
    },
    {
      title: 'Contenus publiés par les artistes',
      body: p(
        'L’artiste reste titulaire de ses droits d’auteur. En publiant sur Kloud, il accorde à Kloud une licence non exclusive, mondiale, pour héberger, diffuser en extraits, vendre et délivrer les fichiers aux acheteurs, le temps de la mise en ligne.',
        'L’artiste garantit détenir tous les droits nécessaires (composition, master, artwork, samples). Kloud peut retirer un contenu sur signalement fondé ou injonction.'
      )
    },
    {
      title: 'Disponibilité',
      body: p(
        'Kloud est fourni « en l’état ». Des interruptions (maintenance, incident hébergeur, mise à jour) peuvent survenir. Nous visons un service continu mais sans garantie de disponibilité 24/7.'
      )
    },
    {
      title: 'Responsabilité',
      body: p(
        'Kloud est un intermédiaire technique et de paiement entre auditeurs et artistes. Kloud n’est pas éditeur des œuvres mises en ligne par les artistes, sauf contenus institutionnels (pages Kloud, concours officiels).',
        'La responsabilité de Kloud est limitée, dans la mesure permise par la loi, aux dommages directs et au montant des sommes payées par l’utilisateur à Kloud sur les 12 derniers mois.'
      )
    },
    {
      title: 'Modification',
      body: p(
        `Kloud peut mettre à jour les CGU. La date en tête de page fait foi. L’usage continu après publication vaut acceptation. Dernière mise à jour : ${LEGAL_UPDATED_AT}.`
      )
    }
  ],
  cgv: [
    {
      title: 'Champ d’application',
      body: p(
        'Les présentes conditions générales de vente (CGV) s’appliquent à tout achat de contenu numérique (titre, album, prix libre ou tarif fixe) réalisé sur Kloud par un consommateur ou un professionnel.',
        'Le vendeur apparent pour l’encaissement est Kloud, qui collecte le paiement via Stripe puis reverse à l’artiste sa part (coffre-fort interne, puis virement Stripe Connect lorsque l’artiste l’a activé).'
      )
    },
    {
      title: 'Prix et commission',
      body: p(
        'Les prix sont indiqués en euros, TTC le cas échéant. Un titre peut être gratuit, à prix libre (avec minimum éventuel) ou à prix fixe, selon le choix de l’artiste.',
        'Kloud prélève une commission de 5 % sur le montant encaissé. Le solde est crédité sur le coffre-fort de l’artiste.',
        'Les frais de paiement Stripe, s’il en reste après commission, sont supportés selon le paramétrage technique en vigueur au moment de la transaction.'
      )
    },
    {
      title: 'Commande et paiement',
      body: p(
        'L’achat se conclut sur la page du titre ou de l’album, puis via Stripe Checkout. La commande n’est ferme qu’après confirmation du paiement (statut « paid »).',
        'Kloud n’enregistre pas tes numéros de carte. Le prestataire de paiement est Stripe (Stripe Payments Europe, Ltd / entités du groupe Stripe).',
        'Sans activation Stripe Connect côté artiste, l’acheteur peut quand même payer : les fonds sont conservés par Kloud au profit de l’artiste (coffre-fort). L’artiste peut retirer à partir du seuil affiché (10 € par défaut) une fois Connect activé.'
      )
    },
    {
      title: 'Livraison du contenu numérique',
      body: p(
        'Dès confirmation du paiement, le titre ou l’album est ajouté à ta bibliothèque Kloud. Tu peux l’écouter en ligne et, lorsque le téléchargement est proposé, récupérer le fichier.',
        'La livraison est électronique, immédiate ou dans un délai très court après validation Stripe. Un e-mail de confirmation peut être envoyé si l’envoi d’e-mails est configuré.'
      )
    },
    {
      title: 'Droit de rétractation — contenus numériques',
      body: p(
        'Conformément à l’article L221-28 13° du Code de la consommation, le droit de rétractation ne s’applique pas aux contenus numériques fournis sur un support immatériel dont l’exécution a commencé avec ton accord exprès et le renoncement à ce droit.',
        'En validant le paiement sur Kloud, tu demandes l’exécution immédiate (ajout à la bibliothèque / accès au fichier) et tu reconnais perdre ton droit de rétractation pour ce contenu.'
      )
    },
    {
      title: 'Remboursements',
      body: p(
        'Les achats numériques sont en principe définitifs. Un remboursement peut être étudié en cas de fichier illisible, de double facturation, ou de fraude avérée, via support@kloud-music.fr, dans un délai raisonnable après l’achat.',
        'Kloud se réserve le droit de refuser un remboursement lorsque le fichier a été téléchargé et qu’aucun défaut n’est démontré.'
      )
    },
    {
      title: 'Obligations de l’artiste vendeur',
      body: p(
        'L’artiste fixe le prix, fournit des fichiers conformes, et s’assure de la licéité du contenu. Il est informé du niveau de commission avant publication.',
        'Les retraits vers un compte bancaire passent par Stripe Connect. Kloud n’est pas établissement de crédit. Les délais Stripe (pending, payout) s’appliquent.'
      )
    },
    {
      title: 'Preuve',
      body: p(
        'Les registres informatisés de Kloud et de Stripe font foi des transactions, sous réserve de preuve contraire.'
      )
    }
  ],
  'mentions-legales': [
    {
      title: 'Éditeur',
      body: p(
        'Le site Kloud (kloud-music.fr) est un service de mise en relation et de distribution de musiques numériques, conçu et opéré depuis la France (Marseille).',
        `Contact éditeur : ${LEGAL_CONTACT_EMAIL}`,
        'La dénomination sociale, forme juridique, capital, RCS / SIREN et adresse du siège seront complétés ici dès l’immatriculation définitive de la structure éditrice. En attendant, le contact ci-dessus est le point d’entrée officiel.'
      )
    },
    {
      title: 'Directeur de la publication',
      body: p(
        'Le directeur de la publication est le représentant légal de l’éditeur de Kloud, joignable à l’adresse support@kloud-music.fr.'
      )
    },
    {
      title: 'Propriété intellectuelle',
      body: p(
        'La marque, le logo, l’interface et les textes institutionnels Kloud sont protégés. Toute reproduction non autorisée est interdite.',
        'Les œuvres musicales, pochettes et profils artistes restent la propriété de leurs titulaires. Kloud n’accorde aucun droit au-delà de l’écoute d’extrait et, après achat, de l’usage privé du fichier acquis.'
      )
    },
    {
      title: 'Crédits',
      body: p(
        'Interface : application web Kloud. Paiements : Stripe. Police et composants d’interface : bibliothèques open source utilisées dans le respect de leurs licences.'
      )
    }
  ],
  confidentialite: [
    {
      title: 'Responsable de traitement',
      body: p(
        `Le responsable de traitement des données personnelles collectées sur Kloud est l’éditeur du service, contact : ${LEGAL_CONTACT_EMAIL}.`,
        'Cette politique décrit quelles données sont traitées, pourquoi, combien de temps, et tes droits (RGPD et loi Informatique et Libertés).'
      )
    },
    {
      title: 'Données collectées',
      body: p(
        'Compte : e-mail, nom, mot de passe (stocké haché), photo, rôle (auditeur / artiste), nom d’artiste, préférences (audio, notifications, confidentialité).',
        'Usage : likes, follows, playlists, historique d’écoutes côté serveur lorsque tu es connecté, achats (identifiant de transaction Stripe, montant, article — jamais le numéro de carte).',
        'Technique : logs d’accès, adresse IP, user-agent, cookies de session. Mesure d’audience (pages vues, temps passé, titre en cours) uniquement si tu acceptes les cookies analytics.',
        'Artistes : profil public, fichiers audio/pochettes, solde de cagnotte, statut Stripe Connect.',
        'Contact / retours : messages envoyés via le formulaire d’aide, éventuellement avec une image.'
      )
    },
    {
      title: 'Finalités et bases légales',
      body: p(
        'Exécution du contrat : créer le compte, délivrer les achats, afficher la bibliothèque, permettre la publication artiste et les retraits.',
        'Intérêt légitime : sécurité, prévention de la fraude, amélioration du produit, statistiques agrégées.',
        'Consentement : cookies analytics, communications marketing si elles sont mises en place, envoi d’e-mails non transactionnels.',
        'Obligation légale : facturation, réponses aux autorités, conservation limitée des transactions.'
      )
    },
    {
      title: 'Destinataires',
      body: p(
        'Équipe Kloud (accès admin restreint). Prestataires : hébergeur OVH, paiement Stripe, e-mail transactionnel (OVH / SMTP ou équivalent lorsque configuré).',
        'Les artistes voient les informations nécessaires à la vente (pas tes données carte). Tes playlists et likes restent privés, sauf si une fonction de partage public est activée plus tard.',
        'Pas de vente de fichiers clients. Un transfert hors UE n’a lieu que via un prestataire encadré (clauses types / Data Privacy Framework selon le cas, notamment Stripe).'
      )
    },
    {
      title: 'Durées de conservation',
      body: p(
        'Compte : jusqu’à suppression du compte, puis archivage minimal si obligation légale.',
        'Transactions : durée comptable / fiscale applicable (en pratique jusqu’à 10 ans pour certaines pièces).',
        'Logs techniques : quelques semaines à quelques mois. Cookies analytics : 13 mois maximum.',
        'Retours / feedback : le temps du traitement, puis suppression ou anonymisation.'
      )
    },
    {
      title: 'Tes droits',
      body: p(
        'Tu peux demander l’accès, la rectification, l’effacement, la limitation, la portabilité, et t’opposer à certains traitements. Pour cela : support@kloud-music.fr.',
        'Tu peux aussi introduire une réclamation auprès de la CNIL (https://www.cnil.fr).',
        'La suppression de compte et l’export de bibliothèque seront proposés dans les réglages ; en attendant, la demande se fait par e-mail.'
      )
    }
  ],
  cookies: [
    {
      title: 'Quoi ?',
      body: p(
        'Un cookie (ou traceur voisin : localStorage, sessionStorage) est un petit fichier déposé sur ton appareil. Kloud en utilise peu, et distingue les cookies nécessaires des cookies de mesure d’audience.'
      )
    },
    {
      title: 'Cookies nécessaires (pas de consentement)',
      body: p(
        'Session de connexion (jetons d’accès / rafraîchissement, cookies httpOnly le cas échéant) : te garder connecté, sécuriser les requêtes.',
        'Préférences de compte locales (thème, position du lecteur, réglages audio) : le service ne fonctionne pas correctement sans.',
        'Jeton de protection OAuth (état Google) : courte durée, le temps de la connexion Google.',
        'Choix cookies lui-même (kloud_cookie_consent) : mémoriser Accepté / Refusé.'
      )
    },
    {
      title: 'Cookies analytics (consentement)',
      body: p(
        'Si tu cliques sur « Tout accepter », Kloud envoie des heartbeats techniques (page vue, durée, titre / artiste éventuellement en lecture, fuseau) pour les stats internes admin (Datas+). Pas de publicité tierce, pas de revente.',
        'Si tu refuses, ces envois sont coupés. Tu peux changer d’avis via le bandeau ou en effaçant les données du site dans ton navigateur.'
      )
    },
    {
      title: 'Tiers',
      body: p(
        'Stripe peut déposer ses propres cookies sur les pages de paiement Checkout (sécurité et fraude). Google peut le faire sur l’écran de connexion Google. Ces dépôts relèvent de leurs politiques.',
        'Kloud n’utilise pas de pixel publicitaire Facebook / TikTok à ce jour.'
      )
    },
    {
      title: 'Durée et contact',
      body: p(
        'Le consentement analytics est stocké localement jusqu’à ce que tu le modifies. Pour toute question : support@kloud-music.fr. Politique détaillée des données : page Confidentialité.'
      )
    }
  ]
};
