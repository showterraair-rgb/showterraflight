import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { BRAND_NAME, NAV_SECTIONS } from '../data/homeContent';
import { useSectionLink } from '../hooks/useScrollToSection';
import { getDisplayName } from '../utils/companyHelpers';

export default function Header() {
  const { company, logo } = useCompany();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const goToSection = useSectionLink();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const displayName = getDisplayName(company);

  const handleNav = (id) => {
    setMenuOpen(false);
    goToSection(id);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md'
          : isHome
            ? 'bg-transparent'
            : 'border-b border-slate-200 bg-white/95 backdrop-blur'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between md:h-[4.25rem]">
        <Link to="/" className="flex items-center gap-3">
          {logo?.url ? (
            <img src={logo.url} alt={logo.altText || displayName} className="h-10 w-auto" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white shadow-md">
              STF
            </div>
          )}
          <span
            className={`text-lg font-bold tracking-tight ${
              scrolled || !isHome ? 'text-slate-900' : 'text-white'
            }`}
          >
            {displayName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                scrolled || !isHome
                  ? 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <Link
            to="/live"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              scrolled || !isHome
                ? 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            Live
          </Link>
          <Link to="/booking" className="btn-accent ml-2 !px-4 !py-2.5 !text-sm">
            Book Your Ticket
          </Link>
        </nav>

        <button
          type="button"
          className={`flex h-11 w-11 items-center justify-center rounded-lg lg:hidden ${scrolled || !isHome ? 'text-slate-800' : 'text-white'}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="container-page space-y-1 py-4">
              {NAV_SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-brand-50"
                >
                  {item.label}
                </button>
              ))}
              <Link
                to="/live"
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-brand-50"
              >
                Live
              </Link>
              <Link
                to="/booking"
                onClick={() => setMenuOpen(false)}
                className="btn-accent mt-3 block w-full text-center"
              >
                Book Your Ticket
              </Link>
              <p className="mt-3 px-3 text-center text-xs text-slate-500">
                Pay by bank, bKash, or Nagad · Quotes in BDT before you pay
              </p>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
