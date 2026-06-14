import { motion, useReducedMotion } from 'framer-motion';
import { STATS, WORLD_DESTINATIONS } from '../../data/homeContent';
import { useHomeContent } from '../../context/HomeContentContext';
import { AnimatedCounter, SectionReveal } from './motion';

const ORIGIN = { x: 62, y: 48, label: 'Bangladesh' };

function RouteLine({ dest, index }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <motion.line
        x1={ORIGIN.x}
        y1={ORIGIN.y}
        x2={dest.x}
        y2={dest.y}
        stroke="url(#routeGlow)"
        strokeWidth="0.9"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: prefersReducedMotion ? 0.35 : 0.5 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.05 }}
      />
      <motion.line
        x1={ORIGIN.x}
        y1={ORIGIN.y}
        x2={dest.x}
        y2={dest.y}
        stroke="url(#routeGradient)"
        strokeWidth="0.45"
        strokeDasharray="1.8 1.2"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: prefersReducedMotion ? 0.6 : 0.95 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 + index * 0.05 }}
      />
    </>
  );
}

function DestinationNode({ dest }) {
  const label = dest.short || dest.label;
  const labelWidth = Math.max(6, label.length * 1.8);

  return (
    <g>
      <circle cx={dest.x} cy={dest.y} r="3.2" fill="#38bdf8" opacity="0.12" />
      <circle cx={dest.x} cy={dest.y} r="1.4" fill="#38bdf8" />
      <rect
        x={dest.x - labelWidth / 2}
        y={dest.y - 5.8}
        width={labelWidth}
        height="3.4"
        rx="1"
        fill="#0f172a"
        opacity="0.85"
      />
      <text
        x={dest.x}
        y={dest.y - 3.5}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="2.5"
        fontWeight="600"
      >
        {label}
      </text>
    </g>
  );
}

export default function BangladeshToWorldSection() {
  const section = useHomeContent('worldMap');
  const destinations = section?.destinations || WORLD_DESTINATIONS;
  const stats = section?.stats || STATS;
  const prefersReducedMotion = useReducedMotion();

  if (section?.visible === false) return null;

  return (
    <section className="relative overflow-hidden bg-brand-950 section-spacing text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,_rgba(251,191,36,0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,_rgba(56,189,248,0.1),_transparent_45%)]" />

      <div className="container-page relative">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <SectionReveal>
            <p className="section-eyebrow text-sky-400">{section?.eyebrow || 'From Sylhet to the world'}</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-[2.75rem]">
              {section?.title || 'From Kanaighat to Jeddah, Dubai, Kuala Lumpur & beyond'}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 md:text-lg">
              {section?.subtitle ||
                'We book daily routes for Sylhet and Dhaka travelers — air tickets, Umrah groups, and holiday packages with visa filing and consultants who know Bangladeshi document requirements.'}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-block">
                  <p className="text-2xl font-bold text-accent-400 sm:text-3xl md:text-4xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-brand-900/60 p-3 shadow-2xl backdrop-blur-sm sm:p-5 md:rounded-3xl md:p-6">
              <svg
                viewBox="0 0 100 60"
                className="h-auto w-full min-h-[200px] sm:min-h-[240px]"
                role="img"
                aria-label="Stylized map showing travel routes from Bangladesh to international destinations"
              >
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                  </linearGradient>
                  <radialGradient id="originGlow">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <ellipse cx="50" cy="32" rx="45" ry="26" fill="#1e3a5f" opacity="0.45" />
                <ellipse cx="25" cy="28" rx="18" ry="14" fill="#1e4976" opacity="0.35" />
                <ellipse cx="72" cy="35" rx="20" ry="16" fill="#1e4976" opacity="0.35" />

                {destinations.map((dest, i) => (
                  <RouteLine key={`line-${dest.id}`} dest={dest} index={i} />
                ))}

                {destinations.map((dest) => (
                  <DestinationNode key={`node-${dest.id}`} dest={dest} />
                ))}

                <g>
                  <circle cx={ORIGIN.x} cy={ORIGIN.y} r="7" fill="url(#originGlow)" />
                  <circle cx={ORIGIN.x} cy={ORIGIN.y} r="2.2" fill="#fbbf24" />
                  <rect x={ORIGIN.x - 10} y={ORIGIN.y + 2.5} width="20" height="3.5" rx="1" fill="#0f172a" opacity="0.8" />
                  <text x={ORIGIN.x} y={ORIGIN.y + 4.8} textAnchor="middle" fill="#fcd34d" fontSize="3" fontWeight="700">
                    {ORIGIN.label}
                  </text>
                </g>

                {!prefersReducedMotion && (
                  <motion.circle
                    r="0.9"
                    fill="#ffffff"
                    animate={{
                      cx: [ORIGIN.x, destinations[0]?.x ?? ORIGIN.x, ORIGIN.x],
                      cy: [ORIGIN.y, destinations[0]?.y ?? ORIGIN.y, ORIGIN.y],
                    }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </svg>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:hidden">
                {destinations.map((d) => (
                  <span
                    key={d.id}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-300"
                  >
                    {d.label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-slate-500 sm:mt-3 sm:text-sm">
                Daily routes to Saudi Arabia, UAE, Malaysia, Singapore, Thailand, Turkey, UK & Canada
              </p>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
