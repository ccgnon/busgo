const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_trips',
      description: 'Recherche des trajets de bus entre deux villes du Cameroun. Villes: Yaoundé, Douala, Bafoussam, Bamenda, Ngaoundéré, Garoua, Kribi, Buea, Ebolowa, Bertoua, Maroua, Limbé.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Ville de départ.' },
          to:   { type: 'string', description: 'Ville d\'arrivée.' },
          date: { type: 'string', description: 'Date YYYY-MM-DD.' },
          pax:  { type: 'integer', description: 'Nombre de passagers (1-9). Défaut: 1.' },
        },
        required: ['from', 'to', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_trip_detail',
      description: 'Détails d\'un trajet avec sièges disponibles.',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'ID du trajet.' },
        },
        required: ['trip_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stations',
      description: 'Liste toutes les gares routières du Cameroun.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Crée une réservation. Confirmer avec l\'utilisateur avant.',
      parameters: {
        type: 'object',
        properties: {
          trip_id:        { type: 'string' },
          seat:           { type: 'integer', description: 'Numéro de siège libre (1-70).' },
          pax:            { type: 'integer' },
          payment_method: { type: 'string', enum: ['card','paypal','applepay','googlepay','mtn_momo','orange_money'] },
          date:           { type: 'string', description: 'Date YYYY-MM-DD.' },
        },
        required: ['trip_id', 'seat', 'pax', 'payment_method', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_booking',
      description: 'Récupère une réservation par son ID (format BGxxxxxxx).',
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string' },
        },
        required: ['booking_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_booking',
      description: 'Annule une réservation. Demander confirmation avant.',
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string' },
        },
        required: ['booking_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_bookings',
      description: 'Liste toutes les réservations de l\'utilisateur.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_api_health',
      description: 'Vérifie l\'état de l\'API busGO.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Météo actuelle d\'une ville camerounaise. Utiliser quand l\'utilisateur demande le temps, la météo, s\'il pleut, les conditions climatiques.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'Ville camerounaise (ex: "Douala").' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather_forecast',
      description: 'Prévisions météo sur plusieurs jours pour une ville camerounaise.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'Ville camerounaise.' },
          days: { type: 'integer', description: 'Nombre de jours (1-5). Défaut: 3.' },
        },
        required: ['city'],
      },
    },
  },
];

module.exports = TOOLS;
