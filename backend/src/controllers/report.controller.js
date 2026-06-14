import * as reportService from '../services/report.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const listTypes = asyncHandler(async (_req, res) => {
  const data = reportService.listAvailableReports();
  res.json({ success: true, data });
});

export const run = asyncHandler(async (req, res) => {
  const { reportKey } = req.params;
  const data = await reportService.runReport(reportKey, req.query);
  if (!data) throw ApiError.notFound('Report not found');
  res.json({ success: true, data });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const { reportKey } = req.params;
  const data = await reportService.runReport(reportKey, req.query);
  if (!data) throw ApiError.notFound('Report not found');

  const rows = data.rows || [];
  const columns = data.columns?.length ? data.columns : Object.keys(rows[0] || {});

  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(row[c])).join(','));
  }

  const filename = data.export?.suggestedFilename || reportKey;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(lines.join('\n'));
});

export const exportPdf = asyncHandler(async (req, res) => {
  const { reportKey } = req.params;
  const { generateReportPdf } = await import('../services/pdf.service.js');
  const { buffer, filename } = await generateReportPdf(reportKey, req.query);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export default { listTypes, run, exportCsv, exportPdf };
