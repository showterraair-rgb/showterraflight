import fs from 'fs';

function extractPrintableText(buffer) {
  const raw = buffer.toString('latin1');
  const chunks = raw.match(/\(([^()\\]{2,200})\)/g) || [];
  const fromStreams = chunks.map((c) => c.slice(1, -1)).join(' ');
  const ascii = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  return `${fromStreams} ${ascii}`.replace(/\s+/g, ' ').trim();
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) return (m[1] || m[0]).trim();
  }
  return '';
}

function extractPassengers(text) {
  const passengers = [];
  const namePatterns = [
    /(?:MR|MRS|MS|MSTR)\s+([A-Z][A-Z\s]{4,60})/g,
    /Passenger\s*Name[:\s]+([A-Z][A-Z\s]{4,60})/gi,
  ];
  for (const pattern of namePatterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const name = m[1].trim().replace(/\s+/g, ' ');
      if (name.length > 4 && !passengers.some((p) => p.fullName === name)) {
        passengers.push({ title: 'MR', fullName: name, passengerType: 'ADULT' });
      }
    }
  }
  return passengers.slice(0, 10);
}

function extractTicketNumbers(text) {
  const nums = new Set();
  const patterns = [
    /E-?Ticket\s*(?:No|Number)?[:\s]*([0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{3,4})/gi,
    /(\d{3}\s\d{3}\s\d{3,4})/g,
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      nums.add(m[1].replace(/\s+/g, ' ').trim());
    }
  }
  return [...nums].slice(0, 10);
}

export function parseTicketText(text) {
  const upper = text.toUpperCase();

  const pnr = firstMatch(upper, [
    /AIRLINE\s*PNR[:\s]+([A-Z0-9]{5,8})/,
    /PNR[:\s]+([A-Z0-9]{5,8})/,
    /\b([A-Z]{6})\b/,
  ]);

  const airline = firstMatch(text, [
    /(?:Airline|Carrier)[:\s]+([A-Za-z0-9\s&.-]{2,40})/i,
    /(Biman\s*Bangladesh|Emirates|Qatar\s*Airways|US-Bangla|Novoair)/i,
  ]);

  const flightNumber = firstMatch(upper, [
    /\b(BG|EK|QR|BS|VQ|AI|SV|WY|GF|TK|EY)[\s-]?(\d{2,4})\b/,
  ]);

  const routeMatch = text.match(/([A-Z]{3})\s*(?:-|–|→|—|TO)\s*([A-Z]{3})/i)
    || text.match(/\b([A-Z]{3})\s*-\s*([A-Z]{3})\b/);

  const dateMatch = text.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
    || text.match(/(\d{4}-\d{2}-\d{2})/);

  const passengers = extractPassengers(upper);
  const ticketNumbers = extractTicketNumbers(text);
  const ticketNumber = ticketNumbers[0] || '';

  if (passengers.length && ticketNumbers.length) {
    passengers.forEach((p, i) => {
      if (ticketNumbers[i]) p.eTicketNumber = ticketNumbers[i];
    });
  }

  let departureDate = '';
  if (dateMatch) {
    const parsed = new Date(dateMatch[1]);
    if (!Number.isNaN(parsed.getTime())) {
      departureDate = parsed.toISOString().slice(0, 10);
    }
  }

  const fromCode = routeMatch?.[1]?.toUpperCase() || '';
  const toCode = routeMatch?.[2]?.toUpperCase() || '';

  return {
    pnr: pnr || '',
    airlinePnr: pnr || '',
    airline: airline || (flightNumber ? flightNumber.split(/[\s-]/)[0] : ''),
    flightNumber: flightNumber || '',
    route: fromCode && toCode ? `${fromCode} - ${toCode}` : '',
    fromDestination: fromCode,
    toDestination: toCode,
    departureDate,
    ticketNumber,
    passengers,
    passengerCount: Math.max(1, passengers.length),
    confidence: [pnr, airline || flightNumber, departureDate].filter(Boolean).length,
    rawTextPreview: text.slice(0, 500),
  };
}

export async function extractTicketFromFile(filePath, mimeType) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Ticket file not found');
  }

  const buffer = fs.readFileSync(filePath);
  let text = '';

  if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    text = extractPrintableText(buffer);
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
    note: parsed.confidence >= 2
      ? 'Auto-extracted from ticket — please verify all fields'
      : 'Partial extraction — please review and complete manually',
  };
}

export default { extractTicketFromFile, parseTicketText };
