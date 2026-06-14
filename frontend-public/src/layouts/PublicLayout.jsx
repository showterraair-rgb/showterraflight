import { Helmet } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

export default function PublicLayout({ children, title, description }) {
  const pageTitle = title ? `${title} | Show Terra Air` : 'Show Terra Air — Air Ticket Booking Sylhet';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}
