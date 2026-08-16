import { Link } from 'react-router-dom';
import { Plane, Users, Building2, FileText, BarChart2 } from 'lucide-react';
import { useBP } from '../../hooks/useBreakpoint';
import { usePermission } from '../../hooks/usePermission';
import { C, fontSans } from '../../theme/tokens';

const ACTIONS = [
  { label: '+ New Booking', to: '/bookings/new', color: C.teal, icon: <Plane size={12} style={{ transform: 'rotate(-45deg)' }} />, perm: 'bookings:create' },
  { label: '+ Add Client', to: '/customers', color: C.green, icon: <Users size={12} />, perm: 'customers:create' },
  { label: '+ Add Supplier', to: '/suppliers', color: C.blue, icon: <Building2 size={12} />, perm: 'suppliers:create' },
  { label: 'Statement', to: '/finance/ledger', color: C.violet, icon: <FileText size={12} />, perm: 'reports:view' },
  { label: 'Reports', to: '/reports', color: C.amber, icon: <BarChart2 size={12} />, perm: 'reports:view' },
];

export default function QuickActionBar() {
  const bp = useBP();
  const { can } = usePermission();
  const visible = ACTIONS.filter((a) => !a.perm || can(a.perm));

  if (!visible.length) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        overflowX: bp === 'mobile' ? 'auto' : 'visible',
        scrollbarWidth: 'none',
        flexWrap: bp === 'desktop' ? 'wrap' : 'nowrap',
      }}
    >
      {visible.map((b) => (
        <Link
          key={b.to + b.label}
          to={b.to}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 6,
            border: 'none',
            background: b.color,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
            textDecoration: 'none',
            ...fontSans,
          }}
        >
          {b.icon}{b.label}
        </Link>
      ))}
    </div>
  );
}
