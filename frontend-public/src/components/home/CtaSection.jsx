import { Link } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { SectionReveal } from './motion';
import { getPhoneDigits, getWhatsAppDigits } from '../../utils/companyHelpers';
import PaymentStrip from './PaymentStrip';

function CtaLink({ text, link, wa, phone, className }) {
  if (!text) return null;
  let href = link || '#';
  if (link === 'whatsapp') href = `https://wa.me/88${wa}?text=Hello%20Show%20Terra%20Flight,%20I%20want%20to%20book%20a%20trip.`;
  if (link === 'tel') href = `tel:+88${phone}`;

  if (link?.startsWith('/') && !link.includes('#')) {
    return (
      <Link to={link} className={className}>
        {text}
      </Link>
    );
  }

  const isExternal = href.startsWith('http') || href.startsWith('tel');
  return (
    <a href={href} className={className} {...(isExternal && link === 'whatsapp' ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {text}
    </a>
  );
}

export default function CtaSection() {
  const { company } = useCompany();
  const section = useHomeContent('cta');
  const wa = getWhatsAppDigits(company);
  const phone = getPhoneDigits(company);

  if (section?.visible === false) return null;

  return (
    <section className="section-spacing pt-0 md:pt-4">
      <div className="container-page">
        <SectionReveal>
          <div className="card-interactive relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-12 text-center md:rounded-3xl md:px-14 md:py-16">
            <div className="absolute inset-0 opacity-10" aria-hidden>
              <SafeImage
                src={section?.image}
                fallbackKey="sky"
                alt=""
                className="h-full w-full object-cover"
                containerClassName="h-full w-full"
                aspectClass="h-full w-full"
              />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-300">{section?.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold text-white md:text-4xl">{section?.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-brand-100 md:text-lg">{section?.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                <CtaLink
                  text={section?.primaryCtaText}
                  link={section?.primaryCtaLink}
                  wa={wa}
                  phone={phone}
                  className="btn-whatsapp btn-lift w-full sm:w-auto"
                />
                <CtaLink
                  text={section?.secondaryCtaText}
                  link={section?.secondaryCtaLink}
                  wa={wa}
                  phone={phone}
                  className="btn-outline-light btn-lift w-full sm:w-auto"
                />
                <CtaLink
                  text={section?.tertiaryCtaText}
                  link={section?.tertiaryCtaLink}
                  wa={wa}
                  phone={phone}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto"
                />
              </div>
              <div className="mx-auto mt-8 max-w-lg rounded-xl border border-white/15 bg-white/5 p-4">
                <PaymentStrip variant="dark" />
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
