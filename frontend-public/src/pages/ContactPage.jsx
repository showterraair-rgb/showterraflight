import { useEffect, useState } from 'react';
import PublicLayout from '../layouts/PublicLayout';
import PageHero from '../components/PageHero';
import { publicApi } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { getDisplayName, getPhoneDigits, getWhatsAppDigits } from '../utils/companyHelpers';

export default function ContactPage() {
  const { company } = useCompany();
  const [page, setPage] = useState(null);
  const wa = getWhatsAppDigits(company);
  const phone = getPhoneDigits(company);

  useEffect(() => {
    publicApi.getCmsPage('contact').then(({ data }) => setPage(data.data)).catch(() => {});
  }, []);

  return (
    <PublicLayout title="Contact" description="Contact Show Terra Air in Kanaighat, Sylhet">
      <PageHero
        title={page?.content?.heading || 'Contact Us'}
        subtitle={page?.content?.note || 'Visit our office or reach us by phone, email, or WhatsApp.'}
      />

      <section className="container-page py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">Office Address</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{company.address}</p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">Phone & Email</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Office Email: <a href={`mailto:${company.email}`} className="tap-link text-brand-600 hover:underline">{company.email}</a></li>
                <li>WhatsApp: <a href={`https://wa.me/88${wa}`} target="_blank" rel="noreferrer" className="tap-link text-brand-600 hover:underline">{company.whatsapp}</a></li>
                <li>Director: {company.directorName}</li>
                <li>
                  Director Phone:{' '}
                  <a
                    href={`tel:+88${phone}`}
                    className="tap-link text-brand-600 hover:underline"
                  >
                    {company.directorPhone}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-brand-50 p-8">
            <h3 className="text-xl font-bold text-brand-900">Business Hours</h3>
            <p className="mt-3 text-sm text-brand-800">
              Saturday – Thursday: 9:00 AM – 8:00 PM<br />
              Friday: 2:00 PM – 8:00 PM
            </p>
            <p className="mt-6 text-sm text-brand-700">
              For urgent ticket requests, message us on WhatsApp anytime and we will respond as soon as possible.
            </p>
            <a
              href={`https://wa.me/88${wa}?text=Hello%20Show%20Terra%20Air`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 inline-flex bg-green-600 hover:bg-green-700"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
