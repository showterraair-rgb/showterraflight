import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../services/api';
import { normalizeCompanySettings } from '../utils/companyHelpers';

const FALLBACK = normalizeCompanySettings(null);

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getCompanySettings()
      .then(({ data }) => setSettings(normalizeCompanySettings(data?.data)))
      .catch(() => setSettings(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      ...normalizeCompanySettings(settings),
      loading,
    }),
    [settings, loading],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return {
    ...ctx,
    ...normalizeCompanySettings(ctx),
  };
}

export default CompanyContext;
