import React, { useEffect, useMemo, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { HeritageSite } from '../types';
import { MonumentCard } from './MonumentCard';

interface ExploreSearchProps {
  sites: HeritageSite[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onViewMonograph: (site: HeritageSite) => void;
}

type SortOption = 'Highest Rated' | 'Nearest First' | 'Name (A-Z)' | 'Name (Z-A)' | 'Built Year (Oldest)';

type FilterTag = 'Heritage' | 'Historical' | 'Forts' | 'Temples' | 'Palaces' | 'Museums' | 'Bazaars' | 'Cultural';

const FILTER_TAGS: FilterTag[] = [
  'Heritage',
  'Historical',
  'Forts',
  'Temples',
  'Palaces',
  'Museums',
  'Bazaars',
  'Cultural',
];

const TOP_CATEGORIES = ['All', 'Popular', 'Hidden', 'Cultural & Folk Music / Dance', 'Festivals', 'Living Culture'];
const PAGE_SIZE = 8;

const searchableText = (site: HeritageSite) => [
  site.name,
  site.description,
  site.dynasty,
  site.location,
  site.category,
  site.subTitle || '',
].join(' ').toLowerCase();

const matchesTag = (site: HeritageSite, tag: FilterTag) => {
  const text = searchableText(site);
  const tagTerms: Record<FilterTag, string[]> = {
    Heritage: ['heritage'],
    Historical: ['histor', 'ancient', 'old', 'century', 'dynasty'],
    Forts: ['fort', 'fortress', 'citadel'],
    Temples: ['temple', 'mandir', 'shrine'],
    Palaces: ['palace', 'royal'],
    Museums: ['museum', 'gallery'],
    Bazaars: ['bazaar', 'market', 'guild'],
    Cultural: ['cultural', 'folk', 'dance', 'music', 'artisan', 'craft'],
  };
  return tagTerms[tag].some((term) => text.includes(term));
};

const builtYearValue = (site: HeritageSite) => {
  const year = Number.parseInt(site.builtYear || '', 10);
  return Number.isFinite(year) ? year : Number.POSITIVE_INFINITY;
};

export const ExploreSearch: React.FC<ExploreSearchProps> = ({
  sites,
  favorites,
  onToggleFavorite,
  onViewMonograph,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopCategory, setSelectedTopCategory] = useState('Popular');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('Any');
  const [sortBy, setSortBy] = useState<SortOption>('Highest Rated');
  const [activeFilterTags, setActiveFilterTags] = useState<FilterTag[]>([]);
  const [draftFilterTags, setDraftFilterTags] = useState<FilterTag[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [draftVerifiedOnly, setDraftVerifiedOnly] = useState(false);
  const [minimumRating, setMinimumRating] = useState(0);
  const [draftMinimumRating, setDraftMinimumRating] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const availableTags = useMemo(() => {
    const presentTags = FILTER_TAGS.filter((tag) => sites.some((site) => matchesTag(site, tag)));
    return presentTags.length ? presentTags : FILTER_TAGS;
  }, [sites]);

  const toggleTag = (tag: FilterTag) => {
    setActiveFilterTags((previous) => previous.includes(tag)
      ? previous.filter((item) => item !== tag)
      : [...previous, tag]);
  };

  const clearAllFilters = () => {
    setActiveFilterTags([]);
    setDraftFilterTags([]);
    setSearchQuery('');
    setLocationQuery('');
    setSelectedRadius('Any');
    setSelectedTopCategory('All');
    setVerifiedOnly(false);
    setDraftVerifiedOnly(false);
    setMinimumRating(0);
    setDraftMinimumRating(0);
    setCurrentPage(1);
  };

  const openFilter = () => {
    setDraftFilterTags(activeFilterTags);
    setDraftVerifiedOnly(verifiedOnly);
    setDraftMinimumRating(minimumRating);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    setActiveFilterTags(draftFilterTags);
    setVerifiedOnly(draftVerifiedOnly);
    setMinimumRating(draftMinimumRating);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const location = locationQuery.trim().toLowerCase();
    const radius = selectedRadius === 'Any' ? Number.POSITIVE_INFINITY : Number.parseInt(selectedRadius, 10);

    return sites
      .filter((site) => {
        const text = searchableText(site);
        if (query && !text.includes(query)) return false;
        if (location && !site.location.toLowerCase().includes(location)) return false;
        if (Number.isFinite(radius) && site.distanceKm > radius) return false;
        if (minimumRating > 0 && site.rating < minimumRating) return false;
        if (verifiedOnly && !site.verifiedType) return false;
        if (activeFilterTags.length && !activeFilterTags.every((tag) => matchesTag(site, tag))) return false;

        if (selectedTopCategory === 'Popular' && site.categoryType !== 'popular') return false;
        if (selectedTopCategory === 'Hidden' && site.categoryType !== 'hidden') return false;
        if (selectedTopCategory === 'Festivals' && site.categoryType !== 'festivals') return false;
        if (selectedTopCategory === 'Living Culture' && site.categoryType !== 'living') return false;
        if (selectedTopCategory === 'Cultural & Folk Music / Dance' && !matchesTag(site, 'Cultural')) return false;
        return true;
      })
      .sort((left, right) => {
        if (sortBy === 'Nearest First') return left.distanceKm - right.distanceKm;
        if (sortBy === 'Name (A-Z)') return left.name.localeCompare(right.name);
        if (sortBy === 'Name (Z-A)') return right.name.localeCompare(left.name);
        if (sortBy === 'Built Year (Oldest)') return builtYearValue(left) - builtYearValue(right);
        return right.rating - left.rating;
      });
  }, [activeFilterTags, locationQuery, minimumRating, searchQuery, selectedRadius, selectedTopCategory, sites, sortBy, verifiedOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayedSites = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilterTags, locationQuery, minimumRating, searchQuery, selectedRadius, selectedTopCategory, sortBy, verifiedOnly]);

  return (
    <main className="flex-grow pt-6 sm:pt-10 pb-20">
      <section className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 mb-12 sm:mb-16 text-center">
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 text-[#000000] font-bold tracking-tight">Explore India</h1>
        <p className="text-sm sm:text-lg text-[#444748] max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
          Discover timeless monuments, hidden cultural gems, and authentic experiences curated for the discerning traveler.
        </p>
        <div className="max-w-4xl mx-auto relative group px-2 sm:px-0">
          <div className="absolute inset-y-0 left-3 sm:left-4 pl-2 sm:pl-0 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[#747878]">search</span>
          </div>
          <input
            className="w-full bg-[#f9f9f9] border border-[#c4c7c7] focus:border-[#a14009] focus:ring-1 focus:ring-[#a14009] rounded-full py-3.5 sm:py-4 pl-11 sm:pl-12 pr-24 sm:pr-32 text-sm sm:text-base text-[#1a1c1c] shadow-sm transition-shadow outline-none"
            placeholder="Where do you want to go?"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="button" className="absolute inset-y-1.5 sm:inset-y-2 right-3 sm:right-2 bg-[#000000] text-white text-[11px] sm:text-xs uppercase tracking-wider font-semibold px-4 sm:px-6 rounded-full hover:bg-[#a14009] transition-colors duration-300 cursor-pointer">Search</button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mt-6 sm:mt-8 px-2">
          {TOP_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedTopCategory(category)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-[11px] sm:text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer border ${selectedTopCategory === category ? 'bg-white text-[#a14009] border-[#a14009] shadow-xs' : 'bg-white text-[#1a1c1c] border-[#c4c7c7] hover:border-[#a14009] hover:text-[#a14009]'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex flex-col">
        <div className="w-full mb-8 sm:mb-10">
          <div className="bg-[#f9f9f9] border border-[#c4c7c7] rounded-xl p-3.5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#e2e2e2]">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="relative flex items-center bg-white border border-[#c4c7c7] hover:border-[#a14009] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm transition-colors max-w-full">
                  <span className="material-symbols-outlined text-sm text-[#a14009] mr-1.5 sm:mr-2 shrink-0">location_on</span>
                  <input type="text" placeholder="Location: All India" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} className="bg-transparent border-none p-0 text-xs sm:text-sm font-semibold text-[#000000] focus:ring-0 outline-none w-32 sm:w-48" />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                  {activeFilterTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)} className="bg-[#a14009] text-white text-[10px] sm:text-xs uppercase tracking-wider px-2.5 sm:px-3 py-1.5 sm:py-2 rounded font-semibold flex items-center gap-1 hover:bg-[#7d2d00] transition-colors cursor-pointer shrink-0">
                      <span>{tag}</span><X size={13} aria-hidden="true" />
                    </button>
                  ))}
                  {!activeFilterTags.length && <span className="text-xs text-[#747878] px-2">No tag filters selected</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={openFilter} className="text-[#1a1c1c] hover:text-[#a14009] text-[11px] sm:text-xs uppercase tracking-wider font-semibold transition-colors px-2 py-1 flex items-center gap-1.5 cursor-pointer" aria-label="Open filters">
                  <Filter size={15} aria-hidden="true" /><span>Filter</span>
                </button>
                <button type="button" onClick={clearAllFilters} className="text-[#444748] hover:text-[#a14009] text-[11px] sm:text-xs uppercase tracking-wider font-semibold transition-colors px-2 py-1 flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-sm">restart_alt</span><span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 text-sm">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#444748] font-semibold">Radius:</span>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {['Any', '25 km', '50 km', '100 km'].map((radius) => (
                    <button key={radius} type="button" onClick={() => setSelectedRadius(radius)} className={`text-[11px] sm:text-xs uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded transition-colors cursor-pointer ${selectedRadius === radius ? 'bg-[#000000] text-white font-semibold' : 'bg-white hover:border-[#a14009] border border-[#c4c7c7] text-[#1a1c1c]'}`}>{radius}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#444748] font-semibold">Sort:</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="bg-white border border-[#c4c7c7] rounded-lg text-xs sm:text-sm text-[#000000] py-1 sm:py-1.5 pl-2.5 sm:pl-3 pr-7 sm:pr-8 font-semibold focus:border-[#a14009] focus:ring-0 cursor-pointer">
                  <option value="Highest Rated">Popularity / Rating</option>
                  <option value="Nearest First">Distance: Nearest First</option>
                  <option value="Name (A-Z)">Name: A to Z</option>
                  <option value="Name (Z-A)">Name: Z to A</option>
                  <option value="Built Year (Oldest)">Built Year: Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-5 sm:mt-6 gap-3">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#000000]">Popular Places</h2>
              <p className="text-xs sm:text-sm text-[#444748] mt-0.5 sm:mt-1">{filtered.length} historical sites found matching active filters</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#444748] flex-wrap">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Active:</span>
              <span className="bg-[#e2e2e2] text-[#1a1c1c] px-2 py-0.5 rounded text-[11px]">{locationQuery || 'All locations'} +{selectedRadius}</span>
              {activeFilterTags.map((tag) => <span key={tag} className="bg-[#e2e2e2] text-[#1a1c1c] px-2 py-0.5 rounded text-[11px]">{tag}</span>)}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {displayedSites.map((site) => <MonumentCard key={site.id} site={site} variant="grid" isFavorite={favorites.includes(site.id)} onToggleFavorite={onToggleFavorite} onViewMonograph={onViewMonograph} />)}
        </div>

        <div className="flex justify-center mt-12 gap-2 w-full">
          <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="w-10 h-10 border border-[#c4c7c7] rounded flex items-center justify-center text-[#444748] hover:border-[#a14009] hover:text-[#a14009] transition-colors disabled:opacity-40 cursor-pointer"><span className="material-symbols-outlined text-sm">arrow_back</span></button>
          {Array.from({ length: totalPages }).map((_, index) => <button type="button" key={index + 1} onClick={() => setCurrentPage(index + 1)} className={`w-10 h-10 rounded flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer ${currentPage === index + 1 ? 'border border-[#a14009] bg-[#000000] text-white' : 'border border-[#c4c7c7] text-[#1a1c1c] hover:border-[#a14009] hover:text-[#a14009]'}`}>{index + 1}</button>)}
          <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="w-10 h-10 border border-[#c4c7c7] rounded flex items-center justify-center text-[#444748] hover:border-[#a14009] hover:text-[#a14009] transition-colors disabled:opacity-40 cursor-pointer"><span className="material-symbols-outlined text-sm">arrow_forward</span></button>
        </div>
      </section>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation" onClick={() => setIsFilterOpen(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#e2e2e2] p-5 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="filter-title" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 id="filter-title" className="font-serif text-2xl font-bold text-[#1a1c1c]">Filter Heritage</h2>
              <button type="button" onClick={() => setIsFilterOpen(false)} className="p-2 text-[#747878] hover:text-[#a14009] cursor-pointer" aria-label="Close filters"><X size={20} /></button>
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#444748] mb-2">Categories and Tags</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {availableTags.map((tag) => {
                const checked = draftFilterTags.includes(tag);
                return <button type="button" key={tag} onClick={() => setDraftFilterTags((previous) => checked ? previous.filter((item) => item !== tag) : [...previous, tag])} className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${checked ? 'bg-[#a14009] border-[#a14009] text-white' : 'bg-white border-[#c4c7c7] text-[#1a1c1c] hover:border-[#a14009]'}`}><span className="mr-1.5">{checked ? '✓' : '＋'}</span>{tag}</button>;
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <label className="flex items-center gap-2 text-sm text-[#1a1c1c] cursor-pointer"><input type="checkbox" checked={draftVerifiedOnly} onChange={(event) => setDraftVerifiedOnly(event.target.checked)} /> Verified sites only</label>
              <label className="flex items-center gap-2 text-sm text-[#1a1c1c]">Minimum rating
                <select value={draftMinimumRating} onChange={(event) => setDraftMinimumRating(Number(event.target.value))} className="border border-[#c4c7c7] rounded px-2 py-1 text-sm"><option value={0}>Any</option><option value={3}>3+</option><option value={4}>4+</option><option value={4.5}>4.5+</option></select>
              </label>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#e2e2e2] pt-4">
              <button type="button" onClick={() => { setDraftFilterTags([]); setDraftVerifiedOnly(false); setDraftMinimumRating(0); }} className="px-4 py-2 text-sm font-semibold text-[#444748] hover:text-[#a14009] cursor-pointer">Clear All</button>
              <button type="button" onClick={applyFilters} className="px-5 py-2 rounded-lg bg-[#a14009] text-white text-sm font-semibold hover:bg-[#853407] cursor-pointer">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
