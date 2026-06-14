import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import PageHero from '../components/PageHero';
import { publicApi } from '../services/api';

export default function ServicesPage() {
  const [page, setPage] = useState(null);

  useEffect(() => {
    publicApi.getCmsPage('services').then(({ data }) => setPage(data.data)).catch(() => {});
  }, []);

  const sections = page?.sections || [
    { title: 'Domestic Air Tickets', text: 'All major Bangladesh domestic routes.' },
    { title: 'International Air Tickets', text: 'Middle East, Asia, Europe and beyond.' },
    { title: 'Group Bookings', text: 'Umrah, Hajj groups and family travel.' },
    { title: 'Ticket Changes & Support', text: 'Date changes, cancellations and reissue assistance.' },
  ];

  return (
    <PublicLayout title="Services" description="Air ticket booking services by Show Terra Air">
      <PageHero title={page?.content?.heading || 'Our Services'} subtitle="Complete travel booking support" />

      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((item, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-slate-200 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                ✈
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/booking" className="btn-primary">Request a Ticket</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
