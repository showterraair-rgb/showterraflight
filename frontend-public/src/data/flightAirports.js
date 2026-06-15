/** IATA airport codes for flight booking From/To fields */

/** @typedef {{ code: string, city: string, country: string, countryCode: string, flag: string, x: number, y: number }} FlightAirport */

/** @type {FlightAirport[]} */
export const FLIGHT_AIRPORTS = [
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh', countryCode: 'BD', flag: '🇧🇩', x: 62, y: 48 },
  { code: 'ZYL', city: 'Sylhet', country: 'Bangladesh', countryCode: 'BD', flag: '🇧🇩', x: 62, y: 48 },
  { code: 'CGP', city: 'Chittagong', country: 'Bangladesh', countryCode: 'BD', flag: '🇧🇩', x: 62, y: 48 },
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', x: 42, y: 38 },
  { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', x: 42, y: 38 },
  { code: 'DMM', city: 'Dammam', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', x: 42, y: 38 },
  { code: 'MED', city: 'Madinah', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', x: 42, y: 38 },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', x: 48, y: 42 },
  { code: 'AUH', city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', x: 48, y: 42 },
  { code: 'SHJ', city: 'Sharjah', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', x: 48, y: 42 },
  { code: 'DOH', city: 'Doha', country: 'Qatar', countryCode: 'QA', flag: '🇶🇦', x: 46, y: 40 },
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait', countryCode: 'KW', flag: '🇰🇼', x: 44, y: 38 },
  { code: 'BAH', city: 'Manama', country: 'Bahrain', countryCode: 'BH', flag: '🇧🇭', x: 45, y: 41 },
  { code: 'MCT', city: 'Muscat', country: 'Oman', countryCode: 'OM', flag: '🇴🇲', x: 50, y: 44 },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', flag: '🇲🇾', x: 72, y: 52 },
  { code: 'PEN', city: 'Penang', country: 'Malaysia', countryCode: 'MY', flag: '🇲🇾', x: 72, y: 52 },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG', flag: '🇸🇬', x: 74, y: 54 },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', countryCode: 'TH', flag: '🇹🇭', x: 70, y: 48 },
  { code: 'HKT', city: 'Phuket', country: 'Thailand', countryCode: 'TH', flag: '🇹🇭', x: 70, y: 48 },
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', countryCode: 'ID', flag: '🇮🇩', x: 76, y: 54 },
  { code: 'DPS', city: 'Bali', country: 'Indonesia', countryCode: 'ID', flag: '🇮🇩', x: 76, y: 54 },
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN', flag: '🇻🇳', x: 73, y: 46 },
  { code: 'HAN', city: 'Hanoi', country: 'Vietnam', countryCode: 'VN', flag: '🇻🇳', x: 73, y: 46 },
  { code: 'MNL', city: 'Manila', country: 'Philippines', countryCode: 'PH', flag: '🇵🇭', x: 78, y: 48 },
  { code: 'DEL', city: 'Delhi', country: 'India', countryCode: 'IN', flag: '🇮🇳', x: 58, y: 42 },
  { code: 'BOM', city: 'Mumbai', country: 'India', countryCode: 'IN', flag: '🇮🇳', x: 58, y: 42 },
  { code: 'CCU', city: 'Kolkata', country: 'India', countryCode: 'IN', flag: '🇮🇳', x: 58, y: 42 },
  { code: 'MAA', city: 'Chennai', country: 'India', countryCode: 'IN', flag: '🇮🇳', x: 58, y: 42 },
  { code: 'KHI', city: 'Karachi', country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', x: 52, y: 38 },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', x: 52, y: 38 },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', x: 52, y: 38 },
  { code: 'KTM', city: 'Kathmandu', country: 'Nepal', countryCode: 'NP', flag: '🇳🇵', x: 60, y: 40 },
  { code: 'CMB', city: 'Colombo', country: 'Sri Lanka', countryCode: 'LK', flag: '🇱🇰', x: 58, y: 50 },
  { code: 'MLE', city: 'Malé', country: 'Maldives', countryCode: 'MV', flag: '🇲🇻', x: 56, y: 52 },
  { code: 'PEK', city: 'Beijing', country: 'China', countryCode: 'CN', flag: '🇨🇳', x: 74, y: 36 },
  { code: 'PVG', city: 'Shanghai', country: 'China', countryCode: 'CN', flag: '🇨🇳', x: 74, y: 36 },
  { code: 'CAN', city: 'Guangzhou', country: 'China', countryCode: 'CN', flag: '🇨🇳', x: 74, y: 36 },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', countryCode: 'JP', flag: '🇯🇵', x: 84, y: 36 },
  { code: 'HND', city: 'Tokyo Haneda', country: 'Japan', countryCode: 'JP', flag: '🇯🇵', x: 84, y: 36 },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', countryCode: 'KR', flag: '🇰🇷', x: 80, y: 36 },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', countryCode: 'TR', flag: '🇹🇷', x: 38, y: 32 },
  { code: 'SAW', city: 'Istanbul Sabiha', country: 'Turkey', countryCode: 'TR', flag: '🇹🇷', x: 38, y: 32 },
  { code: 'CAI', city: 'Cairo', country: 'Egypt', countryCode: 'EG', flag: '🇪🇬', x: 36, y: 40 },
  { code: 'CMN', city: 'Casablanca', country: 'Morocco', countryCode: 'MA', flag: '🇲🇦', x: 24, y: 38 },
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', flag: '🇿🇦', x: 34, y: 58 },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', countryCode: 'KE', flag: '🇰🇪', x: 42, y: 52 },
  { code: 'LHR', city: 'London Heathrow', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', x: 28, y: 28 },
  { code: 'LGW', city: 'London Gatwick', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', x: 28, y: 28 },
  { code: 'MAN', city: 'Manchester', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', x: 28, y: 28 },
  { code: 'DUB', city: 'Dublin', country: 'Ireland', countryCode: 'IE', flag: '🇮🇪', x: 24, y: 28 },
  { code: 'CDG', city: 'Paris', country: 'France', countryCode: 'FR', flag: '🇫🇷', x: 30, y: 32 },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', countryCode: 'DE', flag: '🇩🇪', x: 32, y: 28 },
  { code: 'MUC', city: 'Munich', country: 'Germany', countryCode: 'DE', flag: '🇩🇪', x: 32, y: 28 },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', x: 30, y: 26 },
  { code: 'BRU', city: 'Brussels', country: 'Belgium', countryCode: 'BE', flag: '🇧🇪', x: 29, y: 27 },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland', countryCode: 'CH', flag: '🇨🇭', x: 31, y: 30 },
  { code: 'FCO', city: 'Rome', country: 'Italy', countryCode: 'IT', flag: '🇮🇹', x: 32, y: 34 },
  { code: 'MXP', city: 'Milan', country: 'Italy', countryCode: 'IT', flag: '🇮🇹', x: 32, y: 34 },
  { code: 'MAD', city: 'Madrid', country: 'Spain', countryCode: 'ES', flag: '🇪🇸', x: 26, y: 34 },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', countryCode: 'ES', flag: '🇪🇸', x: 26, y: 34 },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', countryCode: 'PT', flag: '🇵🇹', x: 24, y: 34 },
  { code: 'ATH', city: 'Athens', country: 'Greece', countryCode: 'GR', flag: '🇬🇷', x: 34, y: 34 },
  { code: 'ARN', city: 'Stockholm', country: 'Sweden', countryCode: 'SE', flag: '🇸🇪', x: 32, y: 22 },
  { code: 'OSL', city: 'Oslo', country: 'Norway', countryCode: 'NO', flag: '🇳🇴', x: 30, y: 20 },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark', countryCode: 'DK', flag: '🇩🇰', x: 31, y: 24 },
  { code: 'HEL', city: 'Helsinki', country: 'Finland', countryCode: 'FI', flag: '🇫🇮', x: 34, y: 20 },
  { code: 'WAW', city: 'Warsaw', country: 'Poland', countryCode: 'PL', flag: '🇵🇱', x: 34, y: 26 },
  { code: 'PRG', city: 'Prague', country: 'Czech Republic', countryCode: 'CZ', flag: '🇨🇿', x: 33, y: 28 },
  { code: 'VIE', city: 'Vienna', country: 'Austria', countryCode: 'AT', flag: '🇦🇹', x: 33, y: 30 },
  { code: 'BUD', city: 'Budapest', country: 'Hungary', countryCode: 'HU', flag: '🇭🇺', x: 34, y: 30 },
  { code: 'SVO', city: 'Moscow', country: 'Russia', countryCode: 'RU', flag: '🇷🇺', x: 48, y: 22 },
  { code: 'JFK', city: 'New York', country: 'United States', countryCode: 'US', flag: '🇺🇸', x: 22, y: 34 },
  { code: 'LAX', city: 'Los Angeles', country: 'United States', countryCode: 'US', flag: '🇺🇸', x: 22, y: 34 },
  { code: 'ORD', city: 'Chicago', country: 'United States', countryCode: 'US', flag: '🇺🇸', x: 22, y: 34 },
  { code: 'ATL', city: 'Atlanta', country: 'United States', countryCode: 'US', flag: '🇺🇸', x: 22, y: 34 },
  { code: 'DFW', city: 'Dallas', country: 'United States', countryCode: 'US', flag: '🇺🇸', x: 22, y: 34 },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', x: 18, y: 22 },
  { code: 'YVR', city: 'Vancouver', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', x: 18, y: 22 },
  { code: 'YUL', city: 'Montreal', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', x: 18, y: 22 },
  { code: 'MEX', city: 'Mexico City', country: 'Mexico', countryCode: 'MX', flag: '🇲🇽', x: 16, y: 40 },
  { code: 'GRU', city: 'São Paulo', country: 'Brazil', countryCode: 'BR', flag: '🇧🇷', x: 28, y: 56 },
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', flag: '🇦🇷', x: 26, y: 62 },
  { code: 'SCL', city: 'Santiago', country: 'Chile', countryCode: 'CL', flag: '🇨🇱', x: 22, y: 64 },
  { code: 'SYD', city: 'Sydney', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', x: 84, y: 58 },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', x: 84, y: 58 },
  { code: 'AKL', city: 'Auckland', country: 'New Zealand', countryCode: 'NZ', flag: '🇳🇿', x: 92, y: 62 },
];

export function groupAirportsByCountry(airports) {
  const groups = new Map();

  for (const airport of airports) {
    const key = airport.countryCode;
    if (!groups.has(key)) {
      groups.set(key, {
        country: airport.country,
        countryCode: airport.countryCode,
        flag: airport.flag,
        airports: [],
      });
    }
    groups.get(key).airports.push(airport);
  }

  return [...groups.values()];
}
