import React, { useState, useMemo } from 'react';
import { HeritagePlace, MetricItem, FilterTabItem } from '../types';
import {
  MetricCard,
  FilterTabs,
  Pagination,
  PlaceTableRow,
} from './common';
import { Sparkles, Plus, Search, MapPin, Layers } from 'lucide-react';

export interface SectionContentManagerProps {
  sectionSlug: string;
  sectionTitle: string;
  sectionDescription?: string;
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

export const SectionContentManager: React.FC<SectionContentManagerProps> = ({
  sectionSlug,
  sectionTitle,
  sectionDescription,
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
      { id: 'metric-total', title: `Total ${sectionTitle}`, value: places.length.toLocaleString(), icon: 'account_balance', subtitle: `Under ${selectedDistrict}, ${selectedState}`, iconContainerClass: 'bg-surface-container text-primary' },
      { id: 'metric-published', title: 'Published & Live', value: published.toLocaleString(), valueColorClass: 'text-emerald-700', icon: 'public', subtitle: 'Publicly live & verified', iconContainerClass: 'bg-emerald-50 text-emerald-700' },
      { id: 'metric-draft', title: 'Draft In Curation', value: draft.toLocaleString(), valueColorClass: 'text-amber-800', icon: 'edit_note', subtitle: 'In curation pipeline', iconContainerClass: 'bg-amber-50 text-amber-700' },
      { id: 'metric-review', title: 'Pending Review', value: review.toLocaleString(), valueColorClass: 'text-tertiary', icon: 'gavel', subtitle: 'Pending administrative verification', iconContainerClass: 'bg-red-50 text-tertiary' },
    ];
  }, [metrics, places, sectionTitle, selectedDistrict, selectedState]);

  // Dynamic counts for tabs
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
      label: 'All Section Records',
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
      id={`section-manager-${sectionSlug}`}
      className="w-full flex-1 px-4 md:px-7 py-6 space-y-6 mx-auto select-text animate-fade-in"
    >
      <div className="space-y-6">
        {/* Context Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-container">
          <div className="space-y-1.5">
            {/* Strict Context Badge: State -> District -> Section */}
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary flex-wrap">
              <span className="text-[0.66rem] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span>{selectedState}</span>
              </span>
              <span className="text-secondary font-bold">→</span>
              <span className="text-[0.66rem] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {selectedDistrict}
              </span>
              <span className="text-secondary font-bold">→</span>
              <span className="text-on-surface-variant font-semibold">
                {sectionTitle}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight leading-tight flex items-center gap-2">
              <span>{sectionTitle}</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-container text-secondary">
                /{sectionSlug}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-secondary max-w-2xl">
              {sectionDescription || `Manage curated heritage records, coordinates, media archives, and registry entries for ${sectionTitle} in ${selectedDistrict}.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id={`add-${sectionSlug}-btn`}
              type="button"
              onClick={onNavigateAddRecord}
              className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs tracking-wide shadow-md hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add {sectionTitle}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayMetrics.map((metric) => (
            <MetricCard key={metric.id} {...metric} />
          ))}
        </div>

        {/* Table Filter Tabs and Actions Toolbar */}
        <div className="bg-surface-card rounded-2xl border border-surface-container shadow-xs overflow-hidden">
          <div className="p-4 border-b border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4">
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            />

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                search
              </span>
              <input
                id={`search-${sectionSlug}-input`}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={`Search ${sectionTitle.toLowerCase()}...`}
                className="w-full bg-surface-container/50 border border-surface-container rounded-xl pl-9 pr-4 py-1.5 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container/30 text-[0.68rem] font-bold text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Record &amp; Identity</th>
                  <th className="py-3 px-4">Registry Code</th>
                  <th className="py-3 px-4">Category / Dynasty</th>
                  <th className="py-3 px-4">Jurisdiction</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/40 text-xs">
                {paginatedPlaces.length > 0 ? (
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
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-secondary">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-surface-container text-primary flex items-center justify-center mx-auto">
                          <Layers className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-on-surface text-sm">
                          No {sectionTitle} Found
                        </h4>
                        <p className="text-xs text-secondary leading-relaxed">
                          {searchQuery
                            ? `No records matching "${searchQuery}" in ${sectionTitle} for ${selectedDistrict}.`
                            : `There are currently no cataloged records in ${sectionTitle} for ${selectedDistrict}, ${selectedState}.`}
                        </p>
                        <button
                          type="button"
                          onClick={onNavigateAddRecord}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-hover transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create First Record in {sectionTitle}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
        </div>
      </div>
    </main>
  );
};
