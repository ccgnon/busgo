// src/tools/weatherClient.js
// Client météo — OpenWeatherMap API (gratuit, 1000 appels/jour)
// Inscription : https://openweathermap.org/api → API Key gratuite

const axios = require('axios');

// Coordonnées GPS des villes camerounaises
const CITY_COORDS = {
  'Yaoundé':    { lat:  3.8480,  lon: 11.5021, en: 'Yaounde' },
  'Douala':     { lat:  4.0483,  lon:  9.7043,  en: 'Douala' },
  'Bafoussam':  { lat:  5.4737,  lon: 10.4174,  en: 'Bafoussam' },
  'Bamenda':    { lat:  5.9631,  lon: 10.1591,  en: 'Bamenda' },
  'Ngaoundéré': { lat:  7.3267,  lon: 13.5836,  en: 'Ngaoundere' },
  'Garoua':     { lat:  9.3017,  lon: 13.3972,  en: 'Garoua' },
  'Kribi':      { lat:  2.9393,  lon:  9.9071,  en: 'Kribi' },
  'Buea':       { lat:  4.1527,  lon:  9.2408,  en: 'Buea' },
  'Ebolowa':    { lat:  2.9000,  lon: 11.1500,  en: 'Ebolowa' },
  'Bertoua':    { lat:  4.5766,  lon: 13.6836,  en: 'Bertoua' },
  'Maroua':     { lat: 10.5908,  lon: 14.3159,  en: 'Maroua' },
  'Limbé':      { lat:  4.0227,  lon:  9.1986,  en: 'Limbe' },
};

const WEATHER_ICONS = {
  'Clear':        '☀️',
  'Clouds':       '☁️',
  'Rain':         '🌧️',
  'Drizzle':      '🌦️',
  'Thunderstorm': '⛈️',
  'Snow':         '❄️',
  'Mist':         '🌫️',
  'Fog':          '🌫️',
  'Haze':         '🌫️',
  'Dust':         '🌪️',
  'Sand':         '🌪️',
};

const WEATHER_FR = {
  'clear sky':              'Ciel dégagé',
  'few clouds':             'Quelques nuages',
  'scattered clouds':       'Nuages épars',
  'broken clouds':          'Nuageux',
  'overcast clouds':        'Couvert',
  'light rain':             'Pluie légère',
  'moderate rain':          'Pluie modérée',
  'heavy intensity rain':   'Pluie forte',
  'thunderstorm':           'Orage',
  'light thunderstorm':     'Orage léger',
  'drizzle':                'Bruine',
  'mist':                   'Brume',
  'fog':                    'Brouillard',
  'haze':                   'Brume sèche',
  'dust':                   'Poussière',
};

function translateDesc(desc) {
  return WEATHER_FR[desc.toLowerCase()] || desc;
}

// ── Météo actuelle ────────────────────────────────────────────────────────────
async function getWeather({ city }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'YOUR_KEY') {
    // Fallback sans API key — données simulées réalistes pour le Cameroun
    return getFallbackWeather(city);
  }

  const coords = CITY_COORDS[city];
  if (!coords) return { error: `Ville inconnue : ${city}` };

  try {
    const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat:   coords.lat,
        lon:   coords.lon,
        appid: apiKey,
        units: 'metric',
        lang:  'fr',
      },
      timeout: 8000,
    });

    const d = res.data;
    const icon = WEATHER_ICONS[d.weather[0].main] || '🌤️';

    return {
      city,
      temp:        Math.round(d.main.temp),
      feels_like:  Math.round(d.main.feels_like),
      humidity:    d.main.humidity,
      description: d.weather[0].description,
      description_fr: translateDesc(d.weather[0].description),
      icon,
      wind_speed:  Math.round(d.wind.speed * 3.6), // m/s → km/h
      visibility:  d.visibility ? Math.round(d.visibility / 1000) : null,
      main:        d.weather[0].main,
      travel_advice: getTravelAdvice(d.weather[0].main, d.main.temp),
    };
  } catch (err) {
    if (err.response?.status === 401) {
      return getFallbackWeather(city);
    }
    throw new Error(`Météo indisponible pour ${city} : ${err.message}`);
  }
}

