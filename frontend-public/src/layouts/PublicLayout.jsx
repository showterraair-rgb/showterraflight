import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { useScrollToHash } from '../hooks/useScrollToSection';
import { BRAND_NAME } from '../data/homeContent';

export default function PublicLayout({ children, title, description }) {
  useScrollToHash();

  const pageTitle = title
    ? `${title} | ${BRAND_NAME}`
    : `${BRAND_NAME} — Air Tickets, Visa & Tour Packages from Bangladesh`;

  const defaultDescription =
    description ||
    'Premium air ticket booking, visa processing, Umrah packages, and holiday tours from Sylhet, Bangladesh. Book with Show Terra Flight today.';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={defaultDescription} />
      </Helmet>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden">{children}</main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}
