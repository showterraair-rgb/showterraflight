import { C, fontSans } from '../../theme/tokens';

export default function SectionHead({ title, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-4 w-0.5 rounded-sm" style={{ background: C.teal }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: C.indigo, ...fontSans }}
        >
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}
