import React, { useState, useMemo } from 'react';
import { HeritageSite } from '../types';
import type { StateInfo } from '../data/statesAndDistricts';
import { CityHeritageCard } from '../data/cityCardsData';

interface LandingPageProps {
  onStartExploring: () => void;
  onNavigateToMap: () => void;
  onNavigateToAuth: () => void;
  onNavigateToPassport: () => void;
  onSelectSite: (site: HeritageSite) => void;
  onSelectCityForAuth?: (state: string, district: string) => void;
  featuredSites: HeritageSite[];
  publishedStates: StateInfo[];
}

const CARDS_PER_PAGE = 6;

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartExploring,
  onNavigateToMap,
  onNavigateToAuth,
  onNavigateToPassport,
  onSelectSite,
  onSelectCityForAuth,
  featuredSites: _featuredSites,
  publishedStates,
}) => {
  const liveCityCards = useMemo<CityHeritageCard[]>(() => publishedStates.flatMap((state) => state.districts.map((district) => ({
    id: district.id,
    name: district.name,
    state: state.name,
    stateCode: state.code,
    region: state.region,
    monumentCount: district.monumentCount || 0,
    dynasty: 'Admin published heritage jurisdiction',
    architectureStyle: 'National Heritage Circle',
    highlightMonuments: district.highlightMonuments || [],
    description: district.description || `Explore officially cataloged heritage records, monuments, and cultural traditions in ${district.name}.`,
    architecturalHallmark: 'Curated through the Dharohar National Registry.',
    image: district.coverImage || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1200&auto=format&fit=crop',
    coordinates: district.coordinates || { lat: 0, lng: 0 },
  }))), [publishedStates]);
  // Directory Filter States
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'North' | 'Central' | 'South' | 'East' | 'West'>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'monuments' | 'name' | 'state'>('monuments');

  // Pagination / Display limit state
  const [visibleCount, setVisibleCount] = useState<number>(CARDS_PER_PAGE);

  // Modal preview state
  const [activeCityModal, setActiveCityModal] = useState<CityHeritageCard | null>(null);

  // Derive unique states list for filter dropdown
  const uniqueStatesList = useMemo(() => {
    const states = Array.from(new Set(liveCityCards.map((c) => c.state))).sort();
    return ['All', ...states];
  }, [liveCityCards]);

  // Filtered and sorted city cards
  const filteredCityCards = useMemo(() => {
    return liveCityCards.filter((card) => {
      // Region filter
      if (selectedRegion !== 'All' && card.region !== selectedRegion) {
        return false;
      }
      // State filter
      if (selectedState !== 'All' && card.state !== selectedState) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesState = card.state.toLowerCase().includes(q);
        const matchesDynasty = card.dynasty.toLowerCase().includes(q);
        const matchesArch = card.architectureStyle.toLowerCase().includes(q);
        const matchesMonuments = card.highlightMonuments.some((m) => m.toLowerCase().includes(q));
        return matchesName || matchesState || matchesDynasty || matchesArch || matchesMonuments;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'monuments') {
        return b.monumentCount - a.monumentCount;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return a.state.localeCompare(b.state);
    });
  }, [liveCityCards, selectedRegion, selectedState, searchQuery, sortBy]);

  // Visible subset of cards (prevents overwhelming the user)
  const displayedCards = useMemo(() => {
    return filteredCityCards.slice(0, visibleCount);
  }, [filteredCityCards, visibleCount]);

  // Reset pagination when filters change
  const handleRegionChange = (reg: 'All' | 'North' | 'Central' | 'South' | 'East' | 'West') => {
    setSelectedRegion(reg);
    setVisibleCount(CARDS_PER_PAGE);
  };

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    setVisibleCount(CARDS_PER_PAGE);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleCount(CARDS_PER_PAGE);
  };

  const handleCityExplore = (card: CityHeritageCard) => {
    if (onSelectCityForAuth) {
      onSelectCityForAuth(card.state, card.name);
    } else {
      onNavigateToAuth();
    }
  };

  return (
    <div className="w-full bg-[#fcfcfc] text-[#1c1b1b] animate-fadeIn select-none font-sans">
      {/* 1. HERO SECTION: Clean, High-Contrast & Professional */}
      <section className="relative w-full min-h-[75vh] sm:min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#18181b] text-white">
        {/* Subtle Background Image with Smooth Vignette */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=2000&auto=format&fit=crop"
            alt="Ancient Indian Architecture"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25 scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/70 to-[#18181b]/40"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 flex flex-col items-center text-center">
          {/* Top Motto Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-400/15 backdrop-blur-md border border-amber-400/30 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-200 uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Discover • Experience • Reward • Preserve</span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight max-w-4xl mb-5">
            Discover, Experience, Reward &amp; Preserve India's Living Heritage
          </h1>

          {/* Short Subtitle */}
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed mb-8 font-normal">
            Immerse yourself in dynastic architecture, centrally protected monuments, and living cultural guilds across all Indian states with real-time GIS mapping and passport rewards.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md sm:max-w-none">
            <a
              href="#city-directory"
              className="px-6 py-3 rounded-xl bg-[#a14009] hover:bg-[#853407] text-white font-medium text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">location_city</span>
              <span>Browse Cities</span>
            </a>

            <button
              onClick={onNavigateToMap}
              className="px-6 py-3 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-medium text-xs sm:text-sm tracking-wide shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>Interactive Map</span>
            </button>

            <button
              onClick={onNavigateToAuth}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm tracking-wide backdrop-blur-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Sign In / Register</span>
            </button>
          </div>

          {/* Clean Metric Counter Strip */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-12 pt-8 border-t border-white/10 max-w-lg w-full">
            <div className="flex flex-col items-center">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">50+</span>
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">Heritage Cities</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-white">3,600+</span>
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">Monuments</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">42</span>
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">UNESCO Sites</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CITY DIRECTORY SECTION: Concise, Short & Professional Cards */}
      <section id="city-directory" className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a14009] block mb-1">
              National Directory
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
              Heritage Cities by State
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl leading-relaxed">
              Select any city to view architectural monographs or register to explore with GIS guidance.
            </p>
          </div>

          {/* Summary Indicator */}
          <div className="text-xs text-neutral-500 font-medium">
            Showing <span className="font-bold text-neutral-900">{displayedCards.length}</span> of{' '}
            <span className="font-bold text-neutral-900">{filteredCityCards.length}</span> cities
          </div>
        </div>

        {/* Professional Filter & Search Toolbar */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 sm:p-4 mb-8 shadow-xs flex flex-col gap-3">
          {/* Top Filter Row: Search & State & Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search city, dynasty, or monument..."
                className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#a14009] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* State Filter Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#a14009] cursor-pointer"
              >
                <option value="All">All States ({liveCityCards.length})</option>
                {uniqueStatesList.filter((s) => s !== 'All').map((st) => (
                  <option key={st} value={st}>
                    {st} ({liveCityCards.filter((c) => c.state === st).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#a14009] cursor-pointer"
              >
                <option value="monuments">Sort: Most Monuments</option>
                <option value="name">Sort: City Name (A–Z)</option>
                <option value="state">Sort: State Name</option>
              </select>
            </div>
          </div>

          {/* Region Tabs Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-neutral-100">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Central', 'North', 'South', 'East', 'West'] as const).map((reg) => {
                const count = reg === 'All' ? liveCityCards.length : liveCityCards.filter((c) => c.region === reg).length;
                const isActive = selectedRegion === reg;
                return (
                  <button
                    key={reg}
                    onClick={() => handleRegionChange(reg)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                        ? 'bg-[#a14009] text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                  >
                    <span>{reg === 'All' ? 'All India' : reg}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Reset Button if active filter */}
            {(selectedRegion !== 'All' || selectedState !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedRegion('All');
                  setSelectedState('All');
                  setSearchQuery('');
                  setVisibleCount(CARDS_PER_PAGE);
                }}
                className="text-xs text-[#a14009] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact, Professional Cards Grid */}
        {filteredCityCards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 p-6">
            <span className="material-symbols-outlined text-[36px] text-neutral-400 mb-2">
              search_off
            </span>
            <h3 className="font-serif text-lg font-bold text-neutral-800 mb-1">
              No Cities Found
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Try adjusting your search query or reset your filters.
            </p>
            <button
              onClick={() => {
                setSelectedRegion('All');
                setSelectedState('All');
                setSearchQuery('');
                setVisibleCount(CARDS_PER_PAGE);
              }}
              className="px-4 py-2 bg-[#a14009] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayedCards.map((city) => (
              <div
                key={city.id}
                className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/90 hover:border-neutral-300 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                {/* Top Image: Compact 145px height */}
                <div>
                  <div className="relative h-36 w-full overflow-hidden bg-neutral-900">
                    <img
                      src={city.image}
                      alt={city.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/10">
                        {city.state}
                      </span>
                      <span className="bg-[#a14009] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                        {city.region}
                      </span>
                    </div>

                    {/* UNESCO Tag */}
                    {city.unescoStatus && (
                      <div className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-[12px]">stars</span>
                        <span>UNESCO</span>
                      </div>
                    )}

                    {/* Title on Image Bottom */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-white leading-tight">
                          {city.name}
                        </h3>
                      </div>
                      <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        {city.monumentCount} Sites
                      </span>
                    </div>
                  </div>

                  {/* Body Content: Short, Concise & Readable */}
                  <div className="p-4 flex flex-col gap-2.5">
                    {/* Dynasty / Style Line */}
                    <div className="flex items-center gap-1 text-[11px] text-[#8d3707] font-medium truncate">
                      <span className="material-symbols-outlined text-[14px]">history_edu</span>
                      <span className="truncate">{city.dynasty}</span>
                    </div>

                    {/* Concise 1-sentence description */}
                    <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                      {city.description}
                    </p>

                    {/* Compact Monument Chips (Max 3) */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {city.highlightMonuments.slice(0, 3).map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-medium truncate max-w-[170px]"
                        >
                          {m}
                        </span>
                      ))}
                      {city.highlightMonuments.length > 3 && (
                        <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-medium">
                          +{city.highlightMonuments.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Clean & Concise */}
                <div className="p-3 px-4 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveCityModal(city)}
                    className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 cursor-pointer py-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">info</span>
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => handleCityExplore(city)}
                    className="py-1.5 px-3.5 rounded-lg bg-[#a14009] hover:bg-[#853407] text-white text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Explore</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progressive Disclosure Pagination Bar */}
        {filteredCityCards.length > CARDS_PER_PAGE && (
          <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            {visibleCount < filteredCityCards.length ? (
              <>
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 6, filteredCityCards.length))}
                  className="px-6 py-2.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  <span>Show More Cities (+6)</span>
                </button>
                <button
                  onClick={() => setVisibleCount(filteredCityCards.length)}
                  className="text-xs font-medium text-[#a14009] hover:underline cursor-pointer px-2 py-1"
                >
                  View All ({filteredCityCards.length})
                </button>
              </>
            ) : (
              <button
                onClick={() => setVisibleCount(CARDS_PER_PAGE)}
                className="px-5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">expand_less</span>
                <span>Collapse to 6 Cities</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 3. CORE MISSION & MOTTO: Discover • Experience • Reward • Preserve */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 bg-white border-t border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#a14009] block mb-1">
              Our Core Motto &amp; Mission
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Discover • Experience • Reward • Preserve
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Four interconnected pillars uniting technological exploration with cultural conservation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Pillar 1: DISCOVER */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between hover:border-[#a14009]/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#a14009]/10 text-[#a14009] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">explore</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#a14009] bg-[#a14009]/10 px-2 py-0.5 rounded">
                    Pillar 01
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-0.5 group-hover:text-[#a14009] transition-colors">
                  Discover
                </h3>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                  Spatial GIS &amp; Sites
                </span>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Pinpoint 3,600+ centrally protected monuments, ancient stepwells, and fortified citadels with live radial distance and interactive maps.
                </p>
              </div>
              <button
                onClick={onNavigateToMap}
                className="mt-4 pt-3 border-t border-neutral-200/70 text-xs font-semibold text-[#a14009] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Open Spatial Map</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Pillar 2: EXPERIENCE */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between hover:border-amber-700/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded">
                    Pillar 02
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-0.5 group-hover:text-amber-800 transition-colors">
                  Experience
                </h3>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                  Monographs &amp; Chronology
                </span>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Immerse in verified architectural styles (Nagara, Dravida, Vesara), epigraphic translations, and millennia of civilizational art.
                </p>
              </div>
              <button
                onClick={onStartExploring}
                className="mt-4 pt-3 border-t border-neutral-200/70 text-xs font-semibold text-[#a14009] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Read Monographs</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Pillar 3: REWARD */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between hover:border-emerald-700/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">military_tech</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-600/10 px-2 py-0.5 rounded">
                    Pillar 03
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-0.5 group-hover:text-emerald-800 transition-colors">
                  Reward
                </h3>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                  Passport Honors &amp; Stamps
                </span>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Collect official GPS-verified field stamps, earn cultural ranks from Novice to Connoisseur, and build your digital heritage passport.
                </p>
              </div>
              <button
                onClick={onNavigateToPassport}
                className="mt-4 pt-3 border-t border-neutral-200/70 text-xs font-semibold text-[#a14009] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View Honors</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Pillar 4: PRESERVE */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between hover:border-blue-700/40 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">shield</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-600/10 px-2 py-0.5 rounded">
                    Pillar 04
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 mb-0.5 group-hover:text-blue-800 transition-colors">
                  Preserve
                </h3>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                  Living Guilds &amp; Conservation
                </span>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Support traditional night bazaars, bell-metal casters, and handloom weaver communities while upholding conscious preservation ethics.
                </p>
              </div>
              <button
                onClick={onStartExploring}
                className="mt-4 pt-3 border-t border-neutral-200/70 text-xs font-semibold text-[#a14009] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Support Living Guilds</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS: Simple 3-Step Protocol */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 max-w-5xl mx-auto text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#a14009] block mb-1">
          Simple Workflow
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mb-8">
          How to Explore
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col items-center">
            <span className="text-2xl font-serif font-bold text-[#a14009] mb-2">01</span>
            <h4 className="font-bold text-sm text-neutral-900 mb-1">Choose Your City</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Pick any heritage center across North, Central, South, East, or West India.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col items-center">
            <span className="text-2xl font-serif font-bold text-[#a14009] mb-2">02</span>
            <h4 className="font-bold text-sm text-neutral-900 mb-1">Explore Monograph &amp; GIS</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Inspect protected monuments, coordinates, and architectural hallmarks.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col items-center">
            <span className="text-2xl font-serif font-bold text-[#a14009] mb-2">03</span>
            <h4 className="font-bold text-sm text-neutral-900 mb-1">Stamp Passport</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sign in to record visits, save favorites, and earn verified cultural badges.
            </p>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER: Clean & Direct */}
      <section className="w-full px-4 sm:px-6 md:px-8 py-14 bg-neutral-900 text-white text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-widest mb-3 bg-white/5 border border-white/10 px-3.5 py-1 rounded-full">
            <span>Discover</span>
            <span>•</span>
            <span>Experience</span>
            <span>•</span>
            <span>Reward</span>
            <span>•</span>
            <span>Preserve</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
            Start Your Heritage Journey
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mb-6 max-w-md">
            Register your explorer account to discover protected monuments, experience architectural monographs, earn verified passport rewards, and preserve living traditions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onNavigateToAuth}
              className="px-6 py-2.5 rounded-xl bg-[#a14009] hover:bg-[#853407] text-white text-xs font-semibold tracking-wide shadow-sm transition-all cursor-pointer"
            >
              Sign In / Register
            </button>
            <button
              onClick={onNavigateToMap}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              Launch Live Map
            </button>
          </div>
        </div>
      </section>

      {/* 6. CITY MONOGRAPH MODAL: Detailed view without bloating the main page */}
      {activeCityModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 my-8 animate-scaleUp">
            {/* Modal Image Header */}
            <div className="relative h-48 w-full bg-black">
              <img
                src={activeCityModal.image}
                alt={activeCityModal.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

              {/* Close Button */}
              <button
                onClick={() => setActiveCityModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              {/* State & UNESCO Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="bg-[#a14009] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {activeCityModal.state} · {activeCityModal.region}
                </span>
                {activeCityModal.unescoStatus && (
                  <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">stars</span>
                    <span>UNESCO</span>
                  </span>
                )}
              </div>

              {/* Title on Image */}
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-amber-300 text-[11px] font-semibold uppercase tracking-wider block mb-0.5">
                  {activeCityModal.dynasty}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white leading-tight">
                  {activeCityModal.name}
                </h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
              {/* Architecture Style */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-700 bg-neutral-100 p-2.5 rounded-xl">
                <span className="material-symbols-outlined text-[16px] text-[#a14009]">architecture</span>
                <span><strong>Style:</strong> {activeCityModal.architectureStyle}</span>
              </div>

              {/* Monograph Summary */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#a14009] mb-1">
                  Historical Brief
                </h4>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {activeCityModal.description}
                </p>
              </div>

              {/* Architectural Hallmark */}
              <div className="bg-[#fbf7f0] border-l-3 border-[#a14009] p-3 rounded-r-xl">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#a14009] mb-0.5">
                  Architectural Hallmark:
                </h5>
                <p className="text-xs text-[#4a3b32] italic leading-snug">
                  "{activeCityModal.architecturalHallmark}"
                </p>
              </div>

              {/* Highlight Monuments */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Centrally Protected Monuments ({activeCityModal.monumentCount} Total)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeCityModal.highlightMonuments.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Living Guild & Coordinates */}
              <div className="pt-2 border-t border-neutral-200 grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                <div>
                  <strong>Living Craft:</strong>
                  <p className="text-neutral-900">{activeCityModal.culturalTrade || 'Traditional Handloom'}</p>
                </div>
                <div>
                  <strong>Coordinates:</strong>
                  <p className="text-neutral-900">{activeCityModal.coordinates.lat.toFixed(2)}° N, {activeCityModal.coordinates.lng.toFixed(2)}° E</p>
                </div>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveCityModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const targetCity = activeCityModal;
                  setActiveCityModal(null);
                  handleCityExplore(targetCity);
                }}
                className="px-4 py-2 rounded-xl bg-[#a14009] hover:bg-[#853407] text-white text-xs font-semibold tracking-wide shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span>Select &amp; Register for {activeCityModal.name}</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
