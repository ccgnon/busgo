// src/tools/executor.js
// Exécute les appels d'outils demandés par Claude

const client = require('./busgoClient');

async function executeTool(toolName, toolInput) {
  console.log(`🔧 Tool call: ${toolName}`, JSON.stringify(toolInput, null, 2));

  try {
    switch (toolName) {
      case 'search_trips':
        return await client.searchTrips(toolInput);

      case 'get_trip_detail':
        return await client.getTripDetail(toolInput);

      case 'get_stations':
        return await client.getStations();

      case 'create_booking':
        return await client.createBooking(toolInput);

      case 'get_booking':
        return await client.getBooking(toolInput);

      case 'cancel_booking':
        return await client.cancelBooking(toolInput);

      case 'get_my_bookings':
        return await client.getMyBookings();

      case 'check_api_health':
        return await client.checkHealth();

      default:
        return { error: `Outil inconnu : ${toolName}` };
    }
  } catch (err) {
    const message = err.response?.data?.error || err.message || 'Erreur inconnue';
    console.error(`❌ Tool error [${toolName}]:`, message);
    return { error: message };
  }
}

module.exports = { executeTool };
