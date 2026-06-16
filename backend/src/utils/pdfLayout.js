import dayjs from 'dayjs';
import Setting from '../models/Setting.js';
import { formatCurrency } from './currencyUtils.js';

export const PDF = {
  margin: 45,
  footerHeight: 32,
  colors: {
    primary: '#1e3a8a',
    accent: '#2563eb',
    muted: '#64748b',
    border: '#cbd5e1',
    rowAlt: '#f1f5f9',
    white: '#ffffff',
    link: '#2563eb',
    success: '#15803d',
    warning: '#b45309',
  },
};

const MONEY_KEYS = /price|amount|profit|due|payable|revenue|cost|fare|tax|markup|cash|expense|income|net|balance|payment|sales|purchase/i;

export async function getPdfCompanyInfo() {
  const setting = await Setting.findOne({ key: 'company' }).lean();
  return {
    name: setting?.company?.name || 'Show Terra Air',
    address: setting?.company?.address || '',
    email: setting?.company?.email || '',
    phone: setting?.company?.whatsapp || setting?.company?.directorPhone || '',
    website: setting?.company?.website || '',
    invoicePrefix: setting?.invoicePrefix || 'INV',
  };
}

export function createPdfDoc(options = {}) {
  const PDFDocument = options.PDFDocument;
  return new PDFDocument({
    size: 'A4',
    margin: PDF.margin,
    bufferPages: true,
    autoFirstPage: true,
    ...options.docOptions,
  });
}

export function bufferFromDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export function contentWidth(doc) {
  return doc.page.width - PDF.margin * 2;
}

export function fmtDate(value, pattern = 'DD MMM YYYY') {
  if (!value) return '—';
  return dayjs(value).format(pattern);
}

export function fmtDateTime(value) {
  return fmtDate(value, 'DD MMM YYYY HH:mm');
}

export function fmtMoneyBRL(amount) {
  return formatCurrency(amount, 'BRL');
}

export function fmtMoneyBDT(amount) {
  return formatCurrency(amount, 'BDT');
}

export function isMoneyKey(key) {
  return MONEY_KEYS.test(String(key || ''));
}

export function humanizeKey(key) {
  return String(key || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function pageBottom(doc) {
  return doc.page.height - PDF.margin - PDF.footerHeight;
}

export function ensureSpace(doc, needed, onNewPage) {
  if (doc.y + needed > pageBottom(doc)) {
    doc.addPage();
    if (onNewPage) onNewPage();
    return true;
  }
  return false;
}

export function drawHeaderBand(doc, { company, docTitle, docSubtitle, metaLines = [] }) {
  const left = PDF.margin;
  const width = contentWidth(doc);
  const bandTop = PDF.margin;
  const bandHeight = docSubtitle || metaLines.length ? 88 : 72;

  doc.save();
  doc.rect(left, bandTop, width, bandHeight).fill(PDF.colors.primary);

  doc.fillColor(PDF.colors.white).font('Helvetica-Bold').fontSize(17);
  doc.text(company.name, left + 14, bandTop + 12, { width: width - 28 });

  doc.font('Helvetica').fontSize(8);
  let lineY = bandTop + 32;
  if (company.address) {
    doc.text(company.address, left + 14, lineY, { width: width - 160 });
    lineY += 10;
  }

  const contactParts = [];
  if (company.email) contactParts.push(company.email);
  if (company.phone) contactParts.push(company.phone);
  if (company.website) contactParts.push(company.website);

  if (contactParts.length) {
    const contactText = contactParts.join('  ·  ');
    doc.text(contactText, left + 14, lineY, { width: width - 160 });
    let offsetX = left + 14;
    if (company.email) {
      const emailW = doc.widthOfString(company.email);
      doc.link(offsetX, lineY - 1, emailW, 10, `mailto:${company.email}`);
      offsetX += emailW + doc.widthOfString('  ·  ');
    }
    if (company.phone) {
      const phoneW = doc.widthOfString(company.phone);
      doc.link(offsetX, lineY - 1, phoneW, 10, `tel:${company.phone.replace(/\s/g, '')}`);
      offsetX += phoneW;
      if (company.website) offsetX += doc.widthOfString('  ·  ');
    }
    if (company.website) {
      const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
      const webW = doc.widthOfString(company.website);
      doc.link(offsetX, lineY - 1, webW, 10, url);
    }
  }

  doc.font('Helvetica-Bold').fontSize(12).text(docTitle, left + 14, bandTop + bandHeight - 28, { width: width - 28 });
  if (docSubtitle) {
    doc.font('Helvetica').fontSize(8).text(docSubtitle, left + 14, bandTop + bandHeight - 14, { width: width - 28 });
  }

  if (metaLines.length) {
    doc.font('Helvetica').fontSize(7.5);
    metaLines.forEach((line, i) => {
      doc.text(line, left + width - 150, bandTop + 12 + i * 10, { width: 136, align: 'right' });
    });
  }

  doc.restore();
  doc.fillColor('#000000');
  doc.y = bandTop + bandHeight + 14;
}

export function drawToc(doc, items) {
  const left = PDF.margin;
  const width = contentWidth(doc);

  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF.colors.primary).text('Contents', left, doc.y);
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9).fillColor(PDF.colors.link);

  const startY = doc.y;
  items.forEach((item, index) => {
    const y = startY + index * 16;
    doc.fillColor(PDF.colors.link).text(`▸ ${item.label}`, left + 8, y, { width: width - 16, continued: false });
    const textW = doc.widthOfString(`▸ ${item.label}`);
    if (item.dest) {
      doc.link(left + 8, y - 1, Math.min(textW, width - 16), 12, `#${item.dest}`);
    }
  });

  doc.fillColor('#000000');
  doc.y = startY + items.length * 16 + 8;
  doc.moveDown(0.5);
}

