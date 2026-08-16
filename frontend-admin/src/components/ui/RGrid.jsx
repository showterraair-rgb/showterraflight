import { useBP } from '../../hooks/useBreakpoint';

export default function RGrid({ cols = 4, children, gap = 12 }) {
  const bp = useBP();
  const effectiveCols = bp === 'mobile' ? 1 : bp === 'tablet' ? Math.min(cols, 2) : cols;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${effectiveCols}, 1fr)`,
        gap,
      }}
    >
      {children}
    </div>
  );
}
