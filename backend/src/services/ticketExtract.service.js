import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

function extractPrintableText(buffer) {
  const raw = buffer.toString('latin1');
  const chunks = raw.match(/\(([^()\\]{2,200})\)/g) || [];
  const fromStreams = chunks.map((c) => c.slice(1, -1)).join(' ');
  const ascii = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  return `${fromStreams} ${ascii}`.replace(/\s+/g, ' ').trim();
}

async function extractPdfText(buffer) {
  try {
    const result = await pdfParse(buffer);
    if (result.text?.trim().length > 80) return result.text;
  } catch {
    // fall through to legacy extractor
  }
  return extractPrintableText(buffer);
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) return (m[1] || m[0]).trim();
  }
  return '';
}

function parseMoneyBdt(text) {
  const fareSection = text.split(/Fare\s*Summary/i)[1] || text;
  const afterGrand = fareSection.split(/Grand\s*Total/i)[1] || fareSection;
  const matches = [...afterGrand.matchAll(/([\d,]+\.?\d*)\s*BDT/gi)];
  if (matches.length) {
    const amounts = matches.map((m) => Number(String(m[1]).replace(/,/g, ''))).filter((n) => n > 0);
    if (amounts.length) return Math.max(...amounts);
  }
  const fallback = text.match(/([\d,]+\.?\d*)\s*BDT/i);
  return fallback ? Number(String(fallback[1]).replace(/,/g, '')) || 0 : 0;
}

function itinerarySection(text) {
  const parts = text.split(/Flight\s*Itinerary/i);
  return parts.length > 1 ? parts[1] : text;
}