export function beginSection(doc, title, dest) {
  ensureSpace(doc, 36);
  if (dest) doc.addNamedDestination(dest);

  const left = PDF.margin;
  const width = contentWidth(doc);
  const y = doc.y;

  doc.save();
  doc.rect(left, y, 4, 18).fill(PDF.colors.accent);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF.colors.primary).text(title, left + 10, y + 2);
  doc.fillColor('#000000');
  doc.y = y + 24;
  return y;
}

export function drawKeyValueGrid(doc, rows, columns = 2) {
  const left = PDF.margin;
  const width = contentWidth(doc);
  const colWidth = width / columns;
  const rowHeight = 16;
  let col = 0;
  let startY = doc.y;

  rows.forEach((row) => {
    if (col === 0) {
      ensureSpace(doc, rowHeight + 4);
      startY = doc.y;
    }

    const x = left + col * colWidth;
    const y = startY;

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PDF.colors.muted).text(`${row.label}:`, x, y, { width: colWidth - 8 });
    doc.font('Helvetica').fontSize(9).fillColor('#000000');

    if (row.link) {
      const labelH = 11;
      doc.text(String(row.value ?? '—'), x, y + labelH, { width: colWidth - 8, link: row.link, underline: true });
      const linkW = Math.min(doc.widthOfString(String(row.value ?? '—')), colWidth - 8);
      doc.link(x, y + labelH - 1, linkW, 11, row.link);
    } else {
      doc.text(String(row.value ?? '—'), x, y + 11, { width: colWidth - 8 });
    }

    col += 1;
    if (col >= columns) {
      col = 0;
      doc.y = startY + rowHeight + 8;
    }
  });

  if (col !== 0) doc.y = startY + rowHeight + 8;
  doc.moveDown(0.3);
}

export function drawDualMoneyTable(doc, { headers, rows, colWidths }) {
  const left = PDF.margin;
  const width = contentWidth(doc);
  const defaultWidths = colWidths || [
    width * 0.38,
    width * 0.31,
    width * 0.31,
  ];

  const drawHeader = () => {
    const y = doc.y;
    doc.save();
    doc.rect(left, y, width, 18).fill(PDF.colors.rowAlt);
    doc.restore();
    let x = left + 6;
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF.colors.muted).text(h, x, y + 5, { width: defaultWidths[i] - 8, align: i === 0 ? 'left' : 'right' });
      x += defaultWidths[i];
    });
    doc.y = y + 22;
    doc.fillColor('#000000');
  };

  drawHeader();

  rows.forEach((row, rowIndex) => {
    ensureSpace(doc, 22, drawHeader);
    const y = doc.y;

    if (rowIndex % 2 === 1) {
      doc.save();
      doc.rect(left, y - 2, width, 20).fill(PDF.colors.rowAlt);
      doc.restore();
    }

    let x = left + 6;
    doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);

    doc.text(row.label, x, y, { width: defaultWidths[0] - 8 });
    x += defaultWidths[0];

    doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    doc.text(row.brl ?? '', x, y, { width: defaultWidths[1] - 8, align: 'right' });
    x += defaultWidths[1];

    doc.font('Helvetica').fontSize(8).fillColor(PDF.colors.muted);
    doc.text(row.bdt ?? '', x, y + 1, { width: defaultWidths[2] - 8, align: 'right' });
    doc.fillColor('#000000');

    doc.y = y + 18;
  });

  doc.moveDown(0.4);
}

