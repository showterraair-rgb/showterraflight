import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { accountsApi } from '../services/finance.api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatDateTime } from '../utils/date';
import { ACCOUNT_TYPE_LABELS } from '../utils/finance';

const TYPE_LABELS = {
  customer_payment: 'Customer Payment',
  supplier_payment: 'Supplier Payment',
  expense: 'Expense',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  opening_balance: 'Opening Balance',
  adjustment: 'Adjustment',
};

export default function AccountStatementPage() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const { data } = await accountsApi.statement(id, params);
      setAccount(data.account);
      setTransactions(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [id, page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDateTime(r.transactionDate) },
    { key: 'number', label: 'Txn #', render: (r) => <span className="font-mono text-xs">{r.transactionNumber}</span> },
    { key: 'type', label: 'Type', render: (r) => TYPE_LABELS[r.type] || r.type },
    { key: 'amount', label: 'Amount', render: (r) => {
      const isCredit = ['customer_payment', 'transfer_in', 'opening_balance'].includes(r.type) || (r.type === 'adjustment' && r.amount > 0);
      return <span className={isCredit ? 'text-green-700' : 'text-red-600'}>{isCredit ? '+' : '-'}{formatCurrency(r.amount)}</span>;
    }},
    { key: 'balance', label: 'Balance After', render: (r) => formatCurrency(r.balanceAfter) },
    { key: 'ref', label: 'Reference', render: (r) => r.referenceNumber || '—' },
    { key: 'notes', label: 'Notes', render: (r) => <span className="max-w-[200px] truncate block">{r.notes || '—'}</span> },
  ];

  if (!account && loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/accounts" className="text-sm text-brand-600 hover:underline">← Back to Accounts</Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          {ACCOUNT_TYPE_LABELS[account?.type] || account?.name} — Statement
        </h2>
        <p className="text-sm text-slate-500">Current balance: <strong>{formatCurrency(account?.currentBalance)}</strong></p>
      </div>

      <div className="card p-0">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <input type="date" className="input-field w-auto" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className="input-field w-auto" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>
        <DataTable columns={columns} data={transactions} loading={loading} emptyTitle="No transactions" emptyDescription="Transactions will appear here as payments and expenses are recorded." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
