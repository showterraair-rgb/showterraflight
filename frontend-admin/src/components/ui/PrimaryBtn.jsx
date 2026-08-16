import { useState } from 'react';
import { C, fontSans } from '../../theme/tokens';

export default function PrimaryBtn({ label, icon, onClick, type = 'button', disabled = false, children }) {
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      className="inline-flex items-center gap-1.5 rounded-md border-0 px-[18px] py-2.5 text-[13px] font-medium text-white disabled:opacity-60"
      style={{
        background: down ? C.indigo700 : hover ? '#1d2f52' : C.indigo,
        boxShadow: '0 1px 2px rgba(20,33,61,0.18)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...fontSans,
      }}
    >
      {icon}{label ?? children}
    </button>
  );
}
