import React, { useEffect, useState } from 'react';
import { HeritageSite } from '../types';
import { getCitySections, SectionSummary, toHeritageSite } from '../api';
import { MonumentCard } from './MonumentCard';
import { ArrowRight, Compass, MapPin, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface HomeDashboardProps {
  cityId?: string;
  cityName?: string;
  userName?: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onViewMonograph: (site: HeritageSite) => void;
  onNavigateToMap: () => void;
  onNavigateToExplore: () => void;
  onOpenSection: (sectionSlug: string, sectionTitle: string) => void;
  coverImage?: string;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  cityId,
  cityName = 'Indore',
  userName = 'Heritage Explorer',
  favorites,
  onToggleFavorite,
  onViewMonograph,
  onNavigateToMap,
  onNavigateToExplore,
  onOpenSection,
  coverImage,
}) => {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = async () => {
    if (!cityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCitySections(cityId);
      setSections(data.sections || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load city sections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [cityId]);

  return (
    <div className="space-y-12 pb-20 animate-fade-in">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-variant/40 border border-border/60 shadow-sm p-6 sm:p-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Heritage Jurisdiction</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground tracking-tight leading-tight">
            Welcome to <span className="text-primary">{cityName}</span>, {userName}
          </h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg leading-relaxed">
            Discover centrally protected monuments, sacred temples, folk traditions, living culinary heritage, and seasonal festivals of {cityName}.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <button
              onClick={onNavigateToMap}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-all shadow-md hover:shadow-lg active:scale-98"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Around Me</span>
            </button>
            <button
              onClick={onNavigateToExplore}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface border border-border text-foreground font-medium text-sm hover:bg-surface-variant transition-colors"
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span>Explore Another City</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle background pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </section>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading heritage sections for {cityName}...</p>
        </div>
      )}

      {/* Error state */}
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

      {/* 5 Dynamic Sections */}
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

              {/* Grid or Empty */}
              {sec.items && sec.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {sec.items.map((card) => {
                    const site = toHeritageSite(card, {
                      _id: cityId || '',
                      name: cityName,
                      stateId: '',
                      active: true,
                    });
                    return (
                      <MonumentCard
                        key={card.id || card._id}
                        site={site}
                        isFavorite={favorites.includes(site.id)}
                        onSelectSite={onViewMonograph}
                        onViewMonograph={onViewMonograph}
                        onToggleFavorite={onToggleFavorite}
                        onGetDirections={onViewMonograph}
                      />
                    );
                  })}
                </div>
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
