const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_trips',
      description: 'Recherche des trajets de bus entre deux villes du Cameroun dans la base de données locale. Villes supportées : Yaoundé, Douala, Bafoussam, Bamenda, Ngaoundéré, Garoua, Kribi, Buea, Ebolowa, Bertoua, Maroua, Limbé.',
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
      description: 'Récupère les détails d\'un trajet spécifique incluant le plan des sièges disponibles (1-70).',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'ID unique du trajet.' },
        },
        required: ['trip_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'trigger_live_sync',
      description: 'Recherche des trajets en temps réel sur les sites web d\'autres agences camerounaises (Bibilong, Touristique, Vatican Express, etc.) et met à jour la base de données busGO. À utiliser si search_trips ne retourne aucun résultat ou si l\'utilisateur demande des horaires plus récents.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Ville de départ.' },
          to:   { type: 'string', description: 'Ville d\'arrivée.' },
          force_refresh: { type: 'boolean', description: 'Forcer la mise à jour même si des données locales existent.' }
        },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stations',
      description: 'Liste toutes les gares routières et terminaux disponibles au Cameroun avec leurs coordonnées.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Crée une réservation officielle. IMPORTANT : Toujours confirmer les détails (trajet, date, prix, siège) avec l\'utilisateur avant d\'appeler cet outil.',
      parameters: {
        type: 'object',
        properties: {
          trip_id:        { type: 'string' },
          seat:           { type: 'integer', description: 'Numéro de siège choisi (doit être libre).' },
          pax:            { type: 'integer' },
          payment_method: { type: 'string', enum: ['card','paypal','applepay','googlepay','mtn_momo','orange_money'] },
          date:           { type: 'string', description: 'Date du voyage YYYY-MM-DD.' },
        },
        required: ['trip_id', 'seat', 'pax', 'payment_method', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_booking',
      description: 'Consulte le statut d\'une réservation existante via sa référence (ex: BGXXXXXXX).',
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
      description: 'Annule une réservation. Nécessite une confirmation explicite du voyageur.',
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
      description: "Récupère l'historique complet des réservations de l'utilisateur connecté.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: "Donne la météo actuelle et les conseils de voyage pour une ville camerounaise. Utile pour prévenir l'utilisateur en cas de fortes pluies ou d'orages pouvant retarder les bus.",
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'Ville cible.' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_api_health',
      description: 'Vérifie si les systèmes de réservation busGO sont opérationnels.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

module.exports = TOOLS;