// ── Prévisions 5 jours ────────────────────────────────────────────────────────
async function getWeatherForecast({ city, days = 3 }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'YOUR_KEY') {
    return getFallbackForecast(city, days);
  }

  const coords = CITY_COORDS[city];
  if (!coords) return { error: `Ville inconnue : ${city}` };

  try {
    const res = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat:   coords.lat,
        lon:   coords.lon,
        appid: apiKey,
        units: 'metric',
        lang:  'fr',
        cnt:   days * 8, // 8 mesures/jour (toutes les 3h)
      },
      timeout: 8000,
    });

    // Grouper par jour
    const byDay = {};
    for (const item of res.data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!byDay[date]) byDay[date] = [];
      byDay[date].push(item);
    }

    const forecast = Object.entries(byDay).slice(0, days).map(([date, items]) => {
      const temps = items.map(i => i.main.temp);
      const main  = items[Math.floor(items.length / 2)].weather[0];
      return {
        date,
        temp_min:    Math.round(Math.min(...temps)),
        temp_max:    Math.round(Math.max(...temps)),
        description: translateDesc(main.description),
        icon:        WEATHER_ICONS[main.main] || '🌤️',
        rain_chance: items.filter(i => ['Rain','Thunderstorm','Drizzle'].includes(i.weather[0].main)).length > 2,
      };
    });

    return { city, forecast };
  } catch {
    return getFallbackForecast(city, days);
  }
}

// ── Conseil voyage selon météo ────────────────────────────────────────────────
function getTravelAdvice(weatherMain, temp) {
  if (weatherMain === 'Thunderstorm')
    return '⚠️ Orage en cours — possible retard de bus. Prévoyez du temps supplémentaire.';
  if (weatherMain === 'Rain')
    return '🌧️ Pluie — les routes peuvent être glissantes. Départ recommandé tôt le matin.';
  if (temp > 35)
    return '🌡️ Forte chaleur — hydratez-vous bien pour le voyage.';
  if (weatherMain === 'Clear' && temp >= 20 && temp <= 30)
    return '✅ Conditions idéales pour voyager.';
  if (weatherMain === 'Mist' || weatherMain === 'Fog')
    return '🌫️ Visibilité réduite — les bus peuvent prendre du retard sur les routes de montagne.';
  return '🚌 Conditions de voyage correctes.';
}

// ── Données de secours (sans clé API) ────────────────────────────────────────
function getFallbackWeather(city) {
  // Données climatiques moyennes réalistes pour le Cameroun
  const CLIMATE = {
    'Yaoundé':    { temp: 24, humidity: 78, desc: 'Partiellement nuageux', main: 'Clouds' },
    'Douala':     { temp: 28, humidity: 85, desc: 'Pluie légère',           main: 'Rain'   },
    'Bafoussam':  { temp: 21, humidity: 72, desc: 'Ciel dégagé',            main: 'Clear'  },
    'Bamenda':    { temp: 20, humidity: 70, desc: 'Quelques nuages',        main: 'Clouds' },
    'Ngaoundéré': { temp: 26, humidity: 55, desc: 'Ciel dégagé',            main: 'Clear'  },
    'Garoua':     { temp: 32, humidity: 40, desc: 'Ciel dégagé',            main: 'Clear'  },
    'Kribi':      { temp: 27, humidity: 82, desc: 'Pluie modérée',          main: 'Rain'   },
    'Buea':       { temp: 22, humidity: 80, desc: 'Nuageux',                main: 'Clouds' },
    'Ebolowa':    { temp: 25, humidity: 75, desc: 'Ciel dégagé',            main: 'Clear'  },
    'Bertoua':    { temp: 26, humidity: 70, desc: 'Quelques nuages',        main: 'Clouds' },
    'Maroua':     { temp: 34, humidity: 35, desc: 'Ciel dégagé',            main: 'Clear'  },
    'Limbé':      { temp: 27, humidity: 83, desc: 'Pluie légère',           main: 'Rain'   },
  };
  const c = CLIMATE[city] || { temp: 25, humidity: 70, desc: 'Partiellement nuageux', main: 'Clouds' };
  return {
    city,
    temp:           c.temp,
    feels_like:     c.temp - 2,
    humidity:       c.humidity,
    description:    c.desc,
    description_fr: c.desc,
    icon:           WEATHER_ICONS[c.main] || '🌤️',
    wind_speed:     12,
    main:           c.main,
    travel_advice:  getTravelAdvice(c.main, c.temp),
    source:         'données climatiques moyennes (configurez OPENWEATHER_API_KEY pour la météo en temps réel)',
  };
}

function getFallbackForecast(city, days) {
  const forecast = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    forecast.push({
      date:        d.toISOString().split('T')[0],
      temp_min:    20 + Math.floor(Math.random() * 5),
      temp_max:    26 + Math.floor(Math.random() * 8),
      description: i % 3 === 0 ? 'Pluie légère' : 'Partiellement nuageux',
      icon:        i % 3 === 0 ? '🌧️' : '⛅',
      rain_chance: i % 3 === 0,
    });
  }
  return { city, forecast, source: 'données estimées' };
}

module.exports = { getWeather, getWeatherForecast, CITY_COORDS };
