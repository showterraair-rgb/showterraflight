function emptySection(type = 'block') {
  return { type, title: '', text: '' };
}

export default function PageSectionsEditor({ sections = [], onChange, disabled = false, sectionType = 'block', addLabel = 'Add section' }) {
  const items = Array.isArray(sections) ? sections : [];

  const updateAt = (index, patch) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeAt = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index, dir) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((section, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Section {index + 1}</span>
            {!disabled && (
              <div className="flex gap-2">
                <button type="button" className="text-xs text-slate-600 hover:underline" onClick={() => move(index, -1)} disabled={index === 0}>↑</button>
                <button type="button" className="text-xs text-slate-600 hover:underline" onClick={() => move(index, 1)} disabled={index === items.length - 1}>↓</button>
                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => removeAt(index)}>Remove</button>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <input
              className="input-field"
              placeholder="Title"
              value={section.title || ''}
              disabled={disabled}
              onChange={(e) => updateAt(index, { title: e.target.value })}
            />
            <textarea
              className="input-field"
              rows={3}
              placeholder="Text / answer"
              value={section.text || ''}
              disabled={disabled}
              onChange={(e) => updateAt(index, { text: e.target.value })}
            />
          </div>
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => onChange([...items, emptySection(sectionType)])}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}
