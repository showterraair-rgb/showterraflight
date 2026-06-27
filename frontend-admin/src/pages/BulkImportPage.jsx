import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../services/crm.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoneyAmount from '../components/common/MoneyAmount';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportResults({ results }) {
  if (!results?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <h4 className="font-semibold text-slate-900">Import results</h4>
      <ul className="mt-2 space-y-1">
        {results.map((r, i) => (
          <li key={i} className={r.ok ? 'text-green-700' : 'text-red-700'}>
            {r.ok ? (
              <>
                Row {r.row}: created{' '}
                <Link to={`/bookings/${r.id}`} className="font-medium underline">
                  {r.bookingNumber}
                </Link>
              </>
            ) : (
              <>Row {r.row || r.fileName}: {r.error}</>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewTable({ rows, editablePhone, onPhoneChange }) {
  if (!rows?.length) return null;
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Airline / Route</th>
            <th className="px-3 py-2">Departure</th>
            <th className="px-3 py-2">PNR / Ticket</th>
            <th className="px-3 py-2">Sale (BDT)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => {
            const invalid = !row.valid && !row.customerId;
            const errors = row.errors || [];
            return (
              <tr key={idx} className={invalid ? 'bg-red-50' : ''}>
                <td className="px-3 py-2">{row.row || idx + 1}</td>
                <td className="px-3 py-2">
                  {row.valid || row.customerId ? (
                    <span className="text-green-700">Ready</span>
                  ) : (
                    <span className="text-red-700" title={errors.join(', ')}>Invalid</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {editablePhone ? (
                    <input
                      type="tel"
                      className="input w-36"
                      placeholder="01XXXXXXXXX"
                      value={row.customerPhone || ''}
                      onChange={(e) => onPhoneChange(idx, e.target.value)}
                    />
                  ) : (
                    <div>
                      <div>{row.customerName || '—'}</div>
                      <div className="text-xs text-slate-500">{row.customerPhone}</div>
                    </div>
                  )}
                  {errors.length > 0 && (
                    <div className="text-xs text-red-600">{errors.join('; ')}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div>{row.airline}</div>
                  <div className="text-xs text-slate-500">{row.route}</div>
                </td>
                <td className="px-3 py-2">{row.departureDate}</td>
                <td className="px-3 py-2">
                  <div>{row.pnr || '—'}</div>
                  <div className="text-xs text-slate-500">{row.ticketNumber}</div>
                </td>
                <td className="px-3 py-2">
                  <MoneyAmount amount={row.salePriceBDT} currency="BDT" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function BulkImportPage() {
  const [tab, setTab] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [csvRows, setCsvRows] = useState([]);
  const [pdfRows, setPdfRows] = useState([]);
  const [importResults, setImportResults] = useState(null);

  const activeRows = tab === 'csv' ? csvRows : pdfRows;
  const readyCount = activeRows.filter((r) => r.valid || r.customerId || (r.customerPhone?.length >= 10)).length;

  async function handleDownloadTemplate() {
    setError('');
    try {
      const { data } = await bookingsApi.bulkImportTemplate();
      downloadBlob(data, 'booking-import-template.csv');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not download template');
    }
  }

  async function handleCsvPreview(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setMessage('');
    setImportResults(null);
    try {
      const { data } = await bookingsApi.bulkImportPreview(file);
      setCsvRows(data.data?.rows || []);
      setMessage(`Parsed ${data.data?.total || 0} rows — ${data.data?.valid || 0} valid`);
    } catch (err) {
      setError(err.response?.data?.message || 'CSV preview failed');
      setCsvRows([]);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  async function handlePdfUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLoading(true);
    setError('');
    setMessage('');
    setImportResults(null);
    try {
      const { data } = await bookingsApi.bulkImportTickets(files);
      const items = data.data?.items || [];
      setPdfRows(items.map((item, idx) => ({
        row: idx + 1,
        fileName: item.fileName,
        valid: item.valid,
        errors: item.errors || [],
        customerPhone: '',
        ...(item.row || {}),
      })));
      setMessage(data.message || `Processed ${items.length} PDF(s)`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ticket OCR failed');
      setPdfRows([]);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  function handlePhoneChange(idx, phone) {
    setPdfRows((prev) => prev.map((r, i) => (i === idx ? { ...r, customerPhone: phone, valid: phone.length >= 10 } : r)));
  }

  async function handleImport() {
    const source = tab === 'csv' ? csvRows : pdfRows;
    const toImport = source.filter((r) => r.valid || r.customerId || (r.customerPhone?.length >= 10));
    if (!toImport.length) {
      setError('No valid rows to import');
      return;
    }

    const rows = toImport.map((r) => ({
      row: r.row,
      fileName: r.fileName,
      customerId: r.customerId || undefined,
      customerPhone: r.customerPhone || undefined,
      airline: r.airline,
      route: r.route,
      sector: r.sector,
      fromDestination: r.fromDestination,
      toDestination: r.toDestination,
      departureDate: r.departureDate,
      pnr: r.pnr,
      ticketNumber: r.ticketNumber,
      passengerCount: r.passengerCount,
      passengers: r.passengers,
      purchasePriceBRL: r.purchasePriceBRL,
      salePriceBRL: r.salePriceBRL,
      bdtRate: r.bdtRate,
      notes: r.notes,
      flightSegment: r.flightSegment,
      status: 'confirmed',
    }));

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await bookingsApi.bulkImportExecute(rows);
      setImportResults(data.data?.results || []);
      setMessage(data.message || 'Import complete');
      if (tab === 'csv') {
        setCsvRows((prev) => prev.filter((r) => !toImport.some((t) => t.row === r.row)));
      } else {
        setPdfRows((prev) => prev.filter((r) => !toImport.some((t) => t.row === r.row)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Bulk Import</h2>
        <p className="text-sm text-slate-500">
          Import bookings from CSV or batch-scan ticket PDFs (BD FLY). Max 100 CSV rows or 25 PDFs per batch.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'csv' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          onClick={() => setTab('csv')}
        >
          CSV import
        </button>
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'pdf' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          onClick={() => setTab('pdf')}
        >
          Ticket PDF batch
        </button>
      </div>

      {tab === 'csv' && (
        <div className="card space-y-3 p-4">
          <p className="text-sm text-slate-600">
            Columns: customerPhone, airline, route, departureDate, pnr, ticketNumber, passengerCount, purchasePriceBDT, salePriceBDT, notes
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={handleDownloadTemplate}>
              Download template
            </button>
            <label className="btn-primary cursor-pointer">
              Upload CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvPreview} />
            </label>
          </div>
        </div>
      )}

      {tab === 'pdf' && (
        <div className="card space-y-3 p-4">
          <p className="text-sm text-slate-600">
            Upload multiple BD FLY ticket PDFs. Enter customer phone for each row before importing.
          </p>
          <label className="btn-primary inline-block cursor-pointer">
            Upload PDFs (max 25)
            <input type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={handlePdfUpload} />
          </label>
        </div>
      )}

      {loading && <LoadingSpinner className="py-8" />}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}

      <PreviewTable
        rows={activeRows}
        editablePhone={tab === 'pdf'}
        onPhoneChange={handlePhoneChange}
      />

      {activeRows.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={loading || readyCount === 0}
            onClick={handleImport}
          >
            Import {readyCount} booking{readyCount !== 1 ? 's' : ''}
          </button>
          <span className="text-sm text-slate-500">{readyCount} of {activeRows.length} ready</span>
        </div>
      )}

      <ImportResults results={importResults} />
    </div>
  );
}
