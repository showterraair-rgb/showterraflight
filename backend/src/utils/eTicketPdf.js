import dayjs from 'dayjs';

const MARGIN = 40;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;

const REMINDERS = `Reminders:
Flight Status: Before your flight, please check your update flight status by inputting airline PNR on the airline website or by calling the airline's customer support.
Government ID: Please carry a government issued photo ID card with your e-ticket for verification during check-in.
Online Check-in: Airline website usually have online check-in available which can be availed in requirement.
Baggage Drop: Please ensure you arrive at the Check-in Bag Drop counter before it closes for document verification and to check in your baggage.
Emergency Exit: Passengers occupying seats in the emergency exit row are required to adhere to safety regulations and fulfill necessary requirements.

Important Information:
This electronic ticket receipt / itinerary serves as your documentation for your electronic ticket and is an integral part of your contract of carriage. Your electronic ticket is securely stored in the airline's computer reservation system. You may be required to present this receipt when entering the airport or to demonstrate return or onward travel to customs and immigration officials.
We advise you to complete the check-in process 2-3 hours before your flight's departure time. Boarding typically commences at least 35 minutes prior to the scheduled departure, with gates closing 15 minutes before departure.`;

function pdfText(doc, text, x, y, opts = {}) {
  doc.text(String(text ?? ''), x, y, { lineBreak: false, ...opts });
}

function travelClassLabel(cls) {
  const map = {
    economy: 'Economy Class',
    premium_economy: 'Premium Economy',
    business: 'Business Class',
    first: 'First Class',
  };
  return map[cls] || 'Economy Class';
}

function statusUpper(status) {
  const map = {
    ticket_issued: 'TICKETED',
    confirmed: 'CONFIRMED',
    delivered: 'DELIVERED',
    completed: 'COMPLETED',
    draft: 'DRAFT',
    cancelled: 'CANCELLED',
  };
  return map[status] || String(status || 'CONFIRMED').toUpperCase().replace(/_/g, ' ');
}

function buildPassengerRows(booking) {
  if (booking.passengers?.length) {
    return booking.passengers.map((p) => ({
      name: `${p.title || 'MR'} ${p.fullName}`.trim(),
      type: p.passengerType || 'ADULT',
      eTicket: p.eTicketNumber || '—',
      checkIn: p.checkInBaggage || '20kg',
      cabin: p.cabinBaggage || '7Kg',
    }));
  }
  const count = booking.passengerCount || 1;
  const name = booking.customerName || 'Passenger';
  const ticket = booking.ticketNumber || '—';
  return Array.from({ length: count }, (_, i) => ({
    name: count === 1 ? `MR ${name}` : `MR ${name} (${i + 1})`,
    type: 'ADULT',
    eTicket: ticket,
    checkIn: '20kg',
    cabin: '7Kg',
  }));
}

function deriveFare(booking) {
  const fb = booking.fareBreakdown || {};
  const pax = booking.passengerCount || 1;
  const grand = fb.grandTotal ?? booking.salePrice ?? 0;
  let base = fb.baseFare;
  let taxes = fb.taxes;
  if (base == null && taxes == null && grand > 0) {
    taxes = Math.round(grand * 0.12 * 100) / 100;
    base = Math.round((grand - taxes) / pax * 100) / 100;
  }
  const perPax = base != null ? base : 0;
  const perTax = taxes != null ? taxes : 0;
  const totalFare = fb.totalFare ?? (perPax + perTax) * pax;
  return {
    baseFare: perPax,
    taxes: perTax,
    pax,
    totalFare: totalFare || grand,
    aitVat: fb.aitVat ?? 0,
    extraBaggage: fb.extraBaggage ?? 0,
    bundleCost: fb.bundleCost ?? 0,
    grandTotal: grand,
  };
}

