import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { SectionReveal } from './motion';
import { useCompany } from '../../context/CompanyContext';
import { getPhoneDigits, getWhatsAppDigits } from '../../utils/companyHelpers';

export default function TeamSection() {
  const { company } = useCompany();
  const section = useHomeContent('team');
  const team = section?.items || [];
  const wa = getWhatsAppDigits(company);
  const phone = getPhoneDigits(company);

  if (section?.visible === false) return null;

  return (
    <section id="team" className="section-spacing">
      <div className="container-page">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">{section?.eyebrow || 'Our team'}</p>
          <h2 className="section-title mt-2">{section?.title}</h2>
          <p className="section-lead">{section?.subtitle}</p>
        </SectionReveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:mt-14">
          {team.map((member, i) => (
            <SectionReveal key={member.id} delay={i < 2 ? i * 0.06 : 0}>
              <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm card-hover-lift">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <SafeImage
                    src={member.image}
                    fallbackKey="person"
                    alt={member.name}
                    width={400}
                    height={500}
                    className="transition-transform duration-500 group-hover:scale-[1.03]"
                    containerClassName="h-full w-full"
                    aspectClass="h-full w-full"
                    showLabelOnFallback
                    label={member.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/20 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-800 shadow-sm">
                    Kanaighat office
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <span className="inline-block rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                      {member.role}
                    </span>
                    <h3 className="mt-2 text-lg font-bold">{member.name}</h3>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <p className="text-sm leading-relaxed text-slate-600">{member.bio}</p>
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`https://wa.me/88${wa}?text=Hello%20${encodeURIComponent(member.name)},%20I%20need%20travel%20assistance.`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-contact flex-1 !text-emerald-700 hover:!border-emerald-200 hover:!bg-emerald-50"
                    >
                      WhatsApp
                    </a>
                    <a href={`tel:+88${phone}`} className="btn-contact flex-1">Call</a>
                  </div>
                </div>
              </article>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
