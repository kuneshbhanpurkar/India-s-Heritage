import React from 'react';
import { AdminSummary } from '../api';
import { ViewType, MetricItem, JurisdictionLedgerItem } from '../types';
import { MetricCard } from './common/MetricCard';

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
  selectedState: string;
  selectedDistrict: string;
  onSelectJurisdiction: (state: string, district: string) => void;
  metrics?: MetricItem[];
  ledger?: JurisdictionLedgerItem[];
  cityBannerUrl: string;
  onSaveCityBanner: (url: string) => void;
  summary?: AdminSummary | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  selectedState,
  selectedDistrict,
  onSelectJurisdiction,
  metrics,
  ledger,
  cityBannerUrl,
  onSaveCityBanner,
  summary,
}) => {
  const [filterQuery, setFilterQuery] = React.useState('');
  const [showFilterBar, setShowFilterBar] = React.useState(false);
  const [showCityImage, setShowCityImage] = React.useState(false);
  const [draftCityImageUrl, setDraftCityImageUrl] = React.useState(cityBannerUrl);
  const [imageError, setImageError] = React.useState(false);

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

  const displayMetrics = metrics || (summary ? [
    { id: 'dash-active-users', title: 'Total Active Users', value: summary.users.active.toLocaleString(), icon: 'group', subtitle: 'Registered custodians', iconContainerClass: 'bg-surface-container text-primary' },
    { id: 'dash-places-published', title: 'Places Published', value: summary.content.published.toLocaleString(), icon: 'fort', subtitle: 'Verified heritage sites', actionLabel: 'View ->', onClick: () => onNavigate('popular-places'), iconContainerClass: 'bg-surface-container text-primary' },
    { id: 'dash-in-review', title: 'In Review / Pending', value: summary.content.review.toLocaleString(), icon: 'pending_actions', subtitle: 'Pending circular review', iconContainerClass: 'bg-surface-container text-secondary' },
    { id: 'dash-states-uts', title: 'States & UTs', value: summary.coverage.activeStates.toLocaleString(), icon: 'map', subtitle: 'Active jurisdictions', iconContainerClass: 'bg-surface-container text-secondary' },
    { id: 'dash-districts', title: 'Districts', value: summary.coverage.activeDistricts.toLocaleString(), icon: 'location_city', subtitle: 'Covered jurisdictions', iconContainerClass: 'bg-surface-container text-secondary' },
  ] : []);

  const liveLedger = ledger || summary?.ledger || [];

  const filteredLedger = liveLedger.filter(
    (item) =>
      item.state.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.district.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.activeCategories.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <main
      id="dashboard-main-view"
      className="w-full flex-1 px-4 md:px-7 py-6 space-y-6 max-w-[1720px] mx-auto select-text"
    >
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Dharohar Dashboard
            </h1>
            <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-surface-container uppercase tracking-wider">
              National Portal
            </span>
          </div>
          <p className="text-xs text-secondary font-normal">
            National Heritage Surveillance &amp; Monitoring Portal • Republic of India
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <span className="inline-flex items-center gap-1.5 text-xs text-secondary font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            System Operational
          </span>
          <button
            type="button"
            onClick={() => setShowCityImage((isOpen) => !isOpen)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              showCityImage
                ? 'border-primary bg-primary text-white'
                : 'border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
            aria-expanded={showCityImage}
          >
            <span className="material-symbols-outlined text-sm">image</span>
            City Image
          </button>
        </div>
      </div>

      {showCityImage && (
        <section className="ml-auto w-full max-w-md rounded-xl border border-surface-container bg-surface-container-lowest p-3 shadow-sm">
          <div className="flex gap-3">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
              {!imageError && draftCityImageUrl ? (
                <img
                  src={draftCityImageUrl}
                  alt="City banner preview"
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
                City banner image
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
                  className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save
                </button>
              </div>
              <p className={`mt-1 text-[0.65rem] ${imageError ? 'text-red-600' : 'text-secondary'}`}>
                {imageError ? 'This image link could not be loaded.' : 'Use a public direct image link for the website and app banner.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic 5 High-Impact Metric KPI Cards */}
      <section aria-label="Portal Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {displayMetrics.map((metric, idx) => (
          <MetricCard
            key={metric.id || `dash-metric-${idx}`}
            {...metric}
          />
        ))}
      </section>

      {/* Jurisdictional Publication Ledger */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
          <div>
            <h3 className="font-display font-bold text-base text-on-surface">
              Jurisdictional Publication Ledger
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              State and district level heritage documentation status across administrative circles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                showFilterBar
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-secondary hover:text-on-surface border-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>Filter Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('popular-places')}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-surface-container transition-colors"
            >
              View Full Directory
            </button>
          </div>
        </div>

        {/* Dynamic Filter Search Bar */}
        {showFilterBar && (
          <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container flex items-center gap-2 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-secondary text-sm">search</span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search by state, district, or category..."
              className="w-full bg-transparent text-xs text-on-surface placeholder:text-secondary focus:outline-none"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="text-secondary hover:text-on-surface text-xs"
              >
                Clear
              </button>
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
                      No jurisdiction records matching filter query.
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
                            ? 'bg-surface-container-low/40'
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
                                  Selected
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
