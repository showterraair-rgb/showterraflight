import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../services/crm.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import RowActions from '../components/common/RowActions';
import SummaryStatCard from '../components/common/SummaryStatCard';
import { usePermission } from '../hooks/usePermission';
import { useFieldPermission } from '../hooks/useFieldPermission';
import { formatDate } from '../utils/date';
import MoneyAmount, { getBookingMoney } from '../components/common/MoneyAmount';
import { BOOKING_STATUS_LABELS } from '../utils/constants';

const PAYMENT_TABS = [
  { key: '', label: 'All' },
  { key: 'paid', label: 'Fully Paid' },
  { key: 'partial', label: 'Partial Due' },
  { key: 'unpaid', label: 'Unpaid' },
];

const PAYMENT_LABELS = { paid: 'Fully Paid', partial: 'Partial Due', unpaid: 'Unpaid' };

export default function PartialPaymentsPage() {
  const { can } = usePermission();
  const financeFields = useFieldPermission('finance');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', paymentStatus: 'partial' });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      if (!params.paymentStatus) {
        params.paymentStatus = undefined;
      }
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const [listRes, sumRes] = await Promise.all([
        bookingsApi.list(params),
        bookingsApi.summary(params),
      ]);
      setItems(listRes.data.data);
      setPagination(listRes.data.pagination);
      setSummary(sumRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const setPaymentTab = (paymentStatus) => {
    setFilters((f) => ({ ...f, paymentStatus }));
    setPage(1);
  };

  const columns = [
    { key: 'bookingNumber', label: 'Booking #', render: (r) => (
      <Link to={`/bookings/${r.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">{r.bookingNumber}</Link>
    ) },
    { key: 'customerName', label: 'Customer' },
    { key: 'route', label: 'Route' },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (r) => <StatusBadge status={r.paymentStatus === 'paid' ? 'success' : r.paymentStatus === 'partial' ? 'pending' : 'cancelled'} label={PAYMENT_LABELS[r.paymentStatus] || r.paymentStatus} />,
    },
    ...(!financeFields.hidden ? [
      { key: 'amountPaid', label: 'Paid', render: (r) => <MoneyAmount amount={r.amountPaid} size="sm" /> },
      { key: 'customerDue', label: 'Due', render: (r) => <MoneyAmount amount={r.customerDue} size="sm" className={r.customerDue > 0 ? 'text-red-600' : ''} /> },
      { key: 'salePrice', label: 'Total', render: (r) => <MoneyAmount amount={r.salePrice} size="sm" /> },
    ] : []),
    { key: 'passengerCount', label: 'PAX' },
    { key: 'airline', label: 'Airline' },
    { key: 'departureDate', label: 'Flight Date', render: (r) => formatDate(r.departureDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} label={BOOKING_STATUS_LABELS[r.status]} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <RowActions items={[
          can('payments:customer') && r.customerDue > 0 && { type: 'link', label: 'Record payment', to: `/payments/customers?bookingId=${r.id}`, variant: 'muted' },
          { type: 'link', label: 'View', to: `/bookings/${r.id}` },
        ]} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Partial Payment History</h2>
        <p className="text-sm text-slate-500">Track bookings with partial or outstanding customer payments.</p>
      </div>

      {summary && !financeFields.hidden && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStatCard label="Partial Due" amount={summary.partialDue?.amount} count={summary.partialDue?.count} color="amber" />
          <SummaryStatCard label="Today Due" amount={summary.todayDue?.amount} count={summary.todayDue?.count} color="blue" />
          <SummaryStatCard label="Overdue" amount={summary.overdueDue?.amount} count={summary.overdueDue?.count} color="red" />
          <SummaryStatCard label="Total Outstanding" amount={summary.totalDue} color="teal" subtitle={`${summary.total} bookings in filter`} />
        </div>
      )}

      <div className="card p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab.key || 'all'}
              type="button"
              onClick={() => setPaymentTab(tab.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filters.paymentStatus === tab.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <input
            type="search"
            placeholder="Search booking #, PNR, customer..."
            className="input-field max-w-xs"
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
          />
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyMessage="No bookings match this filter" />
        {pagination && <div className="border-t border-slate-200 p-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>}
      </div>
    </div>
  );
}
