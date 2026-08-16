import { createContext, useContext, useEffect, useState } from 'react';

/** @typedef {'desktop' | 'tablet' | 'mobile'} BP */

export const BPCtx = createContext(/** @type {BP} */ ('desktop'));

export function useBP() {
  return useContext(BPCtx);
}

/**
 * Reference breakpoints: tablet ≤834px, mobile ≤480px.
 * @returns {BP}
 */
export function useBreakpointState() {
  const getBP = () => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth <= 480 ? 'mobile' : window.innerWidth <= 834 ? 'tablet' : 'desktop';
  };

  const [bp, setBp] = useState(getBP);

  useEffect(() => {
    const onResize = () => setBp(getBP());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}

export default useBreakpointState;
