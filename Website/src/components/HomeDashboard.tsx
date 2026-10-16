import React, { useEffect, useState } from 'react';
import { HeritageSite } from '../types';
import { getCitySections, SectionSummary, toHeritageSite } from '../api';
import { MonumentCard } from './MonumentCard';
import { CategoryCarouselRow } from './CategoryCarouselRow';
import { ArrowRight, Compass, RefreshCw, AlertCircle } from 'lucide-react';

interface HomeDashboardProps {
  cityId?: string;
  cityName?: string;
  stateName?: string;
  stateCode?: string;
  userName?: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onViewMonograph: (site: HeritageSite) => void;
  onNavigateToMap: () => void;
  onNavigateToExplore: () => void;
  onOpenStateDistrictModal?: () => void;
  onOpenSection: (sectionSlug: string, sectionTitle: string) => void;
  coverImage?: string;
  description?: string;
}

const DEFAULT_HERITAGE_FALLBACK =
  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1600&q=80';

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  cityId,
  cityName = 'Indore',
  stateName = 'Madhya Pradesh',
  stateCode = 'MP',
  userName = 'Explorer',
  favorites,
  onToggleFavorite,
  onViewMonograph,
  onNavigateToMap,
  onNavigateToExplore,
  onOpenStateDistrictModal,
  onOpenSection,
  coverImage,
  description,
}) => {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [cityMeta, setCityMeta] = useState<{
    id?: string;
    name?: string;
    coverImage?: string;
    description?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  const fetchSections = async () => {
    if (!cityId) return;
    setIsLoading(true);
    setError(null);
    setImageError(false);
    try {
      const data = await getCitySections(cityId);
      setSections(data.sections || []);
      if (data.city) {
        setCityMeta(data.city);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load city sections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [cityId]);

  // Safe fallback chain for dynamic district cover image
  const firstSectionItem = sections.flatMap((s) => s.items || []).find((it) => it.image);

  const rawImage =
    cityMeta?.coverImage?.trim() ||
    coverImage?.trim() ||
    firstSectionItem?.image ||
    DEFAULT_HERITAGE_FALLBACK;

  const displayImage = imageError ? DEFAULT_HERITAGE_FALLBACK : rawImage;

  // Dynamic label for top-right glass badge
  const imageLabelTitle =
    !cityMeta?.coverImage?.trim() && !coverImage?.trim() && firstSectionItem?.title
      ? firstSectionItem.title
      : `${cityName === 'Indore' ? 'Rajwada Palace' : `${cityName} Landmark`}`;

  // Personalized greeting name
  const greetingName = userName?.trim() ? userName.trim().split(' ')[0] : 'Explorer';

  // Description text
  const heroDescription =
    cityMeta?.description?.trim() ||
    description?.trim() ||
    'Explore historic places, living traditions, food, festivals and stories waiting to be explored.';

  return (
    <div className="space-y-12 pb-20 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. TOP HOMEPAGE HERO / WELCOME BANNER (EXACT REFERENCE DESIGN) */}
      {/* ========================================================================= */}
      <section
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E5DACF] bg-[#F7F2EB] shadow-sm min-h-[380px] sm:min-h-[430px] lg:min-h-[460px] flex items-center"
        data-purpose="homepage-hero-banner"
      >
        {/* Background Panoramic Heritage Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={displayImage}
            alt={`${cityName} heritage panoramic cover`}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center lg:object-right"
            loading="eager"
          />

          {/* Smooth Warm Parchment Gradient Fade into the left text content */}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#FDF9F3] from-30% via-[#FDF9F3]/95 via-50% sm:via-55% to-[#FDF9F3]/15 lg:to-transparent pointer-events-none" />
        </div>

        {/* Top-Right Glassmorphic Badge */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 bg-[#201D1B]/80 backdrop-blur-md text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-white/15 shadow-xl flex items-center gap-2.5 sm:gap-3 pointer-events-none">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#C9920D] to-[#9C6A05] flex items-center justify-center text-white text-xs sm:text-sm shrink-0 shadow-xs">
            🏛
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-xs sm:text-sm text-white leading-tight">
              {imageLabelTitle}
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-300 leading-tight mt-0.5">
              {cityName}, {stateName || stateCode || 'Madhya Pradesh'}
            </span>
          </div>
        </div>

        {/* Left Content Area */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-xl lg:max-w-2xl flex flex-col justify-center">
          {/* Top Pill Badge: "Namaste, Lucky 👋" */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-[#EFE9DF]/90 border border-[#E3D9CB] text-xs font-semibold text-[#3D332A] mb-3 sm:mb-4 w-fit shadow-2xs backdrop-blur-xs">
            <span className="text-[13px]">🪶</span>
            <span>Namaste, {greetingName}</span>
            <span className="inline-block ">👋</span>
          </div>

          {/* Main Title: "Discover the Heritage of Indore" */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1C1A] tracking-tight leading-[1.1]">
            <span>Discover the Heritage of</span>
            <span className="block font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#9C4212] tracking-tight leading-[1.05] mt-1 sm:mt-2">
              {cityName}
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="text-[#5C544D] text-xs sm:text-sm md:text-base leading-relaxed mt-3 sm:mt-4 mb-6 sm:mb-7 max-w-md sm:max-w-lg font-sans">
            {heroDescription}
          </p>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
            {/* Primary Button: "Explore Indore →" */}
            <button
              onClick={onNavigateToExplore}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#9C4212] hover:bg-[#83360E] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px]">
                <Compass className="w-3.5 h-3.5" />
              </span>
              <span>Explore {cityName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Button: "Around Me" */}
            <button
              onClick={onNavigateToMap}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-transparent hover:bg-white/60 text-[#3D332A] text-xs sm:text-sm font-semibold tracking-wide border border-[#B89F88] shadow-2xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-[#3D332A]">location_on</span>
              <span>Around Me</span>
            </button>
          </div>

          {/* Bottom Switch Link: "Explore another district →" */}
          <div>
            <button
              onClick={() => {
                if (onOpenStateDistrictModal) {
                  onOpenStateDistrictModal();
                } else {
                  onNavigateToExplore();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#9C4212] hover:text-[#7A320B] transition-colors cursor-pointer group"
            >
              <span>Explore another district</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LOADING STATE */}
      {/* ========================================================================= */}
      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading heritage sections for {cityName}...</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ERROR STATE */}
      {/* ========================================================================= */}
      {!isLoading && error && (
        <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-foreground font-medium mb-4">{error}</p>
          <button
            onClick={fetchSections}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 5 DYNAMIC CATEGORY SECTIONS (PRESERVED UNCHANGED) */}
      {/* ========================================================================= */}
      {!isLoading && !error && (
        <div className="space-y-16">
          {sections.map((sec) => (
            <section key={sec.slug} className="space-y-6">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground flex items-center gap-3">
                    <span>{sec.title}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-sans font-medium">
                      {sec.totalCount} {sec.totalCount === 1 ? 'place' : 'places'}
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{sec.description}</p>
                </div>

                <button
                  onClick={() => onOpenSection(sec.slug, sec.title)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group self-start sm:self-auto"
                >
                  <span>View All in {cityName}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Category Carousel Row with Smart Overflow Arrow Navigation */}
              {sec.items && sec.items.length > 0 ? (
                <CategoryCarouselRow
                  items={sec.items.map((card) =>
                    toHeritageSite(card, {
                      _id: cityId || '',
                      name: cityName,
                      stateId: '',
                      active: true,
                    })
                  )}
                  favorites={favorites}
                  onViewMonograph={onViewMonograph}
                  onToggleFavorite={onToggleFavorite}
                  onGetDirections={onViewMonograph}
                />
              ) : (
                <div className="p-8 rounded-2xl bg-surface-variant/20 border border-dashed border-border text-center text-muted-foreground text-sm">
                  No records published yet in {sec.title} for {cityName}.
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
