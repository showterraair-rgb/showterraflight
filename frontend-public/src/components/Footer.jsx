import { Link } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

export default function Footer() {
  const { company } = useCompany();
  const wa = company.whatsapp?.replace(/\D/g, '');

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold text-white">{company.name}</h3>
          <p className="mt-3 text-sm leading-relaxed">{company.address}</p>
        </div>

        <div>
          <h4 className="font-semibold text-white">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
            <li><Link to="/booking" className="hover:text-white">Book a Ticket</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Email: <a href={`mailto:${company.email}`} className="hover:text-white">{company.email}</a></li>
            <li>WhatsApp: <a href={`https://wa.me/88${wa}`} target="_blank" rel="noreferrer" className="hover:text-white">{company.whatsapp}</a></li>
            <li>Director: {company.directorName}</li>
            <li>Phone: {company.directorPhone}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {company.name}. All rights reserved.
      </div>
    </footer>
  );
}
