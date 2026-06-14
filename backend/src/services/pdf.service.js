import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import Setting from '../models/Setting.js';
import { getBookingById } from './booking.service.js';
import { runReport } from './report.service.js';

function bufferFromDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

async function getCompanyInfo() {
  const setting = await Setting.findOne({ key: 'company' }).lean();
  return {
    name: setting?.company?.name || 'Show Terra Air',
    address: setting?.company?.address || '',
    email: setting?.company?.email || '',
    phone: setting?.company?.whatsapp || setting?.company?.directorPhone || '',
    invoicePrefix: setting?.invoicePrefix || 'INV',
    currency: setting?.company?.currency || 'BDT',
  };
}

function formatMoney(amount, currency = 'BDT') {
  const sym = currency === 'BDT' ? '৳' : currency;
  return `${sym}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function drawTableHeader(doc, columns, y) {
  doc.fontSize(9).font('Helvetica-Bold');
  let x = doc.page.margins.left;
  columns.forEach((col) => {
    doc.text(col.label, x, y, { width: col.width, align: col.align || 'left' });
    x += col.width;
  });
  doc.moveTo(doc.page.margins.left, y + 14).lineTo(doc.page.width - doc.page.margins.right, y + 14).stroke('#cccccc');
  return y + 20;
}

export async function generateBookingInvoicePdf(bookingId) {
  const booking = await getBookingById(bookingId);
  const company = await getCompanyInfo();
  const invoiceNo = `${company.invoicePrefix}-${booking.bookingNumber}`;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.font('Helvetica');

  doc.fontSize(20).font('Helvetica-Bold').text(company.name, { align: 'center' });
  if (company.address) doc.fontSize(9).font('Helvetica').text(company.address, { align: 'center' });
  if (company.email || company.phone) {
    doc.text([company.email, company.phone].filter(Boolean).join(' | '), { align: 'center' });
  }

  doc.moveDown(1.5);
  doc.fontSize(16).font('Helvetica-Bold').text('BOOKING INVOICE', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');
  const leftX = 50;
  const rightX = 320;
  let y = doc.y;

  doc.font('Helvetica-Bold').text('Invoice No:', leftX, y, { continued: true }).font('Helvetica').text(` ${invoiceNo}`);
  doc.font('Helvetica-Bold').text('Date:', rightX, y, { continued: true }).font('Helvetica').text(` ${dayjs().format('DD MMM YYYY')}`);
  y += 18;
  doc.font('Helvetica-Bold').text('Booking No:', leftX, y, { continued: true }).font('Helvetica').text(` ${booking.bookingNumber}`);
  doc.font('Helvetica-Bold').text('Status:', rightX, y, { continued: true }).font('Helvetica').text(` ${booking.status.replace(/_/g, ' ')}`);
  y += 24;

  doc.font('Helvetica-Bold').fontSize(11).text('Customer Details', leftX, y);
  y += 16;
  doc.fontSize(10).font('Helvetica');
  doc.text(`Name: ${booking.customerName}`, leftX, y);
  y += 14;
  doc.text(`Phone: ${booking.customerPhone}`, leftX, y);
  y += 24;

  doc.font('Helvetica-Bold').fontSize(11).text('Travel Details', leftX, y);
  y += 16;
  doc.fontSize(10).font('Helvetica');

  const travelRows = [
    ['Airline', booking.airline],
    ['Route', booking.route],
    ['Departure', dayjs(booking.departureDate).format('DD MMM YYYY')],
    ['Return', booking.returnDate ? dayjs(booking.returnDate).format('DD MMM YYYY') : '—'],
    ['Passengers', String(booking.passengerCount)],
    ['PNR', booking.pnr || '—'],
    ['Ticket No', booking.ticketNumber || '—'],
    ['Supplier', booking.supplierName || '—'],
  ];

  travelRows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}:`, leftX, y, { width: 100, continued: true });
    doc.font('Helvetica').text(` ${value}`, { width: 400 });
    y += 14;
  });

  y += 10;
  doc.font('Helvetica-Bold').fontSize(11).text('Financial Summary', leftX, y);
  y += 16;

  const finRows = [
    ['Sale Price', formatMoney(booking.salePrice, company.currency)],
    ['Amount Paid', formatMoney(booking.amountPaid, company.currency)],
    ['Customer Due', formatMoney(booking.computed?.customerDue ?? booking.customerDue, company.currency)],
    ['Purchase Price', formatMoney(booking.purchasePrice, company.currency)],
    ['Direct Costs', formatMoney(booking.directCosts, company.currency)],
    ['Profit', formatMoney(booking.computed?.profit ?? booking.profit, company.currency)],
  ];

  doc.fontSize(10);
  finRows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(label, leftX, y, { width: 150, continued: true });
    doc.font('Helvetica').text(value, { align: 'right', width: 395 });
    y += 16;
  });

  if (booking.notes) {
    y += 10;
    doc.font('Helvetica-Bold').text('Notes:', leftX, y);
    y += 14;
    doc.font('Helvetica').text(booking.notes, leftX, y, { width: 495 });
  }

  doc.fontSize(8).fillColor('#666666');
  doc.text(
    `Generated on ${dayjs().format('DD MMM YYYY HH:mm')} — ${company.name}`,
    50,
    doc.page.height - 50,
    { align: 'center', width: doc.page.width - 100 }
  );

  const buffer = await bufferFromDoc(doc);
  return { buffer, filename: `${invoiceNo}.pdf` };
}

export async function generateReportPdf(reportKey, query) {
  const report = await runReport(reportKey, query);
  if (!report) throw new Error('Report not found');

  const company = await getCompanyInfo();
  const rows = report.rows || [];
  const columns = (report.columns?.length ? report.columns : Object.keys(rows[0] || {})).map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
  }));

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: columns.length > 5 ? 'landscape' : 'portrait' });
  doc.font('Helvetica');

  doc.fontSize(16).font('Helvetica-Bold').text(company.name);
  doc.fontSize(12).font('Helvetica-Bold').text(report.title || reportKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
  doc.fontSize(9).font('Helvetica').text(`Generated: ${dayjs().format('DD MMM YYYY HH:mm')} | Rows: ${rows.length}`);
  doc.moveDown(1);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = Math.max(60, Math.floor(pageWidth / Math.max(columns.length, 1)));

  const tableCols = columns.map((c) => ({ label: c.label, width: colWidth }));
  let y = drawTableHeader(doc, tableCols, doc.y);

  doc.font('Helvetica').fontSize(8);
  for (const row of rows) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = drawTableHeader(doc, tableCols, doc.page.margins.top);
      doc.font('Helvetica').fontSize(8);
    }
    let x = doc.page.margins.left;
    columns.forEach((col) => {
      const val = row[col.key];
      const text = val == null ? '' : typeof val === 'number' ? String(val) : String(val).slice(0, 40);
      doc.text(text, x, y, { width: colWidth - 4, align: 'left' });
      x += colWidth;
    });
    y += 14;
  }

  const buffer = await bufferFromDoc(doc);
  const filename = report.export?.suggestedFilename || `${reportKey}-${dayjs().format('YYYY-MM-DD')}`;
  return { buffer, filename: `${filename}.pdf` };
}

export default { generateBookingInvoicePdf, generateReportPdf };
