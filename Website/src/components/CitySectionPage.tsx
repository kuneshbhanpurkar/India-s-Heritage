import React, { useEffect, useState } from 'react';
import { HeritageSite } from '../types';
import { getCitySectionContent, HeritageSiteCard, toHeritageSite } from '../api';
import { MonumentCard } from './MonumentCard';
import { ArrowLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface CitySectionPageProps {
  cityId: string;
  cityName: string;
  sectionSlug: string;
  sectionTitle: string;
  onBack: () => void;
  onSelectSite: (site: HeritageSite) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onGetDirections: (site: HeritageSite) => void;
}

export const CitySectionPage: React.FC<CitySectionPageProps> = ({
  cityId,
  cityName,
  sectionSlug,
  sectionTitle,
  onBack,
  onSelectSite,
  favorites,
  onToggleFavorite,
  onGetDirections,
}) => {
  const [items, setItems] = useState<HeritageSiteCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchSectionData = async (targetPage = 1) => {
    if (!cityId || !sectionSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCitySectionContent(cityId, sectionSlug, targetPage, 12);
      setItems(res.items || []);
      setPage(res.pagination?.page || 1);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load section items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchSectionData(1);
  }, [cityId, sectionSlug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group px-3 py-1.5 rounded-lg hover:bg-surface-variant/40"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-primary" />
          <span>Back to {cityName} Overview</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{cityName}</span>
          <span>•</span>
          <span className="text-foreground font-semibold">{sectionTitle}</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium ml-1">
            {totalCount} {totalCount === 1 ? 'record' : 'records'}
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>City-Isolated Section Archive</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
          {sectionTitle} in {cityName}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
          Explore officially cataloged records, historic monuments, living traditions, and archives scoped specifically to {cityName}.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full border-3 border-primary/20 border-t-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground font-medium">Loading {sectionTitle} for {cityName}...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="my-12 p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center max-w-xl mx-auto">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Failed to Load Section Data</h3>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => fetchSectionData(page)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="my-16 p-12 rounded-2xl bg-surface-variant/30 border border-border/60 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-foreground mb-1">No Published Records Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            There are currently no published entries for {sectionTitle} in {cityName}. Authorized administrators can add new records via the Admin CMS.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-sm font-medium hover:bg-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {cityName}</span>
          </button>
        </div>
      )}

      {/* Grid of Cards */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((card) => {
              const site = toHeritageSite(card, {
                _id: cityId,
                name: cityName,
                stateId: '',
                active: true,
              });
              return (
                <MonumentCard
                  key={card.id || card._id}
                  site={site}
                  isFavorite={favorites.includes(site.id)}
                  onSelectSite={onSelectSite}
                  onViewMonograph={onSelectSite}
                  onToggleFavorite={onToggleFavorite}
                  onGetDirections={onGetDirections}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchSectionData(page - 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-surface-variant transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchSectionData(page + 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-surface-variant transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
