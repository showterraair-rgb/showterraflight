import { useState } from 'react';
import { C } from '../../theme/tokens';

export default function IconBtn({ children, onClick, title, type = 'button' }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex h-8 w-8 items-center justify-center rounded-md border-0 text-sta-muted transition"
      style={{ background: hover ? C.bg : 'transparent', cursor: 'pointer' }}
    >
      {children}
    </button>
  );
}
