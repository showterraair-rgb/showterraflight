import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CompanyProvider } from './context/CompanyContext';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import LivePage from './pages/LivePage';

export default function App() {
  return (
    <HelmetProvider>
      <CompanyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/live" element={<LivePage />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </HelmetProvider>
  );
}
