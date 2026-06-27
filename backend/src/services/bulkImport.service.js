import fs from 'fs';
import Customer from '../models/Customer.js';
import { createBooking } from './booking.service.js';
import { extractTicketFromFile } from './ticketExtract.service.js';
import { getCurrencyRatesMap } from './currency.service.js';
import ApiError from '../utils/ApiError.js';

export const BULK_CSV_HEADERS = [
  'customerPhone',
  'airline',
  'route',
  'departureDate',
  'pnr',
  'ticketNumber',
  'passengerCount',
  'purchasePriceBDT',
  'salePriceBDT',
  'notes',
];

function parseCsvLine(line) {
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

export function parseCsv(text) {
  const lines = String(text).trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line, index) => {
    const cols = parseCsvLine(line);
    const row = { _row: index + 2 };
    headers.forEach((h, i) => {
      row[h] = (cols[i] || '').replace(/^"|"$/g, '').trim();
    });
    return row;
  });
}

function parseRoute(route) {
  const trimmed = String(route || '').trim();
  const match = trimmed.match(/^(.+?)\s*(?:→|->|—|-)\s*(.+)$/);
  if (match) {
    return { fromDestination: match[1].trim(), toDestination: match[2].trim() };
  }
  const codes = trimmed.match(/^([A-Z]{3})\s*-\s*([A-Z]{3})$/i);
  if (codes) {
    return { fromDestination: codes[1].toUpperCase(), toDestination: codes[2].toUpperCase() };
  }
  return { fromDestination: trimmed, toDestination: trimmed };
}

async function findCustomerByPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const tail = digits.slice(-10);
  return Customer.findOne({ phone: new RegExp(tail) }).lean();
}

