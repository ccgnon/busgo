// src/services/dynamicPricing.js — Yield management busGO
const prisma = require('../lib/prisma');

// Coefficients selon le taux de remplissage
const PRICING_RULES = [
  { maxOccupancy: 0.30, multiplier: 0.95 }, // -5% si < 30%
  { maxOccupancy: 0.50, multiplier: 1.00 }, // prix de base
  { maxOccupancy: 0.70, multiplier: 1.10 }, // +10%
  { maxOccupancy: 0.85, multiplier: 1.25 }, // +25%
  { maxOccupancy: 0.95, multiplier: 1.40 }, // +40%
  { maxOccupancy: 1.00, multiplier: 1.50 }, // +50% (quasi complet)
];

// Majoration événements
const SEASONAL_EVENTS = [
  { name: 'Fête nationale',  month: 5,  day: 20, days: 3, mult: 1.3 },
  { name: 'Fête nationale',  month: 1,  day: 1,  days: 2, mult: 1.2 },
  { name: 'Noël',            month: 12, day: 24, days: 4, mult: 1.35 },
  { name: 'Pâques',          month: 4,  day: 1,  days: 3, mult: 1.2 },
];

function getSeasonalMultiplier(dateStr) {
  if (!dateStr) return 1;
  const d = new Date(dateStr + 'T12:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();

  for (const ev of SEASONAL_EVENTS) {
    if (ev.month === m) {
      const diff = day - ev.day;
      if (diff >= 0 && diff < ev.days) return ev.mult;
    }
  }
  return 1;
}

function getOccupancyMultiplier(takenSeats, totalSeats) {
  const rate = takenSeats / totalSeats;
  for (const rule of PRICING_RULES) {
    if (rate <= rule.maxOccupancy) return rule.multiplier;
  }
  return 1.5;
}

async function getDynamicPrice(trip, travelDate) {
  if (!trip.dynamicPrice) return trip.price;

  const takenCount = await prisma.seatSlot.count({
    where: { tripId: trip.id, status: 'TAKEN' },
  });

  const occMult      = getOccupancyMultiplier(takenCount, trip.totalSeats);
  const seasonMult   = getSeasonalMultiplier(travelDate);
  const finalMult    = Math.min(occMult * seasonMult, 1.8); // cap à +80%
  const dynamicPrice = Math.round(trip.price * finalMult / 100) * 100; // arrondi 100 FCFA

  return dynamicPrice;
}

async function enrichTripsWithDynamicPrices(trips, travelDate) {
  return Promise.all(trips.map(async (trip) => {
    if (!trip.dynamicPrice) return trip;
    const dp = await getDynamicPrice(trip, travelDate);
    return { ...trip, price: dp, unitPrice: dp, originalPrice: trip.price };
  }));
}

module.exports = { getDynamicPrice, enrichTripsWithDynamicPrices, getSeasonalMultiplier, getOccupancyMultiplier };
