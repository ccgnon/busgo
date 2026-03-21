const Groq = require('groq-sdk');
const { executeTool } = require('../tools/executor');
const memory = require('../memory/conversationMemory');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

// ── Outils SANS météo (le LLM génère mal le format pour get_weather) ──────────
const TOOLS_TRANSPORT = require('../tools/definitions').filter(t =>
  !['get_weather', 'get_weather_forecast'].includes(t.function.name)
);

const CITY_MAP = {
  'bonaberi':'Douala','bonabéri':'Douala','akwa':'Douala','bonanjo':'Douala',
  'deido':'Douala','bassa':'Douala','ndokoti':'Douala','makepe':'Douala',
  'logbessou':'Douala','new bell':'Douala','bonassama':'Douala',
  'mvan':'Yaoundé','mvog-mbi':'Yaoundé','mvog mbi':'Yaoundé',
  'biyem-assi':'Yaoundé','biyem assi':'Yaoundé','essos':'Yaoundé',
  'nlongkak':'Yaoundé','bastos':'Yaoundé','ngousso':'Yaoundé',
  'ekounou':'Yaoundé','odza':'Yaoundé','mendong':'Yaoundé',
  'banengo':'Bafoussam','djeleng':'Bafoussam','kamkop':'Bafoussam',
  'nkwen':'Bamenda','mile 4':'Bamenda','mile4':'Bamenda',
  'molyko':'Buea','buea town':'Buea',
  'down beach':'Limbé','limbe beach':'Limbé','limbe':'Limbé',
  'yaounde':'Yaoundé','yaoundé':'Yaoundé','douala':'Douala',
  'bafoussam':'Bafoussam','bamenda':'Bamenda',
  'ngaoundere':'Ngaoundéré','ngaoundéré':'Ngaoundéré',
  'garoua':'Garoua','kribi':'Kribi','buea':'Buea',
  'ebolowa':'Ebolowa','bertoua':'Bertoua','maroua':'Maroua','limbé':'Limbé',
};

function normalizeCity(input) {
  if (!input) return input;
  return CITY_MAP[input.toLowerCase().trim()] || input;
}

