import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
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
  fmtDate,
  fmtDateTime,
  fmtMoneyBRL,
  fmtMoneyBDT,
  humanizeKey,
  isMoneyKey,
  drawHeaderBand,
  drawToc,
  beginSection,
  drawKeyValueGrid,
  drawDualMoneyTable,
  drawDataTable,
  drawSummaryCards,
  drawParagraph,
  drawStatusPill,
  finalizeFooters,
  PDF,
} from '../utils/pdfLayout.js';

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

  const doc = createDoc();
  const left = PDF.margin;

  drawHeaderBand(doc, {
    company,
    docTitle: 'BOOKING INVOICE',
    docSubtitle: invoiceNo,
    metaLines: [
      `Date: ${dayjs().format('DD MMM YYYY')}`,
      `Booking: ${booking.bookingNumber}`,
      `Status: ${statusLabel(booking.status)}`,
    ],
  });

  drawStatusPill(doc, booking.status, left, doc.y);
  doc.y += 22;

  const tocItems = [
    { label: 'Document Overview', dest: 'sec-overview' },
    { label: 'Customer Details', dest: 'sec-customer' },
    { label: 'Travel Information', dest: 'sec-travel' },
    { label: 'Financial Breakdown', dest: 'sec-pricing' },
    { label: 'Payment Status', dest: 'sec-payments' },
  ];
  if (booking.notes) tocItems.push({ label: 'Notes', dest: 'sec-notes' });
  if (booking.statusTimeline?.length) tocItems.push({ label: 'Status History', dest: 'sec-timeline' });

  drawToc(doc, tocItems);

  beginSection(doc, 'Document Overview', 'sec-overview');
  drawKeyValueGrid(doc, [
    { label: 'Invoice Number', value: invoiceNo },
    { label: 'Booking Number', value: booking.bookingNumber },
    { label: 'Issue Date', value: dayjs().format('DD MMM YYYY') },
    { label: 'Booking Status', value: statusLabel(booking.status) },
    { label: 'Approval', value: statusLabel(booking.approvalStatus) },
    { label: 'Exchange Rate', value: `1 BRL = ${Number(rate).toFixed(2)} BDT` },
    { label: 'Journey Type', value: statusLabel(booking.journeyType) },
    { label: 'Travel Class', value: statusLabel(booking.travelClass) },
  ], 2);

  beginSection(doc, 'Customer Details', 'sec-customer');
  drawKeyValueGrid(doc, [
    { label: 'Customer Name', value: booking.customerName },
    {
      label: 'Phone',
      value: booking.customerPhone,
      link: booking.customerPhone ? `tel:${String(booking.customerPhone).replace(/\s/g, '')}` : null,
    },
    { label: 'Customer ID', value: booking.customer || '—' },
    { label: 'Payment Status', value: statusLabel(booking.paymentStatus) },
  ], 2);

  beginSection(doc, 'Travel Information', 'sec-travel');
  drawKeyValueGrid(doc, [
    { label: 'Airline', value: booking.airline },
    { label: 'Route', value: booking.route },
    { label: 'Sector', value: booking.sector || '—' },
    { label: 'From / To', value: `${booking.fromDestination || '—'} → ${booking.toDestination || '—'}` },
    { label: 'Departure', value: fmtDate(booking.departureDate) },
    { label: 'Return', value: fmtDate(booking.returnDate) },
    { label: 'Passengers', value: String(booking.passengerCount) },
    { label: 'PNR', value: booking.pnr || '—' },
    { label: 'Ticket Number', value: booking.ticketNumber || '—' },
    { label: 'Supplier', value: booking.supplierName || '—' },
  ], 2);

  beginSection(doc, 'Financial Breakdown', 'sec-pricing');
  drawDualMoneyTable(doc, {
    headers: ['Description', 'Amount (BRL)', 'Amount (BDT)'],
    rows: [
      {
        label: 'Sale Price',
        brl: fmtMoneyBRL(p.salePriceBRL),
        bdt: fmtMoneyBDT(p.salePriceBDT),
      },
      {
        label: 'Purchase Price',
        brl: fmtMoneyBRL(p.purchasePriceBRL),
        bdt: fmtMoneyBDT(p.purchasePriceBDT),
      },
      {
        label: 'Direct Costs',
        brl: fmtMoneyBRL(p.directCostsBRL),
        bdt: fmtMoneyBDT(p.directCostsBDT),
      },
      {
        label: 'Profit',
        brl: fmtMoneyBRL(p.profitBRL ?? booking.computed?.profitBRL),
        bdt: fmtMoneyBDT(p.profitBDT ?? booking.computed?.profitBDT),
        bold: true,
      },
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
      {
        label: 'Supplier Payable',
        brl: fmtMoneyBRL(p.supplierPayableBRL ?? booking.computed?.supplierPayableBRL),
        bdt: fmtMoneyBDT(p.supplierPayableBDT ?? booking.computed?.supplierPayableBDT),
      },
    ],
  });

  beginSection(doc, 'Payment Status', 'sec-payments');
  drawKeyValueGrid(doc, [
    { label: 'Customer Payment', value: statusLabel(booking.paymentStatus) },
    { label: 'Supplier Payment', value: statusLabel(booking.supplierPaymentStatus) },
    { label: 'Amount Received', value: fmtMoneyBDT(booking.amountPaid) },
    { label: 'Supplier Paid', value: fmtMoneyBDT(booking.supplierPaid) },
    { label: 'Created', value: fmtDateTime(booking.createdAt) },
    { label: 'Last Updated', value: fmtDateTime(booking.updatedAt) },
  ], 2);

  if (booking.notes) {
    beginSection(doc, 'Notes', 'sec-notes');
    drawParagraph(doc, booking.notes);
  }

  if (booking.statusTimeline?.length) {
    beginSection(doc, 'Status History', 'sec-timeline');
    drawDataTable(doc, {
      columns: [
        { key: 'status', label: 'Status' },
        { key: 'note', label: 'Note' },
        { key: 'changedAt', label: 'Date' },
      ],
      rows: booking.statusTimeline.map((t) => ({
        status: statusLabel(t.status),
        note: t.note || '—',
        changedAt: t.changedAt,
      })),
    });
  }

  finalizeFooters(doc, company);
  const buffer = await bufferFromDoc(doc);
  return { buffer, filename: `${invoiceNo}.pdf` };
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

  const doc = createDoc();
  const left = PDF.margin;

  drawHeaderBand(doc, {
    company,
    docTitle: 'AGENT BOOKING CONFIRMATION',
    docSubtitle: booking.bookingRef,
    metaLines: [
      `Date: ${dayjs().format('DD MMM YYYY')}`,
      `Agent: ${booking.agentCode || '—'}`,
      `Status: ${statusLabel(booking.status)}`,
    ],
  });

  drawStatusPill(doc, booking.status, left, doc.y);
  doc.y += 22;

  const tocItems = [
    { label: 'Booking Overview', dest: 'sec-overview' },
    { label: 'Agent Information', dest: 'sec-agent' },
    { label: 'Flight Details', dest: 'sec-flight' },
    { label: 'Passengers', dest: 'sec-passengers' },
    { label: 'Price Breakdown', dest: 'sec-pricing' },
    { label: 'Preferences & Requests', dest: 'sec-preferences' },
  ];
  if (booking.statusTimeline?.length) tocItems.push({ label: 'Status Timeline', dest: 'sec-timeline' });
  if (booking.adminNotes) tocItems.push({ label: 'Admin Notes', dest: 'sec-notes' });

  drawToc(doc, tocItems);

  beginSection(doc, 'Booking Overview', 'sec-overview');
  drawKeyValueGrid(doc, [
    { label: 'Booking Reference', value: booking.bookingRef },
    { label: 'Booking Type', value: statusLabel(booking.bookingType) },
    { label: 'Status', value: statusLabel(booking.status) },
    { label: 'Ticket Issued', value: booking.ticketIssued ? 'Yes' : 'No' },
    { label: 'Exchange Rate', value: `1 BRL = ${Number(rate).toFixed(2)} BDT (at booking)` },
    { label: 'Created', value: fmtDateTime(booking.createdAt) },
    { label: 'Confirmed', value: booking.confirmedAt ? fmtDateTime(booking.confirmedAt) : '—' },
    { label: 'PNR', value: booking.pnr || '—' },
  ], 2);

  beginSection(doc, 'Agent Information', 'sec-agent');
  drawKeyValueGrid(doc, [
    { label: 'Agent Code', value: booking.agentCode || '—' },
    { label: 'Company', value: booking.agentCompany || '—' },
  ], 2);

  beginSection(doc, 'Flight Details', 'sec-flight');
  drawKeyValueGrid(doc, [
    { label: 'Airline', value: booking.airline },
    { label: 'Flight Number', value: booking.flightNumber },
    { label: 'Route', value: booking.route },
    { label: 'Travel Class', value: statusLabel(booking.travelClass) },
    { label: 'Departure', value: `${fmtDate(booking.departureDate)} ${booking.departureTime || ''}`.trim() },
    { label: 'Arrival', value: `${fmtDate(booking.arrivalDate)} ${booking.arrivalTime || ''}`.trim() },
    { label: 'Passengers', value: String(count) },
    { label: 'PNR', value: booking.pnr || '—' },
  ], 2);

  beginSection(doc, 'Passengers', 'sec-passengers');
  if (booking.passengers?.length) {
    drawDataTable(doc, {
      columns: [
        { key: 'name', label: 'Name', width: 120 },
        { key: 'passport', label: 'Passport' },
        { key: 'dob', label: 'DOB' },
        { key: 'expiry', label: 'Expiry' },
        { key: 'nationality', label: 'Nationality' },
      ],
      rows: booking.passengers.map((passenger) => ({
        name: `${passenger.title || ''} ${passenger.firstName} ${passenger.lastName}`.trim(),
        passport: passenger.passportNumber || '—',
        dob: fmtDate(passenger.dob),
        expiry: fmtDate(passenger.passportExpiry),
        nationality: passenger.nationality || '—',
      })),
    });
  } else {
    drawParagraph(doc, 'No passenger details recorded.');
  }

  beginSection(doc, 'Price Breakdown', 'sec-pricing');
  const basePerPaxBRL = p.baseFareBRL ?? booking.baseFareBRL ?? 0;
  const taxPerPaxBRL = p.taxBRL ?? booking.taxBRL ?? 0;
  const markupBRL = p.markupBRL ?? booking.markupBRL ?? 0;

  drawDualMoneyTable(doc, {
    headers: ['Description', 'Amount (BRL)', 'Amount (BDT)'],
    rows: [
      {
        label: `Base Fare (×${count} pax @ ${fmtMoneyBRL(basePerPaxBRL)}/pax)`,
        brl: fmtMoneyBRL(basePerPaxBRL * count),
        bdt: fmtMoneyBDT(basePerPaxBRL * count * rate),
      },
      {
        label: `Tax (×${count} pax @ ${fmtMoneyBRL(taxPerPaxBRL)}/pax)`,
        brl: fmtMoneyBRL(taxPerPaxBRL * count),
        bdt: fmtMoneyBDT(taxPerPaxBRL * count * rate),
      },
      {
        label: 'Agent Markup',
        brl: fmtMoneyBRL(markupBRL),
        bdt: fmtMoneyBDT(markupBRL * rate),
      },
      {
        label: 'Total Fare',
        brl: fmtMoneyBRL(p.totalFareBRL ?? booking.totalFareBRL),
        bdt: fmtMoneyBDT(p.totalFareBDT ?? booking.totalFareBDT),
        bold: true,
      },
    ],
  });

  beginSection(doc, 'Preferences & Requests', 'sec-preferences');
  drawKeyValueGrid(doc, [
    { label: 'Meal Preference', value: booking.mealPreference || 'None' },
    { label: 'Seat Preference', value: booking.seatPreference || 'No Preference' },
    { label: 'Baggage Allowance', value: booking.baggageAllowance || '—' },
  ], 2);
  if (booking.specialRequests) {
    drawParagraph(doc, `Special Requests: ${booking.specialRequests}`);
  }

  if (booking.statusTimeline?.length) {
    beginSection(doc, 'Status Timeline', 'sec-timeline');
    drawDataTable(doc, {
      columns: [
        { key: 'status', label: 'Status' },
        { key: 'note', label: 'Note' },
        { key: 'changedAt', label: 'Date' },
      ],
      rows: booking.statusTimeline.map((t) => ({
        status: statusLabel(t.status),
        note: t.note || '—',
        changedAt: fmtDateTime(t.changedAt),
      })),
    });
  }

  if (booking.adminNotes) {
    beginSection(doc, 'Admin Notes', 'sec-notes');
    drawParagraph(doc, booking.adminNotes);
  }

  finalizeFooters(doc, company);
  const buffer = await bufferFromDoc(doc);
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
