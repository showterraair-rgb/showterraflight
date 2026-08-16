import { useEffect } from 'react';
import { X } from 'lucide-react';
import { C, fontDisplay } from '../../theme/tokens';

export default function Modal({ open, onClose, title, children, wide, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(20,33,61,0.45)' }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        style={{
          background: C.surface,
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(20,33,61,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4"
          style={{ background: C.indigo, borderBottom: `1px solid ${C.indigo700}` }}
        >
          <h2 className="text-base font-bold text-white" style={fontDisplay}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8FA3BF] hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>

        {footer && (
          <div
            className="shrink-0 px-5 py-4"
            style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
