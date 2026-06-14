import { lazy, Suspense, useEffect, useState } from 'react';
import PublicLayout from '../layouts/PublicLayout';
import { publicApi } from '../services/api';
import { HomeContentProvider } from '../context/HomeContentContext';
import HeroSlider from '../components/home/HeroSlider';
import PromoSlider from '../components/home/PromoSlider';
import ServicesSection from '../components/home/ServicesSection';
import PackagesSection from '../components/home/PackagesSection';
import AboutSection from '../components/home/AboutSection';
import CtaSection from '../components/home/CtaSection';
import ContactSection from '../components/home/ContactSection';
import {
  GallerySectionFallback,
  MapSectionFallback,
  TeamSectionFallback,
  TestimonialsSectionFallback,
  TrustSectionFallback,
} from '../components/home/SectionFallback';

const BangladeshToWorldSection = lazy(() => import('../components/home/BangladeshToWorldSection'));
const TestimonialsSection = lazy(() => import('../components/home/TestimonialsSection'));
const GallerySection = lazy(() => import('../components/home/GallerySection'));
const TeamSection = lazy(() => import('../components/home/TeamSection'));
const TrustStatsSection = lazy(() => import('../components/home/TrustStatsSection'));

export default function HomePage() {
  const [cmsContent, setCmsContent] = useState({});

  useEffect(() => {
    publicApi
      .getCmsPage('home')
      .then(({ data }) => setCmsContent(data?.data?.content || {}))
      .catch(() => setCmsContent({}));
  }, []);

  return (
    <HomeContentProvider cmsContent={cmsContent}>
      <PublicLayout
        title="Home"
        description="Show Terra Flight — Air tickets, visa, Umrah, and tour packages from Sylhet, Bangladesh. Book your next journey with trusted local experts."
      >
        <div className="overflow-x-hidden">
          <div className="-mt-16 md:-mt-[4.25rem]">
            <HeroSlider />
          </div>
          <PromoSlider />
          <ServicesSection />
          <PackagesSection />
          <Suspense fallback={<MapSectionFallback />}>
            <BangladeshToWorldSection />
          </Suspense>
          <AboutSection />
          <Suspense fallback={<TestimonialsSectionFallback />}>
            <TestimonialsSection />
          </Suspense>
          <Suspense fallback={<GallerySectionFallback />}>
            <GallerySection />
          </Suspense>
          <Suspense fallback={<TeamSectionFallback />}>
            <TeamSection />
          </Suspense>
          <Suspense fallback={<TrustSectionFallback />}>
            <TrustStatsSection />
          </Suspense>
          <CtaSection />
          <ContactSection />
        </div>
      </PublicLayout>
    </HomeContentProvider>
  );
}