function toDateInputValue(dateStr) {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDepartureDate(text, preferItinerary = true) {
  const source = preferItinerary ? itinerarySection(text) : text;

  const routeAnchor = source.match(/([A-Z]{3})\s*-\s*([A-Z]{3})/i);
  if (routeAnchor) {
    const afterRoute = source.slice(source.indexOf(routeAnchor[0]) + routeAnchor[0].length);
    const flightDate = afterRoute.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
    if (flightDate) return toDateInputValue(flightDate[1]);
  }

  const dateMatch = source.match(/(?:Wed|Mon|Tue|Thu|Fri|Sat|Sun)\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
    || source.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
    || text.match(/(\d{4}-\d{2}-\d{2})/);

  if (!dateMatch) return '';
  return dateMatch[1].includes('-') ? dateMatch[1] : toDateInputValue(dateMatch[1]);
}

function extractPassengers(text) {
  const passengers = [];
  const upper = text.toUpperCase();

  // BD FLY / e-ticket table: "MR NAMEADULT" then ticket number on next line
  const bdflyPattern = /(MR|MRS|MS|MSTR)\s+([A-Z][A-Z\s]{2,50}?)(ADULT|CHILD|INFANT)\s*[\r\n]+\s*(\d{10,14})/gi;
  let m;
  while ((m = bdflyPattern.exec(text)) !== null) {
    const fullName = m[2].trim().replace(/\s+/g, ' ');
    if (!passengers.some((p) => p.fullName === fullName)) {
      passengers.push({
        title: m[1],
        fullName,
        passengerType: m[3],
        eTicketNumber: m[4],
      });
    }
  }

  if (passengers.length) return passengers.slice(0, 10);

  const namePatterns = [
    /(?:MR|MRS|MS|MSTR)\s+([A-Z][A-Z\s]{4,60})/g,
    /Passenger\s*Name[:\s]+([A-Z][A-Z\s]{4,60})/gi,
  ];
  for (const pattern of namePatterns) {
    while ((m = pattern.exec(upper)) !== null) {
      const name = m[1].trim().replace(/\s+/g, ' ');
      if (name.length > 4 && !passengers.some((p) => p.fullName === name)) {
        passengers.push({ title: 'MR', fullName: name, passengerType: 'ADULT' });
      }
    }
  }

  const ticketNumbers = [...text.matchAll(/\b(\d{13})\b/g)].map((x) => x[1]);
  if (passengers.length && ticketNumbers.length) {
    passengers.forEach((p, i) => {
      if (ticketNumbers[i]) p.eTicketNumber = ticketNumbers[i];
    });
  }

  return passengers.slice(0, 10);
}

function extractTicketNumbers(text) {
  const nums = new Set();
  const patterns = [
    /\b(\d{13})\b/g,
    /E-?Ticket\s*(?:No|Number)?[:\s]*([0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{3,4})/gi,
    /(\d{3}\s\d{3}\s\d{3,4})/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      nums.add(String(match[1]).replace(/\s+/g, ' ').trim());
    }
  }
  return [...nums].slice(0, 10);
}

export function parseTicketText(text) {
  const normalized = text.replace(/\u00a0/g, ' ');
  const upper = normalized.toUpperCase();

  const pnr = firstMatch(normalized, [
    /Airline\s*PNR\s*:\s*([A-Z0-9]{5,8})/i,
    /AIRLINE\s*PNR[:\s]+([A-Z0-9]{5,8})/i,
    /PNR[:\s]+([A-Z0-9]{5,8})/i,
  ]);

  const bookingId = firstMatch(normalized, [
    /BookingId:\s*(\S+)/i,
    /Booking\s*ID[:\s]+(\S+)/i,
  ]);

  const airline = firstMatch(normalized, [
    /(Biman\s*Bangladesh\s*Airlines)/i,
    /(US[-\s]?Bangla\s*Airlines)/i,
    /(Novoair)/i,
    /(Emirates)/i,
    /(Qatar\s*Airways)/i,
    /(?:Airline|Carrier)[:\s]+([A-Za-z0-9\s&.-]{2,40})/i,
  ]);

  const flightNumber = firstMatch(upper, [
    /\b(BG\s*-\s*\d{2,4})\b/,
    /\b(BG|EK|QR|BS|VQ|AI|SV|WY|GF|TK|EY)[\s-]?(\d{2,4})\b/,
  ]).replace(/\s+/g, ' ');

  const itinerary = itinerarySection(normalized);

  const routeMatch = itinerary.match(/([A-Z]{3})\s*-\s*([A-Z]{3})/i)
    || normalized.match(/\(([A-Z]{3})\)[\s\S]{0,80}\(([A-Z]{3})\)/i);

  const passengers = extractPassengers(normalized);
  const ticketNumbers = extractTicketNumbers(normalized);
  const ticketNumber = ticketNumbers[0] || passengers[0]?.eTicketNumber || '';

  const departureDate = parseDepartureDate(normalized, true);

  const fromCode = routeMatch?.[1]?.toUpperCase() || '';
  const toCode = routeMatch?.[2]?.toUpperCase() || '';

  const grandTotalBdt = parseMoneyBdt(normalized);
  const travelClass = /Economy/i.test(itinerary) ? 'economy'
    : /Business/i.test(itinerary) ? 'business'
      : /First/i.test(itinerary) ? 'first' : 'economy';

  const stops = /Non\s*Stop/i.test(itinerary) ? 'Non Stop' : '';

  const timeMatches = [...itinerary.matchAll(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^,\n]+,\s*(\d{1,2}:\d{2})/gi)];
  const depTime = timeMatches[0]?.[1] || itinerary.match(/(\d{1,2}:\d{2})/)?.[1] || '';
  const arrTime = timeMatches[1]?.[1] || '';
  const duration = firstMatch(itinerary, [/(\d+h\s*\d+m)/i, /(\d+h\s*\d+m)/i]);
  const distance = firstMatch(itinerary, [/(\d+\s*km)/i]);

  const fromAirportName = firstMatch(itinerary, [
    /Osmany[^\n]+Airport/i,
    /([A-Za-z\s]+International Airport)/i,
  ]);
  const toAirportName = (() => {
    const airports = [...itinerary.matchAll(/([A-Za-z\s]+International Airport)/gi)];
    return airports.length > 1 ? airports[1][1].trim() : airports[0]?.[1]?.trim() || '';
  })();

  const aircraft = firstMatch(itinerary, [/Boeing\s+\d+/i, /Airbus\s+\w+/i]);

  return {
    pnr: pnr || '',
    airlinePnr: pnr || '',
    bookingId: bookingId || '',
    airline: airline || (flightNumber ? flightNumber.split(/[\s-]/)[0] : ''),
    flightNumber: flightNumber || '',
    route: fromCode && toCode ? `${fromCode} - ${toCode}` : '',
    sector: fromCode && toCode ? `${fromCode}-${toCode}` : '',
    fromDestination: fromCode,
    toDestination: toCode,
    departureDate,
    ticketNumber,
    passengers,
    passengerCount: Math.max(1, passengers.length || 1),
    grandTotalBdt,
    purchasePriceBdt: grandTotalBdt,
    salePriceBdt: grandTotalBdt,
    travelClass,
    flightSegment: {
      airlinePnr: pnr || '',
      flightNumber: flightNumber || '',
      aircraft: aircraft || '',
      departureTime: depTime,
      arrivalTime: arrTime,
      fromAirportName: fromAirportName || '',
      toAirportName: toAirportName || '',
      duration: duration || '',
      distance: distance || '',
      stops,
    },
    fareBreakdown: {
      grandTotal: grandTotalBdt,
    },
    confidence: [pnr, airline || flightNumber, departureDate, grandTotalBdt > 0].filter(Boolean).length,
    rawTextPreview: normalized.slice(0, 800),
  };
}

export async function extractTicketFromFile(filePath, mimeType) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Ticket file not found');
  }

  const buffer = fs.readFileSync(filePath);
  let text = '';

  if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    text = await extractPdfText(buffer);
  } else if (String(mimeType || '').startsWith('image/')) {
    return {
      ...parseTicketText(''),
      note: 'Image OCR requires manual entry or PDF ticket. Fields remain editable.',
      confidence: 0,
    };
  } else {
    text = buffer.toString('utf8');
  }

  const parsed = parseTicketText(text);
  return {
    ...parsed,
    note: parsed.confidence >= 3
      ? 'Auto-extracted from ticket — please verify all fields'
      : parsed.confidence >= 1
        ? 'Partial extraction — please review and complete manually'
        : 'Could not read ticket text — enter details manually',
  };
}

export default { extractTicketFromFile, parseTicketText };
