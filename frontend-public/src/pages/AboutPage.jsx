import { useEffect, useState } from 'react';
import PublicLayout from '../layouts/PublicLayout';
import PageHero from '../components/PageHero';
import { publicApi } from '../services/api';
import { useCompany } from '../context/CompanyContext';

export default function AboutPage() {
  const { company } = useCompany();
  const [page, setPage] = useState(null);

  useEffect(() => {
    publicApi.getCmsPage('about').then(({ data }) => setPage(data.data)).catch(() => {});
  }, []);

  const content = page?.content || {};

  return (
    <PublicLayout title="About Us" description={`About ${company.name} - Air ticket sales in Sylhet`}>
      <PageHero title={content.heading || 'About Us'} subtitle={company.name} />

      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-lg leading-relaxed text-slate-700">
            {content.body ||
              `${company.name} is a Sylhet-based air ticket sales company located at ${company.address}. Led by Director ${company.directorName}, we help travelers book domestic and international flights with honest pricing and dedicated follow-up.`}
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">Our Mission</h3>
              <p className="mt-2 text-sm text-slate-600">
                To provide reliable, affordable air ticket booking with transparent pricing and excellent customer care.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">Our Location</h3>
              <p className="mt-2 text-sm text-slate-600">{company.address}</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
