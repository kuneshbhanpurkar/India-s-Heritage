import React, { useState, useMemo } from 'react';
import { HeritagePlace, MetricItem, FilterTabItem } from '../types';
import {
  MetricCard,
  FilterTabs,
  Pagination,
  PlaceTableRow,
} from '../components/common';

export interface PopularPlacesPageProps {
  places: HeritagePlace[];
  onNavigateAddRecord: () => void;
  onEditPlace: (place: HeritagePlace) => void;
  onViewPlace: (place: HeritagePlace) => void;
  onDeletePlace?: (id: string) => void;
  onQuickPublishPlace?: (place: HeritagePlace) => void;
  selectedState: string;
  selectedDistrict: string;
  metrics?: MetricItem[];
}

export const PopularPlacesPage: React.FC<PopularPlacesPageProps> = ({
  places,
  onNavigateAddRecord,
  onEditPlace,
  onViewPlace,
  onDeletePlace,
  onQuickPublishPlace,
  selectedState,
  selectedDistrict,
  metrics,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'review'>('published');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic KPI Metrics
  const displayMetrics = useMemo(() => {
    if (metrics) return metrics;
    const published = places.filter((p) => p.status === 'Published').length;
    const draft = places.filter((p) => p.status.includes('Draft')).length;
    const review = places.filter((p) => p.status === 'Verification Pending').length;
    return [
      { id: 'pop-metric-total', title: 'Total Monuments', value: places.length.toLocaleString(), icon: 'account_balance', subtitle: `Under ${selectedDistrict}, ${selectedState}`, iconContainerClass: 'bg-surface-container text-primary' },
      { id: 'pop-metric-published', title: 'Published & Live', value: published.toLocaleString(), valueColorClass: 'text-emerald-700', icon: 'public', subtitle: 'Publicly live & verified', iconContainerClass: 'bg-emerald-50 text-emerald-700' },
      { id: 'pop-metric-draft', title: 'Draft In Curation', value: draft.toLocaleString(), valueColorClass: 'text-amber-800', icon: 'edit_note', subtitle: 'In curation pipeline', iconContainerClass: 'bg-amber-50 text-amber-700' },
      { id: 'pop-metric-review', title: 'Pending Review', value: review.toLocaleString(), valueColorClass: 'text-tertiary', icon: 'gavel', subtitle: 'Pending circular verification', iconContainerClass: 'bg-red-50 text-tertiary' },
    ];
  }, [metrics, places, selectedDistrict, selectedState]);

  // Dynamic tab counts
  const tabCounts = useMemo(() => {
    const published = places.filter((p) => p.status === 'Published').length;
    const draft = places.filter((p) => p.status.includes('Draft')).length;
    const review = places.filter((p) => p.status === 'Verification Pending').length;
    return {
      published: published.toLocaleString(),
      draft: draft.toLocaleString(),
      review: review.toLocaleString(),
      all: places.length.toLocaleString(),
    };
  }, [places]);

  const filterTabs: FilterTabItem<'all' | 'published' | 'draft' | 'review'>[] = [
    {
      id: 'published',
      label: 'Published',
      dotColor: 'bg-emerald-500',
      count: tabCounts.published,
      badgeClass: 'bg-emerald-50 text-emerald-800',
    },
    {
      id: 'draft',
      label: 'Draft',
      dotColor: 'bg-amber-500',
      count: tabCounts.draft,
      badgeClass: 'bg-amber-50 text-amber-800',
    },
    {
      id: 'review',
      label: 'In Review',
      dotColor: 'bg-tertiary',
      count: tabCounts.review,
      badgeClass: 'bg-red-50 text-tertiary',
    },
    {
      id: 'all',
      label: 'All Heritage Records',
      count: tabCounts.all,
      badgeClass: 'bg-surface-container text-on-surface-variant',
    },
  ];

  const filteredPlaces = places.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'published') return p.status === 'Published';
    if (activeTab === 'draft') return p.status.includes('Draft');
    if (activeTab === 'review') return p.status === 'Verification Pending';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPlaces.length / parseInt(rowsPerPage, 10)));
  const paginatedPlaces = filteredPlaces.slice(
    (currentPage - 1) * parseInt(rowsPerPage, 10),
    currentPage * parseInt(rowsPerPage, 10)
  );

  return (
    <main
      id="popular-places-main-view"
      className="w-full flex-1 px-4 md:px-7 py-6 space-y-6 max-w-[1720px] mx-auto select-text"
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-container">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
                Popular Heritage Places
              </h1>
              <span className="text-[0.68rem] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-primary border border-primary/20 uppercase tracking-wide">
                Directory
              </span>
            </div>
            <p className="text-xs text-secondary">
              Managing heritage directory and registry entries for {selectedDistrict}, {selectedState}.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="add-popular-place-btn"
              type="button"
              onClick={onNavigateAddRecord}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs tracking-wide shadow-sm hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>+ Add Heritage Record</span>
            </button>
          </div>
        </div>

        {/* Dynamic 4 Metric KPI Cards */}
        <section aria-label="Portal Metrics" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 lg:grid-cols-4">
          {displayMetrics.map((metric, idx) => (
            <MetricCard
              key={metric.id || `pop-metric-${idx}`}
              {...metric}
            />
          ))}
        </section>

        {/* Directory & Records Section */}
        <section
          id="popular-places-directory-section"
          aria-label="Popular Places Directory"
          className="bg-surface-container-lowest rounded-xl p-5 md:p-6 border border-surface-container shadow-sm space-y-5"
        >
          {/* Section Toolbar Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-container pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-surface-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">fort</span>
                </div>
                <h2 className="font-display text-base md:text-lg font-bold text-on-surface tracking-tight">
                  Directory &amp; Monument Records
                </h2>
              </div>
              <p className="text-xs text-secondary">
                Search, filter, edit, and curate registered architectural and geographical heritage records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Search filter input */}
              <div className="relative flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 border border-surface-container">
                <span className="material-symbols-outlined text-secondary text-sm mr-1.5">search</span>
                <input
                  id="popular-places-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search monument..."
                  className="bg-transparent text-xs text-on-surface focus:outline-none w-36 sm:w-44"
                />
              </div>

              {/* Rows per page selector */}
              <div className="flex items-center gap-1.5 text-xs text-secondary bg-surface-container-low rounded-lg px-2.5 py-1.5 border border-surface-container">
                <span>Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-semibold text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="5" className="bg-surface-container-lowest text-on-surface">5</option>
                  <option value="10" className="bg-surface-container-lowest text-on-surface">10</option>
                  <option value="25" className="bg-surface-container-lowest text-on-surface">25</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <FilterTabs
            tabs={filterTabs}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
          />

          {/* Records Table */}
          <div className="border border-surface-container rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-surface-container-low/70 border-b border-surface-container text-secondary text-[0.68rem] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                      Monument / Record
                    </th>
                    <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                      Registry Code
                    </th>
                    <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                      Category
                    </th>
                    <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                      Jurisdiction
                    </th>
                    <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                      Status
                    </th>
                    <th className="py-3 pr-5 pl-4 text-right font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container bg-surface-container-lowest">
                  {paginatedPlaces.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-secondary text-xs">
                        No heritage records found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPlaces.map((place) => (
                      <PlaceTableRow
                        key={place.id}
                        place={place}
                        onEdit={onEditPlace}
                        onView={onViewPlace}
                        onDelete={onDeletePlace || (() => {})}
                        onQuickPublish={onQuickPublishPlace}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredPlaces.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPlaces.length}
              rowsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setCurrentPage(1);
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
};

// Aliases for backwards compatibility
export const PopularPlacesView = PopularPlacesPage;
export type PopularPlacesViewProps = PopularPlacesPageProps;