export function drawETicketDocument(doc, booking, company) {
  const left = MARGIN;
  let y = 40;

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000');
  pdfText(doc, company.name, left, y, { width: CONTENT_W });
  y += 16;

  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  if (company.address) {
    pdfText(doc, company.address, left, y, { width: CONTENT_W });
    y += 20;
  }
  if (company.iataNumber) {
    pdfText(doc, `IATA No: ${company.iataNumber}`, left, y);
    y += 12;
  }
  if (company.emergencyContact) {
    pdfText(doc, `Emergency Contact`, left, y);
    y += 10;
    pdfText(doc, company.emergencyContact, left, y);
    y += 14;
  }

  doc.moveTo(left, y).lineTo(left + CONTENT_W, y).dash(2, { space: 2 }).strokeColor('#94a3b8').stroke().undash();
  y += 16;

  doc.font('Helvetica-Bold').fontSize(9);
  pdfText(doc, 'Passenger Information', left, y);
  const fs = booking.flightSegment || {};
  const airlinePnr = fs.airlinePnr || booking.pnr || '—';
  pdfText(doc, `Airline PNR : ${airlinePnr}`, left + CONTENT_W - 180, y, { width: 180, align: 'right' });
  y += 14;

  pdfText(doc, `BookingId: ${booking.bookingNumber}`, left, y);
  y += 12;
  doc.font('Helvetica-Bold').fontSize(10);
  pdfText(doc, statusUpper(booking.status), left, y);
  pdfText(doc, dayjs(booking.createdAt || new Date()).format('DD MMM YYYY HH:mm'), left + 120, y);
  y += 18;

  const cols = [
    { label: 'Name', w: 0.32 },
    { label: 'Type', w: 0.12 },
    { label: 'E-Ticket No', w: 0.22 },
    { label: 'Check-in Baggage', w: 0.17 },
    { label: 'Cabin Baggage', w: 0.17 },
  ];
  doc.font('Helvetica-Bold').fontSize(7.5);
  let cx = left;
  for (const col of cols) {
    pdfText(doc, col.label, cx, y, { width: CONTENT_W * col.w - 4 });
    cx += CONTENT_W * col.w;
  }
  y += 12;
  doc.moveTo(left, y).lineTo(left + CONTENT_W, y).strokeColor('#cbd5e1').stroke();
  y += 8;

  doc.font('Helvetica').fontSize(8);
  for (const row of buildPassengerRows(booking)) {
    cx = left;
    const vals = [row.name, row.type, row.eTicket, row.checkIn, row.cabin];
    cols.forEach((col, i) => {
      pdfText(doc, vals[i], cx, y, { width: CONTENT_W * col.w - 4 });
      cx += CONTENT_W * col.w;
    });
    y += 14;
  }
  y += 10;

  doc.font('Helvetica-Bold').fontSize(9);
  pdfText(doc, 'Flight Itinerary', left, y);
  y += 14;

  const from = booking.fromDestination || booking.route?.split(/[-→]/)[0]?.trim() || '';
  const to = booking.toDestination || booking.route?.split(/[-→]/)[1]?.trim() || '';
  const depDate = dayjs(booking.departureDate).format('DD MMM YYYY');
  const stops = fs.stops || (booking.journeyType === 'one_way' ? 'Non Stop' : '—');
  doc.font('Helvetica').fontSize(8.5);
  pdfText(doc, `${from} - ${to} | ${depDate} | ${stops} | ${travelClassLabel(booking.travelClass)}`, left, y, { width: CONTENT_W });
  y += 14;

  const flightLine = [booking.airline, fs.flightNumber, fs.aircraft].filter(Boolean).join(' | ');
  if (flightLine) {
    pdfText(doc, flightLine, left, y);
    y += 16;
  }

  const fromCity = from.replace(/\(.*\)/, '').trim() || from;
  const toCity = to.replace(/\(.*\)/, '').trim() || to;
  const depTime = fs.departureTime || dayjs(booking.departureDate).format('HH:mm');
  const arrTime = fs.arrivalTime || '—';
  const fromAirport = fs.fromAirportName || `${fromCity} (${from})`;
  const toAirport = fs.toAirportName || `${toCity} (${to})`;

  pdfText(doc, fromAirport, left, y);
  y += 10;
  pdfText(doc, `${dayjs(booking.departureDate).format('ddd DD MMM YYYY')}, ${depTime}`, left, y);
  y += 14;

  if (fs.duration || fs.distance) {
    doc.font('Helvetica').fontSize(7).fillColor('#64748b');
    pdfText(doc, fs.duration || '', left + CONTENT_W / 2 - 30, y, { width: 60, align: 'center' });
    y += 10;
    doc.moveTo(left + CONTENT_W / 2 - 40, y).lineTo(left + CONTENT_W / 2 + 40, y).stroke();
    y += 8;
    pdfText(doc, fs.distance || '', left + CONTENT_W / 2 - 30, y, { width: 60, align: 'center' });
    y += 12;
    doc.fillColor('#000000').font('Helvetica').fontSize(8.5);
  }

  pdfText(doc, toAirport, left, y);
  y += 10;
  pdfText(doc, `${dayjs(booking.departureDate).format('ddd DD MMM YYYY')}, ${arrTime}`, left, y);
  y += 20;

  doc.font('Helvetica-Bold').fontSize(9);
  pdfText(doc, 'Fare Summary', left, y);
  y += 14;

  const fare = deriveFare(booking);
  const fareCols = ['Passenger Type', 'Base Fare', 'Taxes', 'Total Pax', 'Total Fare'];
  const fareWidths = [0.22, 0.2, 0.18, 0.15, 0.25];
  doc.font('Helvetica-Bold').fontSize(7.5);
  cx = left;
  fareCols.forEach((label, i) => {
    pdfText(doc, label, cx, y, { width: CONTENT_W * fareWidths[i] - 4 });
    cx += CONTENT_W * fareWidths[i];
  });
  y += 12;
  doc.font('Helvetica').fontSize(8);
  cx = left;
  const fareVals = ['ADULT', fare.baseFare.toFixed(2), fare.taxes.toFixed(2), String(fare.pax), fare.totalFare.toFixed(2)];
  fareVals.forEach((val, i) => {
    pdfText(doc, val, cx, y, { width: CONTENT_W * fareWidths[i] - 4 });
    cx += CONTENT_W * fareWidths[i];
  });
  y += 18;

  const extras = [
    ['AIT & VAT', fare.aitVat],
    ['Extra Baggage/ Meal/ Seat', fare.extraBaggage],
    ['Bundle Cost', fare.bundleCost],
    ['Grand Total', fare.grandTotal],
  ];
  extras.forEach(([label, amount]) => {
    pdfText(doc, label, left + CONTENT_W * 0.55, y, { width: CONTENT_W * 0.25 });
    pdfText(doc, `${Number(amount).toFixed(2)} BDT`, left + CONTENT_W * 0.8, y, { width: CONTENT_W * 0.2, align: 'right' });
    y += 12;
  });
  y += 10;

  doc.font('Helvetica').fontSize(6.5).fillColor('#334155');
  const reminderLines = REMINDERS.split('\n');
  for (const line of reminderLines) {
    if (y > 780) break;
    pdfText(doc, line, left, y, { width: CONTENT_W, lineGap: 1 });
    y += line.length > 90 ? 16 : 9;
  }

  doc.font('Helvetica').fontSize(7).fillColor('#64748b');
  pdfText(doc, '— 1 of 1 —', left, doc.page.height - 30, { width: CONTENT_W, align: 'center' });
}

export async function buildETicketPdfBuffer(booking, company) {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  drawETicketDocument(doc, booking, company);
  doc.end();
  return done;
}

export default { drawETicketDocument, buildETicketPdfBuffer };
