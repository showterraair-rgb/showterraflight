import { Link } from 'react-router-dom';

const styles = {
  link: 'text-xs font-medium text-brand-600 hover:underline',
  linkMuted: 'text-xs font-medium text-slate-600 hover:underline',
  danger: 'text-xs font-medium text-red-600 hover:underline',
  button: 'text-xs font-medium text-slate-600 hover:underline bg-transparent border-0 p-0 cursor-pointer',
};

/**
 * Compact row action links/buttons for admin tables.
 * items: { type: 'link'|'button', label, to?, onClick?, variant?: 'default'|'danger'|'muted' }
 */
export default function RowActions({ items = [] }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;

  return (
    <div className="flex min-w-[12rem] flex-wrap items-center gap-x-3 gap-y-1">
      {visible.map((item) => {
        const className = styles[item.variant === 'danger' ? 'danger' : item.variant === 'muted' ? 'linkMuted' : item.type === 'button' ? 'button' : 'link'];
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
