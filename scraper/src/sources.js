// src/sources.js
// Plateformes et sources de données de transport camerounais

const SOURCES = [
  {
    id:      'intercitymobility',
    name:    'Intercity Mobility',
    url:     'https://www.intercitymobility.com',
    type:    'web',
    active:  true,
    notes:   'Plateforme de réservation de bus interurbains au Cameroun',
  },
  {
    id:      'cameroontransport',
    name:    'Cameroon Transport',
    url:     'https://www.cameroontransport.com',
    type:    'web',
    active:  true,
    notes:   'Horaires et tarifs des compagnies de bus',
  },
  {
    id:      'bibilong',
    name:    'Bibilong Voyages',
    url:     'https://www.bibilong.cm',
    type:    'web',
    active:  true,
    notes:   'Site officiel Bibilong',
  },
  {
    id:      'general_express',
    name:    'General Express Voyages',
    url:     'https://www.generalexpressvoyages.com',
    type:    'web',
    active:  true,
    notes:   'Compagnie GEV — Yaoundé/Douala/Nord',
  },
  {
    id:      'touristique_express',
    name:    'Touristique Express',
    url:     'https://www.touristiqueexpress.cm',
    type:    'web',
    active:  true,
    notes:   'Compagnie TE — Ouest/Centre',
  },
  {
    id:      'vatican_express',
    name:    'Vatican Express',
    url:     'https://vaticanexpress.cm',
    type:    'web',
    active:  true,
    notes:   'Vatican Express — Littoral/Centre',
  },
  {
    id:      'google_maps',
    name:    'Google Maps Transit',
    url:     'https://maps.googleapis.com/maps/api',
    type:    'api',
    active:  false, // nécessite une clé API payante
    notes:   'Données transit Google — optionnel',
  },
];

// Villes camerounaises avec coordonnées GPS précises
const CITIES_CM = {
  'Yaoundé':    { lat:  3.8480,  lng: 11.5021, terminal: 'Gare Routière de Mvan' },
  'Douala':     { lat:  4.0483,  lng:  9.7043,  terminal: 'Gare Routière de Bonabéri' },
  'Bafoussam':  { lat:  5.4737,  lng: 10.4174,  terminal: 'Gare Routière Centrale' },
  'Bamenda':    { lat:  5.9631,  lng: 10.1591,  terminal: 'Gare Routière Commercial Ave' },
  'Ngaoundéré': { lat:  7.3267,  lng: 13.5836,  terminal: 'Gare Routière du Centre' },
  'Garoua':     { lat:  9.3017,  lng: 13.3972,  terminal: 'Gare Routière de Garoua' },
  'Kribi':      { lat:  2.9393,  lng:  9.9071,  terminal: 'Gare Routière de Kribi' },
  'Buea':       { lat:  4.1527,  lng:  9.2408,  terminal: 'Gare Routière de Buea Town' },
  'Ebolowa':    { lat:  2.9000,  lng: 11.1500,  terminal: 'Gare Routière Centrale' },
  'Bertoua':    { lat:  4.5766,  lng: 13.6836,  terminal: 'Gare Routière de Bertoua' },
  'Maroua':     { lat: 10.5908,  lng: 14.3159,  terminal: 'Gare Routière de Maroua' },
  'Limbé':      { lat:  4.0227,  lng:  9.1986,  terminal: 'Gare Routière de Limbé' },
};

// Compagnies connues et leurs caractéristiques
const COMPANIES = {
  'Bibilong':            { seats: 70, amenities: ['ac', 'usb'],        rating: 4.2 },
  'Vatican Express':     { seats: 70, amenities: ['ac'],               rating: 3.9 },
  'Touristique Express': { seats: 70, amenities: ['ac', 'usb'],        rating: 4.1 },
  'General Express':     { seats: 70, amenities: ['ac', 'usb', 'wifi'], rating: 4.3 },
  'Garanti Express':     { seats: 70, amenities: ['ac'],               rating: 3.8 },
  'Amour Mezam':         { seats: 70, amenities: ['ac', 'usb'],        rating: 4.0 },
  'Finexs':              { seats: 70, amenities: ['ac'],               rating: 3.7 },
  'Binam':               { seats: 60, amenities: [],                   rating: 3.5 },
  'Horizon Express':     { seats: 70, amenities: ['ac'],               rating: 3.9 },
  'Avenir':              { seats: 70, amenities: ['ac', 'usb'],        rating: 4.0 },
};

module.exports = { SOURCES, CITIES_CM, COMPANIES };
