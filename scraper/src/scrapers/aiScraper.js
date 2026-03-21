const axios = require('axios');

let _groq = null;
function getGroq() {
  if (!_groq) {
    const Groq = require('groq-sdk');
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

async function fetchPage(url) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr-FR' },
  });
  return res.data;
}

function cleanHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 8000);
}

async function extractTripsFromText(text, context = {}) {
  const groq = getGroq();
  const prompt = `Extrait les trajets de bus camerounais de ce texte.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"trips":[{"from":"Yaoundé","to":"Douala","depTime":"06:00","arrTime":"09:30","durationMin":210,"price":3500,"company":"Bibilong","stops":0,"amenities":["ac"]}]}
Si rien trouvé : {"trips":[]}
TEXTE: ${text}`;
  const r = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile', max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  try { return JSON.parse(r.choices[0].message.content.replace(/```json|```/g,'').trim()); }
  catch { return { trips: [] }; }
}

async function scrapeWebsite(source) {
  console.log(`\n🌐 Scraping ${source.name}...`);
  const results = { source: source.id, trips: [], errors: [] };
  try {
    const html = await fetchPage(source.url);
    const extracted = await extractTripsFromText(cleanHtml(html), { source: source.name });
    results.trips = extracted.trips || [];
    console.log(`   🤖 ${results.trips.length} trajets extraits`);
  } catch (err) {
    console.log(`   ❌ ${err.message}`);
    results.errors.push(err.message);
  }
  return results;
}

async function scrapeIntercityMobility() {
  return { source: 'intercitymobility', trips: [], errors: [] };
}

module.exports = { scrapeWebsite, scrapeIntercityMobility, extractTripsFromText, fetchPage, cleanHtml };
