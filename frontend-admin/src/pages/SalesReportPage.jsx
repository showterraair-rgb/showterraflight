import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../services/phase5.api';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SummaryStatCard from '../components/common/SummaryStatCard';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate } from '../utils/date';
import MoneyAmount from '../components/common/MoneyAmount';
import { downloadBlob } from '../utils/download';
import { usePermission } from '../hooks/usePermission';
import { useFieldPermission } from '../hooks/useFieldPermission';
import { BOOKING_STATUS_LABELS } from '../utils/constants';

export default function SalesReportPage() {
  const { can } = usePermission();
  const financeFields = useFieldPermission('finance');
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const { data } = await reportsApi.run('sales-summary', params);
      setResult(data.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    const params = { ...filters };
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    const { data } = await reportsApi.exportCsv('sales-summary', params);
    downloadBlob(data, `sales-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const cards = result?.cards || {};

  const columns = [
    { key: 'bookingNumber', label: 'Booking #', render: (r) => (
      <Link to={`/bookings/${r.id}`} className="font-mono text-xs text-brand-600 hover:underline">{r.bookingNumber}</Link>
    ) },
    { key: 'customer', label: 'Customer' },
    { key: 'route', label: 'Route' },
    { key: 'journeyType', label: 'Type', render: (r) => r.journeyType === 'round_trip' ? 'Roundway' : 'Oneway' },
    { key: 'pnr', label: 'PNR', render: (r) => r.pnr || '—' },
    { key: 'bookingDate', label: 'Booking Time', render: (r) => formatDate(r.bookingDate) },
    ...(!financeFields.hidden ? [
      { key: 'salePrice', label: 'Customer Price', render: (r) => <MoneyAmount amount={r.salePrice} size="sm" /> },
      { key: 'purchasePrice', label: 'Agent Price', render: (r) => <MoneyAmount amount={r.purchasePrice} size="sm" /> },
      { key: 'amountPaid', label: 'Paid', render: (r) => <MoneyAmount amount={r.amountPaid} size="sm" /> },
      { key: 'customerDue', label: 'Due', render: (r) => <MoneyAmount amount={r.customerDue} size="sm" /> },
    ] : []),
    { key: 'passengerCount', label: 'PAX' },
    { key: 'airline', label: 'Airline' },
    { key: 'departureDate', label: 'Flight Date', render: (r) => formatDate(r.departureDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={BOOKING_STATUS_LABELS[r.status]} /> },
  ];

  if (loading && !result) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Report</h2>
          <p className="text-sm text-slate-500">{result?.rowCount ?? 0} records</p>
        </div>
        {can('reports:export') && (
          <button type="button" onClick={exportCsv} className="btn-secondary">Download CSV</button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryStatCard label="Total Paid" amount={cards.totalPaid} color="green" />
        <SummaryStatCard label="Total Due" amount={cards.totalDue} color="red" />
        <SummaryStatCard label="Total Refund" amount={cards.refundedAmount} count={cards.refundedCount} color="teal" />
        <SummaryStatCard label="Total Reissue" amount={cards.reissuedAmount} count={cards.reissuedCount} color="indigo" />
        <SummaryStatCard label="Total Void" amount={cards.voidedAmount} count={cards.voidedCount} color="slate" />
        <SummaryStatCard label="Ticketed" amount={cards.ticketedAmount} count={cards.ticketedCount} color="teal" />
        <SummaryStatCard label="Cancelled" amount={cards.cancelledAmount} count={cards.cancelledCount} color="amber" />
      </div>

      <div className="card flex flex-wrap gap-3">
        <input type="date" className="input-field w-auto" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        <input type="date" className="input-field w-auto" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        <button type="button" onClick={load} className="btn-primary">Apply</button>
      </div>

      <DataTable columns={columns} data={result?.rows || []} loading={loading} emptyMessage="No sales data for this period" />
    </div>
  );
}
