import { Link } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

const CARDS = [
  {
    title: 'Bank List',
    description: 'Manage bank accounts for transfers and settlements.',
    path: '/settings/payment/banks',
    accent: 'border-blue-200 bg-blue-50',
  },
  {
    title: 'MFS List',
    description: 'bKash, Nagad, and other mobile wallet accounts.',
    path: '/settings/payment/mfs',
    accent: 'border-emerald-200 bg-emerald-50',
  },
  {
    title: 'All Payment Accounts',
    description: 'Cash, bank, and MFS accounts in one view.',
    path: '/settings/payment-accounts',
    accent: 'border-slate-200 bg-slate-50',
  },
];

export default function PaymentSettingsHubPage() {
  const { can } = usePermission();

  if (!can('accounts:view')) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You do not have permission to view payment accounts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Payment Settings</h2>
        <p className="text-sm text-slate-500">Bank and MFS account management</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className={`rounded-xl border p-5 transition hover:shadow-md ${card.accent}`}
          >
            <h3 className="font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
