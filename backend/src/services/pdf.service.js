import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import env from '../config/env.js';
import Agent from '../models/Agent.js';
import { getBookingById } from './booking.service.js';
import { getAgentBookingById } from './agentBooking.service.js';
import { getAgentReportSummary, getAgentMonthlyReport } from './agentReport.service.js';
import { runReport } from './report.service.js';
import { getCurrencyRatesMap } from './currency.service.js';
import {
  getPdfCompanyInfo,
  createPdfDoc,
  bufferFromDoc,
  bufferFromSimpleDoc,
  fmtDate,
  fmtMoneyBRL,
  fmtMoneyBDT,
  humanizeKey,
  isMoneyKey,
  drawHeaderBand,
  drawToc,
  beginSection,
  drawKeyValueGrid,
  drawDataTable,
  drawSummaryCards,
  finalizeFooters,
  createSimplePdfDoc,
  drawSimpleHeader,
  drawSimpleSection,
  drawSimpleMoneyTable,
  drawSimpleFooter,
  drawSimpleLine,
  drawSimpleLink,
} from '../utils/pdfLayout.js';
import { buildETicketPdfBuffer } from '../utils/eTicketPdf.js';

function buildPublicUploadUrl(relativePath) {
  if (!relativePath) return '';
  const path = relativePath.startsWith('/uploads/')
    ? relativePath
    : `/uploads/${String(relativePath).replace(/^uploads\//, '')}`;
  return `${env.apiPublicUrl}${path}`;
}

function createDoc(layout = 'portrait') {
  return createPdfDoc({ PDFDocument, docOptions: { layout } });
}

function statusLabel(status) {
  return String(status || '').replace(/_/g, ' ');
}

function buildReportFilterLines(query) {
  const lines = [];
  if (query.from || query.dateFrom) lines.push(`From: ${query.from || query.dateFrom}`);
  if (query.to || query.dateTo) lines.push(`To: ${query.to || query.dateTo}`);
  if (query.status) lines.push(`Status: ${query.status}`);
  if (query.year) lines.push(`Year: ${query.year}`);
  return lines;
}

export async function generateBookingInvoicePdf(bookingId) {
  const booking = await getBookingById(bookingId);
  const company = await getPdfCompanyInfo();
  const p = booking.pricing || {};
  const rate = p.bdtRateAtBooking || booking.bdtRateAtBooking || 1;
  const invoiceNo = `${company.invoicePrefix}-${booking.bookingNumber}`;

  const doc = createSimplePdfDoc(PDFDocument);
  doc.font('Helvetica');

  let y = drawSimpleHeader(
    doc,
    company,
    'BOOKING INVOICE',
    `${invoiceNo} · ${booking.bookingNumber} · ${dayjs().format('DD MMM YYYY')} · ${statusLabel(booking.status)}`
  );

  y = drawSimpleSection(doc, y, 'Customer', [
    { label: 'Name', value: booking.customerName },
    { label: 'Phone', value: booking.customerPhone },
    { label: 'Payment', value: statusLabel(booking.paymentStatus) },
  ], 3);

  y = drawSimpleSection(doc, y, 'Travel', [
    { label: 'Route', value: booking.route },
    { label: 'Airline', value: booking.airline },
    { label: 'Departure', value: fmtDate(booking.departureDate) },
    { label: 'Return', value: booking.returnDate ? fmtDate(booking.returnDate) : '-' },
    { label: 'Passengers', value: booking.passengerCount },
    { label: 'PNR', value: booking.pnr || '-' },
    { label: 'Ticket No', value: booking.ticketNumber || '-' },
    { label: 'Class', value: statusLabel(booking.travelClass) },
  ], 2);

  y = drawSimpleMoneyTable(doc, y, [
    { label: 'Sale Price', brl: fmtMoneyBRL(p.salePriceBRL), bdt: fmtMoneyBDT(p.salePriceBDT) },
    {
      label: 'Amount Paid',
      brl: fmtMoneyBRL(rate > 0 ? (booking.amountPaid || 0) / rate : booking.amountPaid),
      bdt: fmtMoneyBDT(booking.amountPaid),
    },
    {
      label: 'Customer Due',
      brl: fmtMoneyBRL(p.customerDueBRL ?? booking.computed?.customerDueBRL),
      bdt: fmtMoneyBDT(p.customerDueBDT ?? booking.computed?.customerDueBDT),
      bold: true,
    },
  ]);

  drawSimpleLine(doc, `Rate at booking: 1 BRL = ${Number(rate).toFixed(2)} BDT`, y);

  if (booking.ticketCopyUrl || booking.ticketCopyPath) {
    const ticketUrl = buildPublicUploadUrl(booking.ticketCopyUrl || booking.ticketCopyPath);
    const ticketLabel = booking.ticketCopyFileName || 'Download original ticket';
    y += 10;
    drawSimpleLink(doc, `Original ticket: ${ticketLabel}`, ticketUrl, y);
  }

  drawSimpleFooter(doc, company);
  const buffer = await bufferFromSimpleDoc(doc);
  return { buffer, filename: `${invoiceNo}.pdf` };
}

