import { TRAVEL_DESTINATIONS } from '../data/travelDestinations';

/**
 * @typedef {{ id: string, label: string, country: string, city: string | null, flag: string, x: number, y: number, score: number }} DestinationMatch
 */

function scoreMatch(text, query) {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  return 0;
}

/**
 * @param {string} query
 * @param {number} [limit]
 * @returns {DestinationMatch[]}
 */
export function searchTravelDestinations(query, limit = 12) {
  const q = query.trim();
  if (q.length < 1) return [];

  /** @type {DestinationMatch[]} */
  const matches = [];

  for (const dest of TRAVEL_DESTINATIONS) {
    const countryScore = Math.max(
      scoreMatch(dest.country, q),
      ...dest.keywords.map((k) => scoreMatch(k, q)),
    );

    if (countryScore > 0) {
      matches.push({
        id: `${dest.id}-country`,
        label: dest.country,
        country: dest.country,
        city: null,
        flag: dest.flag,
        x: dest.x,
        y: dest.y,
        score: countryScore + 5,
      });
    }

    for (const city of dest.cities) {
      const cityScore = scoreMatch(city, q);
      if (cityScore > 0) {
        matches.push({
          id: `${dest.id}-${city}`,
          label: `${city}, ${dest.country}`,
          country: dest.country,
          city,
          flag: dest.flag,
          x: dest.x,
          y: dest.y,
          score: cityScore + 10,
        });
      }
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .filter((m, i, arr) => arr.findIndex((x) => x.label === m.label) === i)
    .slice(0, limit);
}

/** Unique map points for matched results (by country id prefix). */
export function getMapPointsFromMatches(matches) {
  const seen = new Set();
  /** @type {{ id: string, label: string, x: number, y: number, flag: string }[]} */
  const points = [];

  for (const m of matches) {
    const countryId = m.id.split('-')[0];
    if (seen.has(countryId)) continue;
    seen.add(countryId);
    points.push({
      id: countryId,
      label: m.city || m.country,
      x: m.x,
      y: m.y,
      flag: m.flag,
    });
  }
  return points.slice(0, 8);
}
