import { C, fontSans } from '../../theme/tokens';

/** Map live status keys → reference badge colors */
const STATUS_CFG = {
  // Booking / ops
  ticket_issued: { bg: C.blueLight, color: C.blue },
  Ticketed: { bg: C.blueLight, color: C.blue },
  confirmed: { bg: C.greenLight, color: C.green },
  Confirmed: { bg: C.greenLight, color: C.green },
  draft: { bg: '#F3F4F6', color: C.muted },
  delivered: { bg: C.tealLight, color: C.teal },
  completed: { bg: C.greenLight, color: C.green },
  cancelled: { bg: '#F3F4F6', color: C.muted },
  Cancelled: { bg: '#F3F4F6', color: C.muted },
  voided: { bg: C.redLight, color: C.red },
  Void: { bg: C.redLight, color: C.red },
  refunded: { bg: C.violetLight, color: C.violet },
  Refund: { bg: C.violetLight, color: C.violet },
  reissued: { bg: C.tealLight, color: C.teal },
  Reissue: { bg: C.tealLight, color: C.teal },
  // Payments
  paid: { bg: C.greenLight, color: C.green },
  success: { bg: C.greenLight, color: C.green },
  partial: { bg: C.amberLight, color: '#B47425' },
  Partial: { bg: C.amberLight, color: '#B47425' },
  unpaid: { bg: C.redLight, color: C.red },
  pending: { bg: C.amberLight, color: '#B47425' },
  failed: { bg: C.redLight, color: C.red },
  active: { bg: C.greenLight, color: C.green },
  inactive: { bg: '#F3F4F6', color: C.muted },
  // Approval
  checking: { bg: C.blueLight, color: C.blue },
  processing: { bg: C.amberLight, color: '#B47425' },
  approved: { bg: C.greenLight, color: C.green },
  // Channels
  sms: { bg: C.blueLight, color: C.blue },
  email: { bg: C.violetLight, color: C.violet },
  whatsapp: { bg: C.greenLight, color: C.green },
};

export default function StatusBadge({ status, label }) {
  const text = label || status?.replace(/_/g, ' ') || '—';
  const cfg = STATUS_CFG[status] || { bg: '#F3F4F6', color: C.muted };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...fontSans,
      }}
    >
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.color }} />
      {text}
    </span>
  );
}
