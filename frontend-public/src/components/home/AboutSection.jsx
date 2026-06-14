import { Link } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { SectionReveal } from './motion';
import { getDisplayName } from '../../utils/companyHelpers';

export default function AboutSection() {
  const { company } = useCompany();
  const section = useHomeContent('about');
  const name = getDisplayName(company);

  if (section?.visible === false) return null;

  return (
    <section id="about" className="section-spacing">
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
              <SafeImage
                src={section?.image}
                fallbackKey="office"
                alt={section?.imageCaption || 'Travel office'}
                width={800}
                height={600}
                containerClassName="w-full"
                aspectClass="aspect-[4/3] w-full"
                showLabelOnFallback
                label={section?.imageCaption}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white md:bottom-6 md:left-6">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-300">{section?.imageLocation || 'Kanaighat, Sylhet'}</p>
                <p className="mt-1 text-lg font-bold md:text-xl">{section?.imageCaption || 'Your local international travel desk'}</p>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.08}>
            <p className="section-eyebrow">{section?.eyebrow || 'About us'}</p>
            <h2 className="section-title mt-2">{section?.title || 'A Sylhet travel agency with nationwide reach'}</h2>
            <p className="section-lead">
              {section?.lead || `${name} is a full-service travel desk at Gasbari Bazar, Kanaighat.`}
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{section?.body}</p>
            <Link to="/about" className="btn-outline mt-8 inline-flex">Our full story</Link>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
