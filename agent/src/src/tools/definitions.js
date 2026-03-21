// src/tools/definitions.js
// Définitions des outils exposés à Claude (format Anthropic tool_use)

const TOOLS = [
  {
    name: 'search_trips',
    description: `Recherche des trajets de bus disponibles entre deux villes.
Utiliser quand l'utilisateur veut trouver un bus, voir les horaires, comparer les prix.
Villes disponibles : Paris, Lyon, Marseille, Bordeaux, Toulouse, Nice, Nantes, Lille, Strasbourg.`,
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Ville de départ (ex: "Paris"). Doit correspondre exactement à une ville disponible.',
        },
        to: {
          type: 'string',
          description: 'Ville d\'arrivée (ex: "Lyon").',
        },
        date: {
          type: 'string',
          description: 'Date de voyage au format YYYY-MM-DD (ex: "2026-03-20"). Si non précisé, utiliser la date du jour.',
        },
        pax: {
          type: 'number',
          description: 'Nombre de passagers (1-9). Défaut: 1.',
        },
      },
      required: ['from', 'to', 'date'],
    },
  },

  {
    name: 'get_trip_detail',
    description: `Récupère les détails complets d'un trajet, incluant le plan des sièges disponibles.
Utiliser après search_trips pour voir quels sièges sont libres avant de réserver.`,
    input_schema: {
      type: 'object',
      properties: {
        trip_id: {
          type: 'string',
          description: 'Identifiant du trajet retourné par search_trips.',
        },
      },
      required: ['trip_id'],
    },
  },

  {
    name: 'get_stations',
    description: 'Liste toutes les gares/stations disponibles sur la plateforme busGO avec leurs coordonnées.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  {
    name: 'create_booking',
    description: `Crée une réservation pour un trajet.
IMPORTANT : Toujours confirmer avec l'utilisateur avant d'appeler cet outil (afficher le récapitulatif et demander confirmation).
Le siège doit être un numéro libre (1-40) obtenu via get_trip_detail.`,
    input_schema: {
      type: 'object',
      properties: {
        trip_id: {
          type: 'string',
          description: 'Identifiant du trajet à réserver.',
        },
        seat: {
          type: 'number',
          description: 'Numéro du siège à réserver (1-40), doit être un siège libre.',
        },
        pax: {
          type: 'number',
          description: 'Nombre de passagers.',
        },
        payment_method: {
          type: 'string',
          enum: ['card', 'paypal', 'applepay', 'googlepay'],
          description: 'Méthode de paiement.',
        },
        date: {
          type: 'string',
          description: 'Date de voyage YYYY-MM-DD.',
        },
      },
      required: ['trip_id', 'seat', 'pax', 'payment_method', 'date'],
    },
  },

  {
    name: 'get_booking',
    description: 'Récupère les détails d\'une réservation existante par son identifiant (ex: BG3A7F2E1).',
    input_schema: {
      type: 'object',
      properties: {
        booking_id: {
          type: 'string',
          description: 'Référence de la réservation (format BGxxxxxxx).',
        },
      },
      required: ['booking_id'],
    },
  },

  {
    name: 'cancel_booking',
    description: `Annule une réservation existante.
IMPORTANT : Demander confirmation explicite à l'utilisateur avant d'annuler.`,
    input_schema: {
      type: 'object',
      properties: {
        booking_id: {
          type: 'string',
          description: 'Référence de la réservation à annuler.',
        },
      },
      required: ['booking_id'],
    },
  },

  {
    name: 'get_my_bookings',
    description: 'Récupère toutes les réservations actives de l\'utilisateur.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  {
    name: 'check_api_health',
    description: 'Vérifie que l\'API busGO et la base de données sont opérationnelles.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

module.exports = TOOLS;
