export default function EmptyState({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-default bg-slate-50 px-6 py-12 text-center dark:bg-slate-900/50">
      {icon && <div className="mb-3 text-3xl text-slate-400 dark:text-slate-500">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
    </div>
  );
}
