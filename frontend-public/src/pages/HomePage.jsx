import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { publicApi } from '../services/api';
import { useCompany } from '../context/CompanyContext';

export default function HomePage() {
  const { company } = useCompany();
  const [page, setPage] = useState(null);

  useEffect(() => {
    publicApi.getCmsPage('home').then(({ data }) => setPage(data.data)).catch(() => {});
  }, []);

  const content = page?.content || {};

  return (
    <PublicLayout
      title="Home"
      description="Show Terra Air - Trusted air ticket booking in Kanaighat, Sylhet, Bangladesh"
    >
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="container-page py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-200">
            Sylhet, Bangladesh
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            {content.heroTitle || 'Your Trusted Air Ticket Partner in Sylhet'}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-100">
            {content.heroSubtitle ||
              'Domestic and international air tickets with personal service from our Kanaighat office.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/booking" className="btn-primary bg-white text-brand-700 hover:bg-brand-50">
              Request a Ticket
            </Link>
            <a
              href={`https://wa.me/88${company.whatsapp?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline border-white text-white hover:bg-white/10"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="section-title text-center">Why Choose {company.name}?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {(page?.sections || [
            { title: 'Best Fare Options', text: 'Competitive fares across airlines.' },
            { title: 'Personal Support', text: 'Direct phone and WhatsApp assistance.' },
            { title: 'Local Office', text: 'Walk-in service at Gasbari Bazar, Kanaighat.' },
          ]).map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page text-center">
          <h2 className="section-title">Ready to Travel?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Submit a booking request online or visit our office. Our team will find the best fare for you.
          </p>
          <Link to="/booking" className="btn-primary mt-8">
            Book Now
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
