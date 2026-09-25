import React, { useState, useMemo } from 'react';
import type { StateInfo, DistrictInfo } from '../data/statesAndDistricts';

interface StateDistrictModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStateId: string;
  selectedDistrictId: string;
  onSelectDistrict: (state: StateInfo, district: DistrictInfo, action: 'map' | 'explore' | 'apply') => void;
  publishedStates: StateInfo[];
}

type RegionFilter = 'All' | 'North' | 'Central' | 'South' | 'East' | 'West';

export const StateDistrictModal: React.FC<StateDistrictModalProps> = ({
  isOpen,
  onClose,
  selectedStateId,
  selectedDistrictId,
  onSelectDistrict,
  publishedStates,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All');
  const [activeStateId, setActiveStateId] = useState<string>(selectedStateId);
  const [activeDistrictId, setActiveDistrictId] = useState<string>(selectedDistrictId);

  React.useEffect(() => {
    setActiveStateId(selectedStateId);
    setActiveDistrictId(selectedDistrictId);
  }, [selectedStateId, selectedDistrictId]);

  // Filter states and cities by Region and Search Query
  const filteredStates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return publishedStates
      .filter((state) => {
        if (selectedRegion !== 'All' && state.region !== selectedRegion) {
          return false;
        }
        return true;
      })
      .map((state) => {
        if (!query) return state;

        const stateMatches =
          state.name.toLowerCase().includes(query) || state.code.toLowerCase().includes(query);

        // If state matches query, keep all its published districts; otherwise filter districts matching query
        if (stateMatches) {
          return state;
        }

        const matchingDistricts = state.districts.filter(
          (district) =>
            district.name.toLowerCase().includes(query) ||
            district.highlightMonuments.some((m) => m.toLowerCase().includes(query))
        );

        return {
          ...state,
          districts: matchingDistricts,
        };
      })
      .filter((state) => state.districts.length > 0);
  }, [publishedStates, selectedRegion, searchQuery]);

  // Find the currently highlighted state and district
  const selectedState = useMemo(() => {
    return publishedStates.find((s) => s.id === activeStateId) || publishedStates[0];
  }, [publishedStates, activeStateId]);

  const selectedDistrict = useMemo(() => {
    if (!selectedState) return null;
    return selectedState.districts.find((d) => d.id === activeDistrictId) || selectedState.districts[0];
  }, [selectedState, activeDistrictId]);

  if (!isOpen) return null;

  const handlePickCity = (state: StateInfo, district: DistrictInfo, action: 'map' | 'explore' | 'apply' = 'map') => {
    setActiveStateId(state.id);
    setActiveDistrictId(district.id);
    onSelectDistrict(state, district, action);
    onClose();
  };

  const regions: RegionFilter[] = ['All', 'North', 'Central', 'South', 'East', 'West'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-select-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn select-none"
    >
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#faf9f6] border border-[#e2e2e2] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header: Clean & Simple */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#e2e2e2] bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#a14009]/10 text-[#a14009] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">explore</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="location-select-title" className="font-serif text-lg sm:text-xl font-bold text-[#1a1c1c]">
                  Select State & City
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Admin Published
                </span>
              </div>
              <p className="text-xs text-[#5a5f60] mt-0.5">
                Only verified, admin-published heritage states and districts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close directory"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] text-[#747878] hover:text-[#1a1c1c] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 1. Simple Search Bar */}
        <div className="p-4 sm:px-6 sm:pt-5 pb-3 bg-white border-b border-[#f0eee6]">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747878] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search state or city/district (e.g. Indore, Agra, Jaipur, Hampi, Puri)..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-[#f4f3ee] border border-[#e2e2e2] text-[#1a1c1c] placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-[#a14009]/30 focus:border-[#a14009] transition"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747878] hover:text-[#1a1c1c] p-1 cursor-pointer"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>

          {/* 2. Region Filter Tabs: North, Central, South, East, West */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-[#5a5f60] uppercase tracking-wide mr-1 hidden sm:inline">
              Region:
            </span>
            {regions.map((region) => {
              const isActive = selectedRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#a14009] text-white shadow-xs'
                      : 'bg-[#f4f3ee] text-[#555] hover:bg-[#eae8e0] hover:text-[#1a1c1c]'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. State and City List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {filteredStates.length === 0 ? (
            <div className="py-12 text-center text-[#747878]">
              <span className="material-symbols-outlined text-4xl text-[#bbb] mb-2">location_off</span>
              <p className="text-sm font-semibold text-[#1a1c1c]">No published locations found</p>
              <p className="text-xs text-[#747878] mt-1">
                Try searching for another state or city, or switch region filter to "All".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('All');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-[#a14009] bg-[#a14009]/10 rounded-lg hover:bg-[#a14009]/20 transition cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredStates.map((state) => {
              const isStateSelected = state.id === activeStateId;

              return (
                <div
                  key={state.id}
                  className="bg-white rounded-xl sm:rounded-2xl border border-[#e8e6df] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:border-[#d6d3c8]"
                >
                  {/* State Title Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#f2efe6] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#a14009]"></span>
                      <h3 className="font-semibold text-sm sm:text-base text-[#1a1c1c] tracking-tight">
                        {state.name}
                        <span className="text-xs text-[#747878] font-normal ml-1.5">({state.code})</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#f4f3ee] text-[#747878] text-[11px] font-medium border border-[#e2e2e2]">
                        {state.region} India
                      </span>
                    </div>

                    <span className="text-xs text-[#747878]">
                      {state.districts.length} {state.districts.length === 1 ? 'city' : 'cities'}
                    </span>
                  </div>

                  {/* City / District Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                    {state.districts.map((district) => {
                      const isCitySelected =
                        isStateSelected && district.id === activeDistrictId;

                      return (
                        <div
                          key={district.id}
                          onClick={() => handlePickCity(state, district, 'map')}
                          className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isCitySelected
                              ? 'bg-[#a14009]/10 border-[#a14009] text-[#a14009] shadow-xs'
                              : 'bg-[#faf9f6] border-[#e8e6df] hover:bg-white hover:border-[#a14009]/40 text-[#1a1c1c]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span
                              className={`material-symbols-outlined text-[18px] shrink-0 ${
                                isCitySelected
                                  ? 'text-[#a14009]'
                                  : 'text-[#888] group-hover:text-[#a14009]'
                              }`}
                            >
                              {isCitySelected ? 'check_circle' : 'location_on'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-semibold truncate">
                                  {district.name}
                                </span>
                                {district.popular && (
                                  <span
                                    title="Popular Heritage Hub"
                                    className="material-symbols-outlined text-[14px] text-amber-600 shrink-0"
                                  >
                                    star
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#747878] truncate mt-0.5">
                                {district.monumentCount} heritage sites
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Pill on Hover or Selection */}
                          <div className="shrink-0 flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePickCity(state, district, 'map');
                              }}
                              title="Open on Interactive Map"
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                                isCitySelected
                                  ? 'bg-[#a14009] text-white'
                                  : 'bg-white border border-[#e2e2e2] text-[#444] group-hover:border-[#a14009] group-hover:text-[#a14009]'
                              }`}
                            >
                              <span>Map</span>
                              <span className="material-symbols-outlined text-[12px]">map</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePickCity(state, district, 'explore');
                              }}
                              title="Browse Sites in Explore"
                              className="px-2 py-1 rounded-md text-[11px] font-medium bg-white border border-[#e2e2e2] text-[#555] hover:text-[#a14009] hover:border-[#a14009] transition cursor-pointer hidden sm:flex items-center"
                            >
                              Explore
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & current selection summary */}
        {selectedDistrict && selectedState && (
          <div className="px-4 sm:px-6 py-3 bg-white border-t border-[#e2e2e2] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <span className="material-symbols-outlined text-[#a14009] text-[18px]">
                my_location
              </span>
              <span>
                Currently active: <strong className="text-[#1a1c1c] font-semibold">{selectedDistrict.name}, {selectedState.code}</strong>
              </span>
              <span className="hidden md:inline text-[#888]">({selectedDistrict.monumentCount} monuments cataloged)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePickCity(selectedState, selectedDistrict, 'explore')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f4f3ee] text-[#1a1c1c] hover:bg-[#eae8e0] border border-[#e2e2e2] transition cursor-pointer"
              >
                Browse Monuments
              </button>
              <button
                onClick={() => handlePickCity(selectedState, selectedDistrict, 'map')}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#a14009] text-white hover:bg-[#843e1d] shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>View on Map</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
