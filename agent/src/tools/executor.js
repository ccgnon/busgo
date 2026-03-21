// src/tools/executor.js
const client = require('./busgoClient');

async function executeTool(toolName, toolInput) {
  console.log(`🔧 Tool call: ${toolName}`, JSON.stringify(toolInput, null, 2));

  // Normaliser les types — le LLM envoie parfois des strings au lieu de numbers
  const input = { ...toolInput };
  if (input.pax  !== undefined) input.pax  = parseInt(input.pax,  10) || 1;
  if (input.seat !== undefined) input.seat = parseInt(input.seat, 10);

  try {
    switch (toolName) {
      case 'search_trips':      return await client.searchTrips(input);
      case 'get_trip_detail':   return await client.getTripDetail(input);
      case 'get_stations':      return await client.getStations();
      case 'create_booking':    return await client.createBooking(input);
      case 'get_booking':       return await client.getBooking(input);
      case 'cancel_booking':    return await client.cancelBooking(input);
      case 'get_my_bookings':   return await client.getMyBookings();
      case 'check_api_health':  return await client.checkHealth();
      case 'get_weather': {
        const weather = require('./weatherClient');
        return await weather.getWeather(input);
      }
      case 'get_weather_forecast': {
        const weather = require('./weatherClient');
        return await weather.getWeatherForecast(input);
      }
      default: return { error: `Outil inconnu : ${toolName}` };
    }
  } catch (err) {
    const message = err.response?.data?.error || err.message || 'Erreur inconnue';
    console.error(`❌ Tool error [${toolName}]:`, message);
    return { error: message };
  }
}

module.exports = { executeTool };