export function drawDataTable(doc, { columns, rows, moneyRate, formatCell }) {
  const left = PDF.margin;
  const width = contentWidth(doc);
  const colCount = Math.max(columns.length, 1);
  const colWidth = Math.max(48, Math.floor(width / colCount));
  const tableCols = columns.map((c) => ({ ...c, width: c.width || colWidth }));

  const drawHeader = () => {
    const y = doc.y;
    doc.save();
    doc.rect(left, y, width, 16).fill(PDF.colors.primary);
    doc.restore();
    let x = left + 4;
    tableCols.forEach((col) => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PDF.colors.white).text(col.label, x, y + 4, { width: col.width - 6 });
      x += col.width;
    });
    doc.y = y + 18;
    doc.fillColor('#000000');
  };

  drawHeader();

  rows.forEach((row, rowIndex) => {
    const cellLines = tableCols.map((col) => {
      const raw = row[col.key];
      if (formatCell) return formatCell(col.key, raw, row);
      if (raw == null) return '—';
      if (typeof raw === 'number' && isMoneyKey(col.key)) {
        const brl = moneyRate > 0 ? raw / moneyRate : raw;
        return `${fmtMoneyBRL(brl)}\n${fmtMoneyBDT(raw)}`;
      }
      if (raw instanceof Date || (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw))) {
        return fmtDate(raw);
      }
      return String(raw);
    });

    const lineCounts = cellLines.map((text) => Math.max(1, Math.ceil(String(text).length / Math.floor((tableCols[0]?.width || colWidth) / 4))));
    const rowHeight = Math.max(14, lineCounts.reduce((m, n) => Math.max(m, n), 1) * 10 + 4);

    ensureSpace(doc, rowHeight + 4, drawHeader);
    const y = doc.y;

    if (rowIndex % 2 === 0) {
      doc.save();
      doc.rect(left, y - 1, width, rowHeight).fill('#ffffff');
      doc.restore();
    } else {
      doc.save();
      doc.rect(left, y - 1, width, rowHeight).fill(PDF.colors.rowAlt);
      doc.restore();
    }

    let x = left + 4;
    tableCols.forEach((col, i) => {
      doc.font('Helvetica').fontSize(7.5).fillColor('#000000').text(cellLines[i], x, y + 2, {
        width: col.width - 6,
        lineGap: 1,
      });
      x += col.width;
    });

    doc.y = y + rowHeight + 2;
  });

  doc.moveDown(0.5);
}

export function drawSummaryCards(doc, cards) {
  const left = PDF.margin;
  const width = contentWidth(doc);
  const count = Math.min(cards.length, 4);
  const gap = 8;
  const cardWidth = (width - gap * (count - 1)) / count;
  const cardHeight = 52;
  const startY = doc.y;

  ensureSpace(doc, cardHeight + 8);

  cards.slice(0, count).forEach((card, i) => {
    const x = left + i * (cardWidth + gap);
    doc.save();
    doc.roundedRect(x, startY, cardWidth, cardHeight, 4).fillAndStroke(PDF.colors.rowAlt, PDF.colors.border);
    doc.restore();

    doc.font('Helvetica').fontSize(7.5).fillColor(PDF.colors.muted).text(card.label, x + 8, startY + 8, { width: cardWidth - 16 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF.colors.primary).text(card.value, x + 8, startY + 22, { width: cardWidth - 16 });
    if (card.subValue) {
      doc.font('Helvetica').fontSize(8).fillColor(PDF.colors.muted).text(card.subValue, x + 8, startY + 36, { width: cardWidth - 16 });
    }
  });

  doc.fillColor('#000000');
  doc.y = startY + cardHeight + 12;
}

export function drawParagraph(doc, text, options = {}) {
  if (!text) return;
  doc.font('Helvetica').fontSize(options.fontSize || 9).fillColor('#000000').text(String(text), PDF.margin, doc.y, {
    width: contentWidth(doc),
    lineGap: 2,
  });
  doc.moveDown(0.3);
}

export function drawStatusPill(doc, label, x, y) {
  const text = String(label || '').replace(/_/g, ' ').toUpperCase();
  doc.font('Helvetica-Bold').fontSize(7);
  const w = doc.widthOfString(text) + 16;
  doc.save();
  doc.roundedRect(x, y, w, 16, 8).fill(PDF.colors.rowAlt);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(7).fillColor(PDF.colors.primary).text(text, x + 8, y + 4);
  doc.fillColor('#000000');
}

export function finalizeFooters(doc, company) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageNum = i - range.start + 1;
    const total = range.count;
    const y = doc.page.height - PDF.margin + 8;
    const left = PDF.margin;
    const width = contentWidth(doc);

    doc.save();
    doc.moveTo(left, y - 6).lineTo(left + width, y - 6).strokeColor(PDF.colors.border).lineWidth(0.5).stroke();
    doc.restore();

    doc.font('Helvetica').fontSize(7).fillColor(PDF.colors.muted);
    doc.text(`${company.name} · Generated ${dayjs().format('DD MMM YYYY HH:mm')}`, left, y, { width: width * 0.7, align: 'left' });
    doc.text(`Page ${pageNum} of ${total}`, left, y, { width, align: 'right' });
    doc.fillColor('#000000');
  }
}

