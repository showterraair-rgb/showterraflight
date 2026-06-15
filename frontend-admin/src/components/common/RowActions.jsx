import { Link } from 'react-router-dom';

const variants = {
  default: 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100',
  muted: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
};

const base = 'inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors';

/**
 * Visible row action buttons for admin tables.
 */
export default function RowActions({ items = [] }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;

  return (
    <div className="flex min-w-[11rem] flex-wrap items-center gap-1.5">
      {visible.map((item) => {
        const variant = item.variant || 'default';
        const className = `${base} ${variants[variant] || variants.default}`;

        if (item.type === 'link' && item.to) {
          return (
            <Link key={item.label} to={item.to} className={className}>
              {item.label}
            </Link>
          );
        }

        return (
          <button key={item.label} type="button" className={className} onClick={item.onClick}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
