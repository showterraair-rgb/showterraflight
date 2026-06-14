import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../services/api';

const CompanyContext = createContext(null);

const FALLBACK = {
  company: {
    name: 'Show Terra Air',
    address: 'GASBARI BAZAR, GROUND FLOOR OF BRAC BANK, KANAIGHAT, SYLHET-3183, Bangladesh',
    email: 'showterraair@gmail.com',
    whatsapp: '01741148529',
    directorName: 'Kamil Hussen',
    directorPhone: '01316160206',
    ownerEmail: 'k.h.kamil74@gmail.com',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
  },
  logo: null,
  socialLinks: {},
};

export function CompanyProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getCompanySettings()
      .then(({ data }) => setSettings(data.data))
      .catch(() => setSettings(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ ...settings, loading }), [settings, loading]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}

export default CompanyContext;