const SIMPLE_MARGIN = 40;

export function createSimplePdfDoc(PDFDocument, layout = 'portrait') {
  return new PDFDocument({ size: 'A4', margin: SIMPLE_MARGIN, autoFirstPage: true, layout });
}

export function simpleContentWidth(doc) {
  return doc.page.width - SIMPLE_MARGIN * 2;
}

export function drawSimpleHeader(doc, company, title, subtitle) {
  const left = SIMPLE_MARGIN;
  const width = simpleContentWidth(doc);

  doc.font('Helvetica-Bold').fontSize(13).fillColor(PDF.colors.primary).text(company.name, left, 40);
  doc.font('Helvetica').fontSize(7.5).fillColor(PDF.colors.muted);
  const contact = [company.address, company.email, company.phone].filter(Boolean).join(' · ');
  let y = 56;
  if (contact) {
    doc.text(contact, left, y, { width, lineGap: 1 });
    y += contact.length > 80 ? 22 : 12;
  }
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000').text(title, left, y);
  y += 14;
  if (subtitle) {
    doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(subtitle, left, y, { width });
    y += 12;
  }
  doc.moveTo(left, y + 2).lineTo(left + width, y + 2).strokeColor(PDF.colors.border).stroke();
  return y + 12;
}

export function drawSimpleSection(doc, y, title, rows, cols = 2) {
  const left = SIMPLE_MARGIN;
  const width = simpleContentWidth(doc);
  const colW = width / cols;
  const rowH = 26;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF.colors.primary).text(title.toUpperCase(), left, y);
  y += 14;

  let col = 0;
  let rowY = y;
  for (const item of rows) {
    const x = left + col * colW;
    doc.font('Helvetica-Bold').fontSize(7).fillColor(PDF.colors.muted).text(item.label, x, rowY, { width: colW - 8, lineBreak: false });
    doc.font('Helvetica').fontSize(8.5).fillColor('#000000').text(String(item.value ?? '—'), x, rowY + 9, { width: colW - 8, lineGap: 0 });
    col += 1;
    if (col >= cols) {
      col = 0;
      rowY += rowH;
    }
  }
  if (col !== 0) rowY += rowH;
  return rowY + 8;
}

export function drawSimpleMoneyTable(doc, y, rows) {
  const left = SIMPLE_MARGIN;
  const width = simpleContentWidth(doc);
  const descW = width * 0.5;
  const brlW = width * 0.25;
  const bdtW = width * 0.25;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF.colors.primary).text('AMOUNTS', left, y);
  y += 14;

  doc.save();
  doc.rect(left, y, width, 14).fill(PDF.colors.rowAlt);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(7).fillColor(PDF.colors.muted);
  doc.text('Description', left + 4, y + 3, { width: descW });
  doc.text('BRL', left + descW, y + 3, { width: brlW - 4, align: 'right' });
  doc.text('BDT', left + descW + brlW, y + 3, { width: bdtW - 4, align: 'right' });
  y += 16;

  for (const row of rows) {
    doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor('#000000');
    doc.text(row.label, left + 4, y, { width: descW - 8 });
    doc.text(row.brl, left + descW, y, { width: brlW - 4, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor(PDF.colors.muted);
    doc.text(row.bdt, left + descW + brlW, y + 1, { width: bdtW - 4, align: 'right' });
    y += 14;
  }
  return y + 4;
}

export function drawSimpleFooter(doc, company) {
  const left = SIMPLE_MARGIN;
  const width = simpleContentWidth(doc);
  const y = doc.page.height - 36;
  doc.moveTo(left, y - 4).lineTo(left + width, y - 4).strokeColor(PDF.colors.border).stroke();
  doc.font('Helvetica').fontSize(7).fillColor(PDF.colors.muted).text(
    `${company.name} · Generated ${dayjs().format('DD MMM YYYY HH:mm')}`,
    left,
    y,
    { width, align: 'center' }
  );
  doc.fillColor('#000000');
}

export default {
  PDF,
  getPdfCompanyInfo,
  createPdfDoc,
  bufferFromDoc,
  contentWidth,
  fmtDate,
  fmtDateTime,
  fmtMoneyBRL,
  fmtMoneyBDT,
  isMoneyKey,
  humanizeKey,
  ensureSpace,
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
  createSimplePdfDoc,
  drawSimpleHeader,
  drawSimpleSection,
  drawSimpleMoneyTable,
  drawSimpleFooter,
};