export async function generateBookingETicketPdf(bookingId) {
  const booking = await getBookingById(bookingId);
  const company = await getPdfCompanyInfo();
  const buffer = await buildETicketPdfBuffer(booking, company);
  return { buffer, filename: `${booking.bookingNumber}-e-ticket.pdf` };
}

export async function generateReportPdf(reportKey, query) {
  const report = await runReport(reportKey, query);
  if (!report) throw new Error('Report not found');

  const company = await getPdfCompanyInfo();
  const rates = await getCurrencyRatesMap();
  const moneyRate = rates.BRL || 1;
  const rows = report.rows || [];
  const columnKeys = report.columns?.length ? report.columns : Object.keys(rows[0] || {});
  const columns = columnKeys.map((key) => ({ key, label: humanizeKey(key) }));
  const layout = columns.length > 5 ? 'landscape' : 'portrait';

  const doc = createDoc(layout);
  const title = report.title || humanizeKey(reportKey);
  const filterLines = buildReportFilterLines(query);

  drawHeaderBand(doc, {
    company,
    docTitle: title.toUpperCase(),
    docSubtitle: `Report key: ${reportKey}`,
    metaLines: [
      `Generated: ${dayjs().format('DD MMM YYYY HH:mm')}`,
      `Rows: ${rows.length}`,
      ...filterLines.slice(0, 2),
    ],
  });

  if (filterLines.length) {
    drawKeyValueGrid(doc, filterLines.map((line) => {
      const [label, ...rest] = line.split(':');
      return { label: label.trim(), value: rest.join(':').trim() };
    }), 3);
  }

  if (report.totals && typeof report.totals === 'object') {
    const totalCards = Object.entries(report.totals)
      .filter(([, val]) => typeof val === 'number')
      .slice(0, 4)
      .map(([key, val]) => ({
        label: humanizeKey(key),
        value: fmtMoneyBRL(moneyRate > 0 ? val / moneyRate : val),
        subValue: fmtMoneyBDT(val),
      }));
    if (totalCards.length) {
      beginSection(doc, 'Summary Totals', 'sec-totals');
      drawSummaryCards(doc, totalCards);
    }
  }

  beginSection(doc, 'Report Data', 'sec-data');
  drawDataTable(doc, {
    columns,
    rows,
    moneyRate,
    formatCell: (key, raw) => {
      if (raw == null || raw === '') return '—';
      if (typeof raw === 'number' && isMoneyKey(key)) {
        const brl = moneyRate > 0 ? raw / moneyRate : raw;
        return `${fmtMoneyBRL(brl)}\n${fmtMoneyBDT(raw)}`;
      }
      if (raw instanceof Date || (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw))) {
        return fmtDate(raw);
      }
      return String(raw);
    },
  });

  finalizeFooters(doc, company);
  const filename = report.export?.suggestedFilename || `${reportKey}-${dayjs().format('YYYY-MM-DD')}`;
  const buffer = await bufferFromDoc(doc);
  return { buffer, filename: `${filename}.pdf` };
}

export async function generateAgentBookingPdf(bookingId, agentId = null) {
  const booking = await getAgentBookingById(bookingId, agentId);
  const company = await getPdfCompanyInfo();
  const p = booking.pricing || {};
  const rate = p.bdtRateAtBooking || booking.bdtRateAtBooking || 1;
  const count = booking.passengerCount || booking.passengers?.length || 1;
  const passengerNames = (booking.passengers || [])
    .map((passenger) => `${passenger.title || ''} ${passenger.firstName} ${passenger.lastName}`.trim())
    .join(', ') || '—';

  const doc = createSimplePdfDoc(PDFDocument);
  doc.font('Helvetica');

  let y = drawSimpleHeader(
    doc,
    company,
    'AGENT BOOKING',
    `${booking.bookingRef} · ${statusLabel(booking.status)} · ${dayjs().format('DD MMM YYYY')}`
  );

  y = drawSimpleSection(doc, y, 'Agent & Flight', [
    { label: 'Agent', value: `${booking.agentCompany || '—'} (${booking.agentCode || '—'})` },
    { label: 'Route', value: booking.route },
    { label: 'Airline / Flight', value: `${booking.airline} ${booking.flightNumber}` },
    { label: 'Departure', value: `${fmtDate(booking.departureDate)} ${booking.departureTime || ''}`.trim() },
    { label: 'PNR', value: booking.pnr || '—' },
    { label: 'Class', value: statusLabel(booking.travelClass) },
  ], 2);

  y = drawSimpleSection(doc, y, 'Passengers', [
    { label: `Names (${count})`, value: passengerNames },
  ], 1);

  y = drawSimpleMoneyTable(doc, y, [
    {
      label: 'Total Fare',
      brl: fmtMoneyBRL(p.totalFareBRL ?? booking.totalFareBRL),
      bdt: fmtMoneyBDT(p.totalFareBDT ?? booking.totalFareBDT),
      bold: true,
    },
  ]);

  drawSimpleLine(doc, `Rate at booking: 1 BRL = ${Number(rate).toFixed(2)} BDT`, y);
  drawSimpleFooter(doc, company);
  const buffer = await bufferFromSimpleDoc(doc);
  return { buffer, filename: `${booking.bookingRef}-confirmation.pdf` };
}

