import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

export function AnimatedCounter({ value, suffix = '', duration = 1.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (prefersReducedMotion) {
      setDisplay(value);
      return undefined;
    }

    const startTime = performance.now();
    const ms = duration * 1000;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / ms, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return undefined;
  }, [inView, value, duration, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <span ref={ref} className="tabular-nums">
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export function SectionReveal({ children, className = '', delay = 0 }) {
  const prefersReducedMotion = useReducedMotion();
  const cappedDelay = Math.min(delay, 0.2);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.45, delay: cappedDelay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, className = '', delay = 0 }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(delay, 0.15) }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default SectionReveal;