// ── Détecter si le message parle de météo ────────────────────────────────────
function isWeatherQuery(text) {
  const keywords = ['météo','meteo','temps','température','temperature','pleut','pluie',
    'nuageux','soleil','chaud','froid','humide','orage','vent','forecast','prévision',
    'weather','climat','climatique'];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ── Extraire la ville d'un message météo ─────────────────────────────────────
function extractCityFromWeatherQuery(text) {
  const cities = ['Yaoundé','Douala','Bafoussam','Bamenda','Ngaoundéré',
    'Garoua','Kribi','Buea','Ebolowa','Bertoua','Maroua','Limbé'];
  for (const city of cities) {
    if (text.toLowerCase().includes(city.toLowerCase())) return city;
  }
  // Chercher via CITY_MAP
  const lower = text.toLowerCase();
  for (const [alias, city] of Object.entries(CITY_MAP)) {
    if (lower.includes(alias)) return city;
  }
  return null;
}

// ── Formater la météo en message lisible ─────────────────────────────────────
function formatWeatherMessage(w) {
  if (w.error) return `❌ ${w.error}`;
  let msg = `${w.icon} *Météo à ${w.city}*\n\n`;
  msg += `🌡️ Température : *${w.temp}°C* (ressenti ${w.feels_like}°C)\n`;
  msg += `💧 Humidité : ${w.humidity}%\n`;
  msg += `🌬️ Vent : ${w.wind_speed} km/h\n`;
  msg += `☁️ Conditions : ${w.description_fr}\n\n`;
  msg += `${w.travel_advice}`;
  if (w.source) msg += `\n\n_${w.source}_`;
  return msg;
}

function formatForecastMessage(data) {
  if (data.error) return `❌ ${data.error}`;
  let msg = `📅 *Prévisions météo — ${data.city}*\n\n`;
  for (const d of data.forecast) {
    const date = new Date(d.date + 'T12:00').toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
    msg += `${d.icon} *${date}* : ${d.temp_min}–${d.temp_max}°C, ${d.description}`;
    if (d.rain_chance) msg += ' 🌧️';
    msg += '\n';
  }
  if (data.source) msg += `\n_${data.source}_`;
  return msg;
}

const SYSTEM_PROMPT = `Tu es BusBot, assistant de busGO Cameroun.

VILLES DISPONIBLES (utilise ces noms EXACTS pour les outils) :
Yaoundé, Douala, Bafoussam, Bamenda, Ngaoundéré, Garoua, Kribi, Buea, Ebolowa, Bertoua, Maroua, Limbé

Si l'utilisateur mentionne un quartier (Bonabéri, Akwa, Mvan...), utilise la ville principale et informe-le.
Confirme TOUJOURS avant de réserver. Prix en FCFA.
Date : ${new Date().toISOString().split('T')[0]}.`;

async function processMessage(userId, userMsg) {
  // ── Traitement météo DIRECT (sans passer par les tools LLM) ─────────────────
  if (isWeatherQuery(userMsg)) {
    const city = extractCityFromWeatherQuery(userMsg);
    if (city) {
      try {
        const weather = require('../tools/weatherClient');
        const isForecast = /prévi|forecast|demain|weekend|semaine|prochain/i.test(userMsg);
        if (isForecast) {
          const data = await weather.getWeatherForecast({ city, days: 3 });
          return formatForecastMessage(data);
        } else {
          const data = await weather.getWeather({ city });
          return formatWeatherMessage(data);
        }
      } catch (err) {
        return `❌ Impossible de récupérer la météo : ${err.message}`;
      }
    }
    // Pas de ville trouvée → demander précision
    return '🌤️ Pour quelle ville souhaitez-vous la météo ?\n\nVilles disponibles : Yaoundé, Douala, Bafoussam, Bamenda, Ngaoundéré, Garoua, Kribi, Buea, Ebolowa, Bertoua, Maroua, Limbé';
  }

  // ── Traitement normal via LLM + tools transport ───────────────────────────
  memory.addUserMessage(userId, userMsg);
  const buildMessages = () => [
    { role: 'system', content: SYSTEM_PROMPT },
    ...memory.getMessages(userId),
  ];
  let iterations = 0, finalResponse = null;

  while (iterations < 10) {
    iterations++;
    console.log(`\n🔄 Iteration ${iterations} — userId: ${userId}`);

    const response = await groq.chat.completions.create({
      model:       MODEL,
      max_tokens:  2048,
      tools:       TOOLS_TRANSPORT,
      tool_choice: 'auto',
      messages:    buildMessages(),
    });

    const msg = response.choices[0].message;
    const finishReason = response.choices[0].finish_reason;
    console.log(`   finish_reason: ${finishReason}`);

    if (finishReason === 'stop' || (!msg.tool_calls?.length && msg.content)) {
      finalResponse = msg.content || 'Je n\'ai pas pu générer de réponse.';
      memory.addRawMessages(userId, [{ role: 'assistant', content: finalResponse }]);
      break;
    }

    if (msg.tool_calls?.length > 0) {
      memory.addRawMessages(userId, [{
        role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls,
      }]);

      for (const toolCall of msg.tool_calls) {
        const toolName = toolCall.function.name;
        let toolInput = {};
        try { toolInput = JSON.parse(toolCall.function.arguments || '{}'); } catch {}

        if (toolInput.pax  !== undefined) toolInput.pax  = parseInt(toolInput.pax,  10) || 1;
        if (toolInput.seat !== undefined) toolInput.seat = parseInt(toolInput.seat, 10);
        if (toolInput.from) toolInput.from = normalizeCity(toolInput.from);
        if (toolInput.to)   toolInput.to   = normalizeCity(toolInput.to);

        console.log(`🔧 Tool: ${toolName}`, toolInput);
        const result = await executeTool(toolName, toolInput);

        memory.addRawMessages(userId, [{
          role: 'tool', tool_call_id: toolCall.id,
          name: toolName, content: JSON.stringify(result),
        }]);

        if (toolName === 'search_trips' && result.trips?.length > 0)
          memory.updateContext(userId, { preferredFrom: toolInput.from, preferredTo: toolInput.to, lastTripId: result.trips[0].id });
        if (toolName === 'create_booking' && result.booking?.id)
          memory.updateContext(userId, { lastBookingId: result.booking.id });
      }
      continue;
    }

    finalResponse = 'Erreur inattendue, veuillez réessayer.';
    break;
  }
  return finalResponse || 'Désolé, reformulez votre demande.';
}

module.exports = { processMessage };