export async function generateAgentReportPdf(agentId, query = {}) {
  const [summary, monthly, agentDoc] = await Promise.all([
    getAgentReportSummary(agentId, query),
    getAgentMonthlyReport(agentId, { year: query.year || new Date().getFullYear() }),
    Agent.findById(agentId).select('companyName agentId contactPerson email').lean(),
  ]);

  const company = await getPdfCompanyInfo();
  const doc = createDoc();
  const filterLines = buildReportFilterLines(query);
  const agentLabel = agentDoc?.companyName || agentDoc?.agentId || 'Agent Report';

  drawHeaderBand(doc, {
    company,
    docTitle: 'AGENT PERFORMANCE REPORT',
    docSubtitle: agentLabel,
    metaLines: [
      `Generated: ${dayjs().format('DD MMM YYYY HH:mm')}`,
      `Rate ref: 1 BRL = ${Number(summary.currentBdtRate || 0).toFixed(2)} BDT`,
      ...filterLines.slice(0, 1),
    ],
  });

  drawToc(doc, [
    { label: 'Executive Summary', dest: 'sec-summary' },
    { label: 'Revenue by Airline', dest: 'sec-airline' },
    { label: 'Top Routes', dest: 'sec-routes' },
    { label: 'Monthly Breakdown', dest: 'sec-monthly' },
  ]);

  beginSection(doc, 'Executive Summary', 'sec-summary');
  drawSummaryCards(doc, [
    { label: 'Total Bookings', value: String(summary.totalBookings || 0) },
    {
      label: 'Total Revenue (BRL)',
      value: fmtMoneyBRL(summary.totalRevenueBRL),
      subValue: fmtMoneyBDT(summary.totalRevenueBDT ?? summary.totalRevenue),
    },
    { label: 'Confirmed', value: String(summary.confirmed || 0) },
    { label: 'Pending', value: String(summary.pending || 0) },
  ]);

  drawKeyValueGrid(doc, [
    { label: 'Cancelled', value: String(summary.cancelled || 0) },
    { label: 'Current BDT Rate', value: `1 BRL = ${Number(summary.currentBdtRate || 0).toFixed(2)} BDT` },
    ...(filterLines.length ? filterLines.map((line) => {
      const [label, ...rest] = line.split(':');
      return { label: label.trim(), value: rest.join(':').trim() };
    }) : []),
  ], 2);

  beginSection(doc, 'Revenue by Airline', 'sec-airline');
  drawDataTable(doc, {
    columns: [
      { key: 'airline', label: 'Airline' },
      { key: 'count', label: 'Bookings' },
      { key: 'revenueBRL', label: 'Revenue (BRL)' },
      { key: 'revenueBDT', label: 'Revenue (BDT)' },
    ],
    rows: (summary.byAirline || []).map((row) => ({
      airline: row.airline,
      count: row.count,
      revenueBRL: fmtMoneyBRL(row.revenueBRL),
      revenueBDT: fmtMoneyBDT(row.revenueBDT ?? row.revenue),
    })),
  });

  beginSection(doc, 'Top Routes', 'sec-routes');
  drawDataTable(doc, {
    columns: [
      { key: 'route', label: 'Route' },
      { key: 'count', label: 'Bookings' },
      { key: 'revenueBRL', label: 'Revenue (BRL)' },
      { key: 'revenueBDT', label: 'Revenue (BDT)' },
    ],
    rows: (summary.byRoute || []).map((row) => ({
      route: row.route,
      count: row.count,
      revenueBRL: fmtMoneyBRL(row.revenueBRL),
      revenueBDT: fmtMoneyBDT(row.revenueBDT ?? row.revenue),
    })),
  });

  beginSection(doc, `Monthly Breakdown (${monthly.year})`, 'sec-monthly');
  drawDataTable(doc, {
    columns: [
      { key: 'label', label: 'Month' },
      { key: 'bookings', label: 'Bookings' },
      { key: 'revenueBRL', label: 'Revenue (BRL)' },
      { key: 'revenueBDT', label: 'Revenue (BDT)' },
    ],
    rows: (monthly.months || []).map((row) => ({
      label: row.label,
      bookings: row.bookings,
      revenueBRL: fmtMoneyBRL(row.revenueBRL),
      revenueBDT: fmtMoneyBDT(row.revenueBDT ?? row.revenue),
    })),
  });

  finalizeFooters(doc, company);
  const buffer = await bufferFromDoc(doc);
  const datePart = dayjs().format('YYYY-MM-DD');
  return { buffer, filename: `agent-report-${datePart}.pdf` };
}

export default {
  generateBookingInvoicePdf,
  generateReportPdf,
  generateAgentBookingPdf,
  generateAgentReportPdf,
};
