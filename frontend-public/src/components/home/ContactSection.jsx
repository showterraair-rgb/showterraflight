import { useHomeContent } from '../../context/HomeContentContext';
import { SectionReveal } from './motion';
import { useCompany } from '../../context/CompanyContext';
import PaymentStrip from './PaymentStrip';
import { getPhoneDigits, getWhatsAppDigits } from '../../utils/companyHelpers';

export default function ContactSection() {
  const { company } = useCompany();
  const section = useHomeContent('contact');
  const wa = getWhatsAppDigits(company);
  const phone = getPhoneDigits(company);

  if (section?.visible === false) return null;

  return (
    <section id="contact" className="bg-slate-50 section-spacing">
      <div className="container-page">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">{section?.eyebrow}</p>
          <h2 className="section-title mt-2">{section?.title}</h2>
          <p className="section-lead">{section?.subtitle}</p>
        </SectionReveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
          <SectionReveal>
            <div className="card-interactive h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{section?.officeTitle}</p>
              <h3 className="mt-2 font-bold text-slate-900">{section?.officeHeading}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{company.address}</p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.06}>
            <div className="card-interactive h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{section?.directLineTitle}</p>
              <h3 className="mt-2 font-bold text-slate-900">{section?.directLineHeading}</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li>
                  <a href={`tel:+88${phone}`} className="tap-link font-medium text-slate-700 hover:text-brand-600">
                    {company.directorPhone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${company.email}`} className="tap-link break-all font-medium text-slate-700 hover:text-brand-600">
                    {company.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/88${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="tap-link font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    WhatsApp: {company.whatsapp}
                  </a>
                </li>
              </ul>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.12}>
            <div className="card-interactive flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{section?.nextStepTitle}</p>
              <h3 className="mt-2 font-bold text-slate-900">{section?.nextStepHeading}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{section?.nextStepBody}</p>
              <div className="mt-5 space-y-3">
                <PaymentStrip variant="light" />
                <a href={`https://wa.me/88${wa}`} target="_blank" rel="noreferrer" className="btn-whatsapp btn-lift w-full justify-center">
                  {section?.whatsappButtonText}
                </a>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
