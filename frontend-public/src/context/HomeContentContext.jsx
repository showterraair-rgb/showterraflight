import { createContext, useContext } from 'react';
import { mergeHomeContent, DEFAULT_HOME_SECTIONS } from '../utils/homeContentMerge';

const HomeContentContext = createContext(DEFAULT_HOME_SECTIONS);

export function HomeContentProvider({ cmsContent, children }) {
  const value = mergeHomeContent(cmsContent);
  return <HomeContentContext.Provider value={value}>{children}</HomeContentContext.Provider>;
}

export function useHomeContent(sectionKey) {
  const all = useContext(HomeContentContext);
  if (sectionKey) return all[sectionKey] || DEFAULT_HOME_SECTIONS[sectionKey];
  return all;
}

export default HomeContentContext;
