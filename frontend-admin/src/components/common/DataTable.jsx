import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

const stickyHead = 'sticky right-0 z-20 bg-slate-50 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.15)]';
const stickyCell = 'sticky right-0 z-10 bg-white shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.12)] group-hover:bg-slate-50';

export default function DataTable({ columns, data, loading, emptyTitle, emptyDescription }) {
  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner className="mx-auto" />
      </div>
    );
  }

  if (!data?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${col.stickyRight ? stickyHead : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row) => (
            <tr key={row.id || row._id} className="group hover:bg-slate-50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm text-slate-700 ${col.stickyRight ? stickyCell : col.cellClassName || 'whitespace-nowrap'}`}
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