function pick(row, ...keys) {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

export async function previewCsvImport(buffer) {
  const parsed = parseCsv(buffer.toString('utf8'));
  if (!parsed.length) throw ApiError.badRequest('CSV is empty or has no data rows');

  const rates = await getCurrencyRatesMap();
  const bdtRate = rates.BRL || 22.5;

  const rows = [];
  for (const row of parsed) {
    const errors = [];
    const phone = pick(row, 'customerphone', 'phone', 'customer_phone');
    const airline = pick(row, 'airline', 'carrier');
    const route = pick(row, 'route', 'sector');
    const departureDate = pick(row, 'departuredate', 'departure_date', 'flightdate');
    const pnr = pick(row, 'pnr');
    const ticketNumber = pick(row, 'ticketnumber', 'ticket_number', 'ticketno');
    const notes = pick(row, 'notes', 'note');

    if (!phone) errors.push('customerPhone required');
    if (!airline) errors.push('airline required');
    if (!route) errors.push('route required');
    if (!departureDate) errors.push('departureDate required');

    let customer = null;
    if (phone) {
      customer = await findCustomerByPhone(phone);
      if (!customer) errors.push('Customer not found — add customer first');
    }

    const purchaseBdt = Number(pick(row, 'purchasepricebdt', 'purchaseprice', 'purchase_bdt')) || 0;
    const saleBdt = Number(pick(row, 'salepricebdt', 'saleprice', 'sale_bdt')) || purchaseBdt;
    const passengerCount = Number(pick(row, 'passengercount', 'passengers', 'pax')) || 1;
    const { fromDestination, toDestination } = parseRoute(route);

    rows.push({
      row: row._row,
      valid: errors.length === 0,
      errors,
      customerId: customer?._id?.toString() || '',
      customerName: customer?.name || '',
      customerPhone: phone,
      airline,
      route,
      sector: `${fromDestination}-${toDestination}`,
      fromDestination,
      toDestination,
      departureDate,
      pnr,
      ticketNumber,
      passengerCount: passengerCount > 0 ? passengerCount : 1,
      purchasePriceBDT: purchaseBdt,
      salePriceBDT: saleBdt,
      purchasePriceBRL: bdtRate > 0 ? Number((purchaseBdt / bdtRate).toFixed(2)) : 0,
      salePriceBRL: bdtRate > 0 ? Number((saleBdt / bdtRate).toFixed(2)) : 0,
      bdtRate,
      notes,
    });
  }

  return {
    rows,
    total: rows.length,
    valid: rows.filter((r) => r.valid).length,
    invalid: rows.filter((r) => !r.valid).length,
  };
}

export async function executeBulkImport(rows, userId, req) {
  if (!rows?.length) throw ApiError.badRequest('No rows to import');
  if (rows.length > 100) throw ApiError.badRequest('Maximum 100 bookings per import');

  const results = [];
  for (const row of rows) {
    try {
      let customerId = row.customerId;
      if (!customerId && row.customerPhone) {
        const customer = await findCustomerByPhone(row.customerPhone);
        if (!customer) throw new Error('Customer not found — add customer first');
        customerId = customer._id.toString();
      }
      if (!customerId) throw new Error('Missing customer');
      const booking = await createBooking({
        customerId: customerId,
        airline: row.airline,
        route: row.route,
        sector: row.sector,
        fromDestination: row.fromDestination,
        toDestination: row.toDestination,
        departureDate: row.departureDate,
        pnr: row.pnr || undefined,
        ticketNumber: row.ticketNumber || undefined,
        passengerCount: row.passengerCount || 1,
        passengers: row.passengers,
        purchasePriceBRL: row.purchasePriceBRL ?? 0,
        salePriceBRL: row.salePriceBRL ?? 0,
        bdtRate: row.bdtRate,
        status: row.status || 'confirmed',
        notes: row.notes ? `Bulk import: ${row.notes}` : 'Bulk import',
      }, userId, req);
      results.push({
        ok: true,
        row: row.row,
        bookingNumber: booking.bookingNumber,
        id: booking.id,
      });
    } catch (err) {
      results.push({
        ok: false,
        row: row.row,
        fileName: row.fileName,
        error: err.message || 'Import failed',
      });
    }
  }

  return {
    created: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

export async function bulkExtractTickets(files) {
  if (!files?.length) throw ApiError.badRequest('No ticket files uploaded');
  if (files.length > 25) throw ApiError.badRequest('Maximum 25 PDFs per batch');

  const rates = await getCurrencyRatesMap();
  const bdtRate = rates.BRL || 22.5;
  const items = [];

  for (const file of files) {
    try {
      const extracted = await extractTicketFromFile(file.path, file.mimetype);
      const bdt = Number(extracted.grandTotalBdt || extracted.purchasePriceBdt) || 0;
      const brl = bdtRate > 0 ? Number((bdt / bdtRate).toFixed(2)) : 0;
      const route = extracted.route || '';
      const { fromDestination, toDestination } = parseRoute(route);

      items.push({
        fileName: file.originalname,
        valid: extracted.confidence >= 1,
        confidence: extracted.confidence,
        errors: extracted.confidence >= 1 ? [] : ['Low confidence — review manually'],
        row: {
          airline: extracted.airline || '',
          route,
          sector: extracted.sector || `${fromDestination}-${toDestination}`,
          fromDestination: extracted.fromDestination || fromDestination,
          toDestination: extracted.toDestination || toDestination,
          departureDate: extracted.departureDate || '',
          pnr: extracted.pnr || '',
          ticketNumber: extracted.ticketNumber || '',
          passengerCount: extracted.passengerCount || 1,
          passengers: extracted.passengers || [],
          purchasePriceBDT: bdt,
          salePriceBDT: bdt,
          purchasePriceBRL: brl,
          salePriceBRL: brl,
          bdtRate,
          notes: `Imported from ${file.originalname}`,
          flightSegment: extracted.flightSegment,
        },
      });
    } catch (err) {
      items.push({
        fileName: file.originalname,
        valid: false,
        errors: [err.message || 'OCR failed'],
        row: null,
      });
    } finally {
      if (file?.path) fs.unlink(file.path, () => {});
    }
  }

  return { items, total: items.length, valid: items.filter((i) => i.valid).length };
}

export function csvTemplateContent() {
  const sample = [
    BULK_CSV_HEADERS.join(','),
    '01712345678,Biman Bangladesh Airlines,ZYL - DAC,2026-06-17,ANGMMK,9979412438630,2,10529,11000,BD FLY batch',
  ].join('\n');
  return sample;
}

export default {
  parseCsv,
  previewCsvImport,
  executeBulkImport,
  bulkExtractTickets,
  csvTemplateContent,
  BULK_CSV_HEADERS,
};
