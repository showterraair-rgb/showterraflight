import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gatewayApi } from '../services/finance.api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MoneyAmount from '../components/common/MoneyAmount';

const STATUS_COPY = {
  success: { title: 'Payment Successful', tone: 'text-green-700 bg-green-50 border-green-200' },
  failed: { title: 'Payment Failed', tone: 'text-red-700 bg-red-50 border-red-200' },
  cancelled: { title: 'Payment Cancelled', tone: 'text-amber-800 bg-amber-50 border-amber-200' },
};

export default function GatewayResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'failed';
  const tranId = searchParams.get('tran_id');
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(Boolean(tranId));

  useEffect(() => {
    if (!tranId) {
      setLoading(false);
      return;
    }
    gatewayApi.getTransaction(tranId)
      .then(({ data }) => setTxn(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tranId]);

  const copy = STATUS_COPY[status] || STATUS_COPY.failed;

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className={`rounded-xl border px-6 py-8 text-center ${copy.tone}`}>
        <h2 className="text-xl font-bold">{copy.title}</h2>
        {tranId && <p className="mt-2 font-mono text-sm">Transaction: {tranId}</p>}
        {txn && (
          <div className="mt-4 space-y-1 text-sm">
            <p>Customer: {txn.customerName}</p>
            {txn.bookingNumber && <p>Booking: {txn.bookingNumber}</p>}
            <MoneyAmount amount={txn.amount} size="lg" className="mt-2 justify-center font-semibold" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/payments/history" className="btn-secondary">Payment History</Link>
        {txn?.booking && <Link to={`/bookings/${txn.booking}`} className="btn-primary">View Booking</Link>}
        {!txn?.booking && <Link to="/payments/customers" className="btn-primary">Customer Payments</Link>}
      </div>
    </div>
  );
}
