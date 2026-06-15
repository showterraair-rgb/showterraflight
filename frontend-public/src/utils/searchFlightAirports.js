import { FLIGHT_AIRPORTS, groupAirportsByCountry } from '../data/flightAirports';

function scoreMatch(text, query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  return 0;
}

export function searchFlightAirports(query, limit = 200) {
  const q = query.trim();

  if (q.length < 1) {
    return FLIGHT_AIRPORTS.map((airport) => ({
      ...airport,
      id: airport.code,
      label: airport.code,
      score: 0,
    })).slice(0, limit);
  }

  return FLIGHT_AIRPORTS
    .map((airport) => {
      const codeScore = scoreMatch(airport.code, q);
      const cityScore = scoreMatch(airport.city, q);
      const countryScore = scoreMatch(airport.country, q);
      const ccScore = scoreMatch(airport.countryCode, q);
      const score = Math.max(codeScore * 2, cityScore + 5, countryScore, ccScore + 3);
      return score > 0
        ? { ...airport, id: airport.code, label: airport.code, score }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code))
    .slice(0, limit);
}

export function getMapPointsFromAirportMatches(matches) {
  const seen = new Set();
  return matches
    .filter((m) => {
      if (seen.has(m.countryCode)) return false;
      seen.add(m.countryCode);
      return true;
    })
    .slice(0, 8)
    .map((m) => ({
      id: m.countryCode,
      label: m.code,
      x: m.x,
      y: m.y,
      flag: m.flag,
    }));
}

export { groupAirportsByCountry };
