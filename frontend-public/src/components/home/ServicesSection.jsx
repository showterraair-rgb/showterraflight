import { Link } from 'react-router-dom';
import { BRAND_NAME } from '../../data/homeContent';
import { useHomeContent } from '../../context/HomeContentContext';
import { SectionReveal } from './motion';
import ServiceIcon from './ServiceIcon';
import { getSupportText } from '../../utils/companyHelpers';

export default function ServicesSection() {
  const section = useHomeContent('services');
  const items = section?.items || [];

  if (section?.visible === false) return null;

  return (
    <section id="services" className="section-spacing">
      <div className="container-page">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">{section?.eyebrow || 'Our services'}</p>
          <h2 className="section-title mt-2">{section?.title || 'Everything you need to travel abroad'}</h2>
          <p className="section-lead">
            {section?.subtitle || `${BRAND_NAME} handles tickets, visas, hotels, Umrah, and corporate travel from one trusted Sylhet desk.`}
          </p>
        </SectionReveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:mt-14 lg:grid-cols-3">
          {items.map((service, i) => (
            <SectionReveal key={service.id} delay={i < 3 ? i * 0.05 : 0}>
              <article className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm card-hover-lift">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <ServiceIcon name={service.icon} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{service.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{service.description}</p>
                <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition group-hover:gap-2">
                  Learn more <span aria-hidden>→</span>
                </Link>
              </article>
            </SectionReveal>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          {getSupportText('booking', 'We confirm seat availability and total BDT price before you pay')} Walk in at
          Gasbari Bazar or message us on WhatsApp to get started.
        </p>
      </div>
    </section>
  );
}
