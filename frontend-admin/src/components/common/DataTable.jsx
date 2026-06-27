import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

const stickyHead = 'sticky right-0 z-20 bg-slate-50 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.15)] dark:bg-slate-800 dark:shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.35)]';
const stickyCell = 'sticky right-0 z-10 bg-white shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.12)] group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800 dark:shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.3)]';

export default function DataTable({
  columns,
  data,
  rows,
  loading,
  dense = true,
  emptyTitle,
  emptyDescription,
  emptyMessage,
}) {
  const items = data ?? rows ?? [];
  const emptyLabel = emptyTitle || emptyMessage || 'No records';
  const cellPad = dense ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm';
  const headPad = dense ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-xs';

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner className="mx-auto" />
      </div>
    );
  }

  if (!items.length) {
    return <EmptyState title={emptyLabel} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-default">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800/80">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${headPad} text-left font-semibold uppercase tracking-wide text-muted ${col.stickyRight ? stickyHead : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-surface-raised dark:divide-slate-800">
          {items.map((row, rowIndex) => (
            <tr key={row.id || row._id || rowIndex} className="group hover:bg-slate-50 dark:hover:bg-slate-800/60">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${cellPad} tabular-nums text-slate-700 dark:text-slate-200 ${col.stickyRight ? stickyCell : col.cellClassName || 'whitespace-nowrap'}`}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
