import { Link } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useHomeContent } from '../context/HomeContentContext';
import PaymentStrip from './home/PaymentStrip';
import { getDisplayName, getPhoneDigits, getWhatsAppDigits } from '../utils/companyHelpers';

function resolveHref(href) {
  if (!href) return '#';
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  if (href.startsWith('/#')) return href;
  if (href.startsWith('/')) return href;
  return href;
}

function FooterLink({ item }) {
  const href = resolveHref(item.href);
  const className = 'tap-link block rounded-md py-2 pr-2 transition hover:text-white';

  if (href.startsWith('/') && !href.includes('#')) {
    return (
      <Link to={href} className={className}>
        {item.label}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {item.label}
    </a>
  );
}

export default function Footer() {
  const { company, socialLinks = {}, paymentDetails = {} } = useCompany();
  const footer = useHomeContent('footer');
  const services = useHomeContent('services')?.items || [];
  const wa = getWhatsAppDigits(company);
  const displayName = getDisplayName(company);

  if (footer?.visible === false) return null;

  const exploreLinks = (footer?.exploreLinks || []).filter((l) => l.visible !== false);
  const tagline = footer?.tagline || '';
  const supportNote = footer?.supportNote || '';
  const ctaText = footer?.ctaText || 'Book Your Ticket';
  const ctaLink = footer?.ctaLink || '/booking';
  const exploreTitle = footer?.exploreTitle || 'Explore';
  const servicesTitle = footer?.servicesTitle || 'Services';
  const contactTitle = footer?.contactTitle || 'Contact';
  const copyrightText = footer?.copyrightText || 'All rights reserved.';
  const legalText = footer?.legalText || '';
  const locationLine = footer?.locationLine || 'Gasbari Bazar, Kanaighat, Sylhet, Bangladesh';

  return (
    <footer id="footer" className="border-t border-slate-800 bg-brand-950 text-slate-400">
      <div className="container-page py-12 md:py-16 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
          <div className="sm:col-span-2 lg:col-span-4 lg:pr-4">
            <h3 className="text-xl font-bold tracking-tight text-white md:text-2xl">{displayName}</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{company.address}</p>
            {tagline && <p className="mt-4 text-sm leading-relaxed text-slate-300">{tagline}</p>}
            <Link to={ctaLink} className="btn-accent btn-lift mt-6 inline-flex w-full justify-center text-sm sm:w-auto">
              {ctaText}
            </Link>
            {supportNote && (
              <p className="mt-5 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
                {supportNote}
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            <h4 className="border-b border-slate-800 pb-2.5 text-xs font-bold uppercase tracking-wider text-white">
              {exploreTitle}
            </h4>
            <ul className="mt-4 space-y-1 text-sm">
              {exploreLinks.map((item) => (
                <li key={item.id || item.href}>
                  <FooterLink item={item} />
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="border-b border-slate-800 pb-2.5 text-xs font-bold uppercase tracking-wider text-white">
              {servicesTitle}
            </h4>
            <ul className="mt-4 space-y-1 text-sm">
              {services.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link to="/services" className="block rounded-md py-2 pr-2 transition hover:text-white">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="border-b border-slate-800 pb-2.5 text-xs font-bold uppercase tracking-wider text-white">
              {contactTitle}
            </h4>
            <ul className="mt-4 space-y-4 text-sm">
              <li>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</span>
                <a href={`mailto:${company.email}`} className="tap-link mt-1 inline-block break-all font-medium text-slate-200 hover:text-white">
                  {company.email}
                </a>
              </li>
              <li>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">WhatsApp</span>
                <a
                  href={`https://wa.me/88${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tap-link mt-1 inline-block font-medium text-emerald-400 hover:text-emerald-300"
                >
                  {company.whatsapp}
                </a>
              </li>
              <li>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Phone</span>
                <a href={`tel:+88${getPhoneDigits(company)}`} className="tap-link mt-1 inline-block font-medium text-slate-200 hover:text-white">
                  {company.directorPhone}
                </a>
              </li>
              <li>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Director</span>
                <span className="mt-1 block text-slate-300">{company.directorName}</span>
              </li>
              {(paymentDetails?.bkashNumber || paymentDetails?.nagadNumber) && (
                <li>
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mobile banking</span>
                  <p className="mt-1 text-slate-300">
                    {paymentDetails.bkashNumber && <>bKash: {paymentDetails.bkashNumber}</>}
                    {paymentDetails.bkashNumber && paymentDetails.nagadNumber && <br />}
                    {paymentDetails.nagadNumber && <>Nagad: {paymentDetails.nagadNumber}</>}
                  </p>
                </li>
              )}
            </ul>
            {(socialLinks?.facebook || socialLinks?.instagram || socialLinks?.youtube || socialLinks?.linkedin) && (
              <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-800 pt-5 text-sm">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="tap-link hover:text-white">
                    Facebook
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="tap-link hover:text-white">
                    Instagram
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="tap-link hover:text-white">
                    YouTube
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="tap-link hover:text-white">
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {footer.showPaymentStrip !== false && (
          <div className="mt-12 border-t border-slate-800 pt-8 md:mt-14">
            <PaymentStrip variant="dark" className="gap-4 md:gap-6" />
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 py-5 md:py-6">
        <p className="container-page px-4 text-center text-xs leading-relaxed text-slate-500">
          © {new Date().getFullYear()} {displayName}. {copyrightText}
          {locationLine && (
            <span className="mt-2 block sm:mt-0 sm:inline sm:before:mx-2 sm:before:content-['·']">
              {locationLine}
            </span>
          )}
          {legalText && (
            <span className="mt-2 block text-[11px] sm:mt-1">{legalText}</span>
          )}
        </p>
      </div>
    </footer>
  );
}
