import { useEffect, useState } from 'react';
import PublicLayout from '../layouts/PublicLayout';
import PageHero from '../components/PageHero';
import { publicApi } from '../services/api';

export default function FAQPage() {
  const [page, setPage] = useState(null);
  const [notices, setNotices] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    Promise.all([
      publicApi.getCmsPage('faq').catch(() => null),
      publicApi.getNotices().catch(() => ({ data: { data: [] } })),
    ]).then(([pageRes, noticesRes]) => {
      if (pageRes) setPage(pageRes.data.data);
      setNotices(noticesRes?.data?.data || []);
    });
  }, []);

  const faqItems = notices.filter((n) => n.type === 'faq');
  const noticeItems = notices.filter((n) => n.type !== 'faq');

  const defaultFaqs = [
    { title: 'How do I book a ticket?', content: 'Submit the online booking form, call us, WhatsApp, or visit our Kanaighat office.' },
    { title: 'What payment methods do you accept?', content: 'We accept cash, bank transfer, bKash, and Nagad. Payment details will be shared when your fare is confirmed.' },
    { title: 'Can I change my travel date?', content: 'Yes, subject to airline rules and fare difference. Contact us as early as possible.' },
    { title: 'Do you issue tickets immediately?', content: 'After confirming fare and receiving payment, we purchase and deliver your ticket promptly.' },
  ];

  const faqs = faqItems.length ? faqItems : defaultFaqs;

  return (
    <PublicLayout title="FAQ & Notices" description="Frequently asked questions and notices from Show Terra Air">
      <PageHero title={page?.content?.heading || 'FAQ & Notices'} subtitle="Common questions and latest updates" />

      <section className="container-page py-16">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((item, i) => (
            <div key={item.id || i} className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-slate-900"
              >
                {item.title}
                <span className="text-slate-400">{openIndex === i ? '−' : '+'}</span>
              </button>
              {openIndex === i && (
                <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {noticeItems.length > 0 && (
          <div className="mt-16">
            <h2 className="section-title">Notices & Offers</h2>
            <div className="mt-8 space-y-4">
              {noticeItems.map((n) => (
                <div key={n.id} className="rounded-xl border border-brand-100 bg-brand-50 p-5">
                  <h3 className="font-semibold text-brand-900">{n.title}</h3>
                  <p className="mt-2 text-sm text-brand-800">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
