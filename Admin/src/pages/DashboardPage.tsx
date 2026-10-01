import React, { useState, useMemo } from 'react';
import { AdminSummary } from '../api';
import { ViewType, MetricItem, JurisdictionLedgerItem, HeritagePlace } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { CitySectionConfig } from '../config/sections';
import { MapPin } from 'lucide-react';

export interface DashboardPageProps {
  onNavigate: (view: ViewType, sectionSlug?: string) => void;
  selectedState: string;
  selectedDistrict: string;
  selectedDistrictId?: string;
  onSelectJurisdiction: (state: string, district: string) => void;
  metrics?: MetricItem[];
  ledger?: JurisdictionLedgerItem[];
  cityBannerUrl: string;
  onSaveCityBanner: (url: string) => void;
  summary?: AdminSummary | null;
  places: HeritagePlace[];
  categoryConfigs?: Array<CitySectionConfig & { enabled: boolean }>;
  onToggleCategoryStatus?: (categorySlug: string, enabled: boolean) => void;
  onEditPlace?: (place: HeritagePlace) => void;
  onViewPlace?: (place: HeritagePlace) => void;
  onDeletePlace?: (id: string) => void;
  onQuickPublishPlace?: (place: HeritagePlace) => void;
  onNavigateAddRecord?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  selectedState,
  selectedDistrict,
  selectedDistrictId,
  onSelectJurisdiction,
  metrics,
  ledger,
  cityBannerUrl,
  onSaveCityBanner,
  summary,
  places = [],
  categoryConfigs = [],
  onToggleCategoryStatus,
  onEditPlace,
  onViewPlace,
  onDeletePlace,
  onQuickPublishPlace,
  onNavigateAddRecord,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [ledgerStateFilter, setLedgerStateFilter] = useState('ALL');
  const [ledgerDistrictFilter, setLedgerDistrictFilter] = useState('ALL');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [showCityImage, setShowCityImage] = useState(false);
  const [draftCityImageUrl, setDraftCityImageUrl] = useState(cityBannerUrl);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setDraftCityImageUrl(cityBannerUrl);
    setImageError(false);
  }, [cityBannerUrl]);

  const handleSaveCityImage = () => {
    const imageUrl = draftCityImageUrl.trim();
    if (!imageUrl) return;
    onSaveCityBanner(imageUrl);
    setShowCityImage(false);
  };

  const liveLedger = ledger || summary?.ledger || [];

  // Derive unique states and districts for KPIs and ledger filters
  const { uniqueStatesList, uniqueStatesCount, totalDistrictsCount } = useMemo(() => {
    const stateSet = new Set<string>();
    liveLedger.forEach((item) => {
      if (item.state && item.state !== 'National') {
        stateSet.add(item.state);
      }
    });
    if (selectedState) stateSet.add(selectedState);
    const states = Array.from(stateSet).sort();
    const countStates = summary?.coverage?.activeStates || states.length || 1;
    const countDistricts = summary?.coverage?.activeDistricts || liveLedger.length || 1;
    return {
      uniqueStatesList: states,
      uniqueStatesCount: countStates,
      totalDistrictsCount: countDistricts,
    };
  }, [liveLedger, selectedState, summary]);

  // Available districts for the selected state in ledger filter
  const ledgerDistrictsForState = useMemo(() => {
    if (ledgerStateFilter === 'ALL') {
      const dists = Array.from(new Set(liveLedger.map((item) => item.district))).sort();
      return dists;
    }
    const dists = Array.from(
      new Set(liveLedger.filter((item) => item.state === ledgerStateFilter).map((item) => item.district))
    ).sort();
    return dists;
  }, [liveLedger, ledgerStateFilter]);

  // Real, Scoped Metrics for the Dashboard
  const displayMetrics = useMemo(() => {
    if (metrics) return metrics;

    const publishedCount = places.filter((p) => p.status === 'Published').length;
    const draftCount = places.filter((p) => p.status.includes('Draft')).length;
    const reviewCount = places.filter((p) => p.status === 'Verification Pending').length;

    return [
      {
        id: 'dash-total-states',
        title: 'Total States',
        value: uniqueStatesCount.toLocaleString(),
        icon: 'map',
        subtitle: 'Unique State Circles',
        iconContainerClass: 'bg-primary/10 text-primary',
        badge: { text: 'National', variant: 'primary' as const },
      },
      {
        id: 'dash-total-districts',
        title: 'Total Districts',
        value: totalDistrictsCount.toLocaleString(),
        icon: 'location_city',
        subtitle: 'Monitored Jurisdictions',
        iconContainerClass: 'bg-amber-50 text-amber-800',
        badge: { text: 'Active Circles', variant: 'amber' as const },
      },
      {
        id: 'dash-district-total',
        title: 'District Records',
        value: places.length.toLocaleString(),
        icon: 'account_balance',
        subtitle: `${selectedDistrict}, ${selectedState}`,
        iconContainerClass: 'bg-surface-container text-primary',
        badge: { text: 'Current Scope', variant: 'primary' as const },
      },
      {
        id: 'dash-places-published',
        title: 'Published & Live',
        value: publishedCount.toLocaleString(),
        valueColorClass: 'text-emerald-700',
        icon: 'public',
        subtitle: 'Publicly live in registry',
        iconContainerClass: 'bg-emerald-50 text-emerald-700',
        badge: { text: 'Active', variant: 'emerald' as const },
      },
      {
        id: 'dash-in-draft',
        title: 'Draft & Review',
        value: (draftCount + reviewCount).toLocaleString(),
        valueColorClass: 'text-amber-800',
        icon: 'edit_note',
        subtitle: `${draftCount} Draft • ${reviewCount} Pending`,
        iconContainerClass: 'bg-amber-50 text-amber-700',
        badge: { text: 'In Pipeline', variant: 'neutral' as const },
      },
    ];
  }, [metrics, places, uniqueStatesCount, totalDistrictsCount, selectedDistrict, selectedState]);

  const filteredLedger = liveLedger.filter((item) => {
    if (ledgerStateFilter !== 'ALL' && item.state !== ledgerStateFilter) {
      return false;
    }
    if (ledgerDistrictFilter !== 'ALL' && item.district !== ledgerDistrictFilter) {
      return false;
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      const matchState = item.state.toLowerCase().includes(q);
      const matchDistrict = item.district.toLowerCase().includes(q);
      const matchCat = item.activeCategories?.toLowerCase().includes(q);
      return matchState || matchDistrict || matchCat;
    }
    return true;
  });

  return (
    <main
      id="dashboard-main-view"
      className="w-full flex-1 px-4 md:px-7 py-6 space-y-6 max-w-[1720px] mx-auto select-text animate-fade-in"
    >
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
        <div className="space-y-1.5">
          {/* Strict Context Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary flex-wrap">
            <span className="text-[0.66rem] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{selectedState}</span>
            </span>
            <span className="text-secondary font-bold">→</span>
            <span className="text-[0.66rem] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {selectedDistrict} District
            </span>
            <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active Workspace
            </span>
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            {selectedDistrict} District Dashboard
          </h1>
          <p className="text-xs text-secondary font-normal">
            Isolated content workspace for {selectedDistrict} District, {selectedState} Circle • National Heritage Registry
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-secondary flex-wrap">
          <button
            id="dash-add-record-btn"
            type="button"
            onClick={onNavigateAddRecord}
            className="px-3.5 py-2 rounded-lg bg-[#944600] hover:bg-[#7e3b00] active:scale-95 text-white font-semibold text-xs tracking-wide shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Add Record</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCityImage((isOpen) => !isOpen)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              showCityImage
                ? 'border-primary bg-primary text-white'
                : 'border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
            aria-expanded={showCityImage}
          >
            <span className="material-symbols-outlined text-sm">image</span>
            Cover Image
          </button>
        </div>
      </div>

      {showCityImage && (
        <section className="ml-auto w-full max-w-md rounded-xl border border-surface-container bg-surface-container-lowest p-3.5 shadow-sm animate-fade-in">
          <div className="flex gap-3">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container border border-surface-container">
              {!imageError && draftCityImageUrl ? (
                <img
                  src={draftCityImageUrl}
                  alt={`${selectedDistrict} cover banner preview`}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-lg">image</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label htmlFor="city-image-url" className="block text-xs font-semibold text-on-surface">
                {selectedDistrict} District Cover Image
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="city-image-url"
                  type="url"
                  value={draftCityImageUrl}
                  onChange={(event) => {
                    setDraftCityImageUrl(event.target.value);
                    setImageError(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSaveCityImage();
                  }}
                  placeholder="Paste a public image link"
                  className="min-w-0 flex-1 rounded-lg border border-surface-container bg-surface px-2.5 py-1.5 text-xs text-on-surface outline-none placeholder:text-secondary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleSaveCityImage}
                  disabled={!draftCityImageUrl.trim()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save
                </button>
              </div>
              <p className={`mt-1 text-[0.65rem] ${imageError ? 'text-red-600' : 'text-secondary'}`}>
                {imageError ? 'This image link could not be loaded.' : 'Public banner image representing this district.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic 5 High-Impact Metric KPI Cards: Total States, Total Districts, Scoped Records, Published, Draft/Review */}
      <section aria-label="Portal Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {displayMetrics.map((metric, idx) => (
          <MetricCard
            key={metric.id || `dash-metric-${idx}`}
            {...metric}
          />
        ))}
      </section>

      {/* Jurisdictional Publication Ledger with Structured State & District Filters */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
          <div>
            <h3 className="font-display font-bold text-base text-on-surface flex items-center gap-2">
              <span>Jurisdictional Publication Ledger</span>
              <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {uniqueStatesCount} States • {totalDistrictsCount} Districts
              </span>
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Comparative heritage documentation status across administrative districts. Filter by state to view its districts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                showFilterBar || ledgerStateFilter !== 'ALL' || ledgerDistrictFilter !== 'ALL' || filterQuery
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-secondary hover:text-on-surface border-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>Filter Ledger</span>
            </button>
          </div>
        </div>

        {/* Dedicated Structured State and District Filter Controls */}
        {(showFilterBar || ledgerStateFilter !== 'ALL' || ledgerDistrictFilter !== 'ALL' || filterQuery) && (
          <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. State Filter Dropdown */}
              <div>
                <label className="block text-[0.68rem] font-bold text-secondary uppercase tracking-wider mb-1">
                  Filter By State
                </label>
                <select
                  value={ledgerStateFilter}
                  onChange={(e) => {
                    setLedgerStateFilter(e.target.value);
                    setLedgerDistrictFilter('ALL');
                  }}
                  className="w-full bg-surface-container-lowest border border-surface-container rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All States ({uniqueStatesList.length})</option>
                  {uniqueStatesList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. District Filter Dropdown */}
              <div>
                <label className="block text-[0.68rem] font-bold text-secondary uppercase tracking-wider mb-1">
                  Filter By District {ledgerStateFilter !== 'ALL' && `in ${ledgerStateFilter}`}
                </label>
                <select
                  value={ledgerDistrictFilter}
                  onChange={(e) => setLedgerDistrictFilter(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-surface-container rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Districts ({ledgerDistrictsForState.length})</option>
                  {ledgerDistrictsForState.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Search Keyword Input */}
              <div>
                <label className="block text-[0.68rem] font-bold text-secondary uppercase tracking-wider mb-1">
                  Search Query
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-secondary text-sm absolute left-2.5 top-1/2 -translate-y-1/2">
                    search
                  </span>
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search jurisdiction name..."
                    className="w-full bg-surface-container-lowest border border-surface-container rounded-lg pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Active filter summary & Clear Action */}
            {(ledgerStateFilter !== 'ALL' || ledgerDistrictFilter !== 'ALL' || filterQuery) && (
              <div className="flex items-center justify-between pt-1 border-t border-surface-container/60 text-xs">
                <span className="text-secondary font-medium">
                  Showing {filteredLedger.length} jurisdiction(s) matching criteria
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLedgerStateFilter('ALL');
                    setLedgerDistrictFilter('ALL');
                    setFilterQuery('');
                  }}
                  className="text-primary hover:underline font-semibold text-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                  <span>Clear Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ledger Table */}
        <div className="border border-surface-container rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container-low/70 border-b border-surface-container text-secondary text-[0.68rem] uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3 pl-4">State / Territory</th>
                  <th className="p-3">District / Division</th>
                  <th className="p-3">Active Categories</th>
                  <th className="p-3 text-right">Published</th>
                  <th className="p-3 text-right">Draft Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container bg-surface-container-lowest">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-secondary text-xs">
                      No jurisdiction records matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((row, idx) => {
                    const isCurrentSelection =
                      row.state === selectedState && row.district === selectedDistrict;

                    return (
                      <tr
                        key={`${row.state}-${row.district}-${idx}`}
                        onClick={() => onSelectJurisdiction(row.state, row.district)}
                        className={`hover:bg-surface-container-low/50 transition-colors cursor-pointer ${
                          isCurrentSelection || row.isHighlighted
                            ? 'bg-amber-500/10 font-semibold'
                            : ''
                        }`}
                        title={`Click to set operational scope to ${row.district}, ${row.state}`}
                      >
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[0.65rem] shrink-0 ${
                                isCurrentSelection || row.isHighlighted
                                  ? 'bg-primary text-white'
                                  : 'bg-surface-container text-on-surface-variant border border-surface-container'
                              }`}
                            >
                              {row.code}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs ${
                                  isCurrentSelection || row.isHighlighted
                                    ? 'font-semibold text-on-surface'
                                    : 'font-medium text-on-surface'
                                }`}
                              >
                                {row.state}
                              </span>
                              {isCurrentSelection && (
                                <span className="text-[0.6rem] font-bold px-1.5 py-0.2 bg-amber-500/20 text-primary rounded">
                                  Selected Scope
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div
                            className={`flex items-center gap-1.5 text-xs ${
                              isCurrentSelection || row.isHighlighted
                                ? 'font-semibold text-on-surface'
                                : 'font-medium text-on-surface'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-xs ${
                                isCurrentSelection || row.isHighlighted
                                  ? 'text-primary'
                                  : 'text-secondary'
                              }`}
                            >
                              location_on
                            </span>
                            {row.district}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded bg-surface-container text-on-surface border border-surface-container inline-flex items-center gap-1">
                            <span
                              className={`material-symbols-outlined text-xs ${
                                isCurrentSelection || row.isHighlighted
                                  ? 'text-primary'
                                  : 'text-secondary'
                              }`}
                            >
                              category
                            </span>
                            {row.activeCategories}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`font-display font-semibold text-sm ${
                              isCurrentSelection || row.isHighlighted
                                ? 'text-primary'
                                : 'text-on-surface'
                            }`}
                          >
                            {row.published}
                          </span>
                          <span className="text-[0.68rem] text-secondary block font-normal">
                            Published
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-display font-semibold text-secondary text-sm">
                            {row.draft}
                          </span>
                          <span className="text-[0.68rem] text-secondary block font-normal">
                            Draft
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

// Aliases for compatibility
export const DashboardView = DashboardPage;
