import React, { useState, useMemo } from 'react';
import { HeritagePlace, MetricItem, FilterTabItem } from '../types';
import {
  MetricCard,
  FilterTabs,
  Pagination,
  PlaceTableRow,
} from './common';

export interface PopularPlacesViewProps {
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

export const PopularPlacesView: React.FC<PopularPlacesViewProps> = ({
  places,
  onNavigateAddRecord,
  onEditPlace,
  onViewPlace,
  onDeletePlace,
  onQuickPublishPlace,
  selectedState,
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
      { id: 'metric-total', title: 'Total Places', value: places.length.toLocaleString(), icon: 'account_balance', subtitle: 'Across all registered heritage categories', iconContainerClass: 'bg-surface-container text-primary' },
      { id: 'metric-published', title: 'Published Places', value: published.toLocaleString(), valueColorClass: 'text-emerald-700', icon: 'public', subtitle: 'Publicly live & verified', iconContainerClass: 'bg-emerald-50 text-emerald-700' },
      { id: 'metric-draft', title: 'Draft Places', value: draft.toLocaleString(), valueColorClass: 'text-amber-800', icon: 'edit_note', subtitle: 'In curation & cataloging pipeline', iconContainerClass: 'bg-amber-50 text-amber-700' },
      { id: 'metric-review', title: 'In Review', value: review.toLocaleString(), valueColorClass: 'text-tertiary', icon: 'gavel', subtitle: 'Pending administrative verification', iconContainerClass: 'bg-red-50 text-tertiary' },
    ];
  }, [metrics, places]);

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
      label: 'All Directory Records',
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

    if (activeTab === 'published') {
      return p.status === 'Published';
    }
    if (activeTab === 'draft') {
      return p.status.includes('Draft');
    }
    if (activeTab === 'review') {
      return p.status === 'Verification Pending';
    }
    return true;
  });
  const paginatedPlaces = filteredPlaces.slice((currentPage - 1) * Number(rowsPerPage), currentPage * Number(rowsPerPage));

  const handleDelete = (id: string) => {
    if (onDeletePlace) {
      onDeletePlace(id);
    } else {
      alert('Record deletion simulated.');
    }
  };

  const handleQuickPublish = (place: HeritagePlace) => {
    if (onQuickPublishPlace) {
      onQuickPublishPlace(place);
    } else {
      alert(`Published ${place.name}`);
    }
  };

  return (
    <main
      id="popular-places-main-view"
      className="w-full flex-1 px-4 md:px-7 py-6 space-y-6 mx-auto select-text"
    >
      <div className="space-y-6">
        {/* Header & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-container">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary flex-wrap">
              <span className="text-[0.66rem] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                Heritage Surveillance &amp; Directory Governance
              </span>
              <span className="text-secondary">•</span>
              <span className="text-on-surface-variant font-medium">
                {selectedState} Circle
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface tracking-tight leading-tight">
              Popular Places
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Add New Place Record button */}
            <button
              id="add-new-place-record-btn"
              type="button"
              onClick={onNavigateAddRecord}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add New Place Record</span>
            </button>
          </div>
        </div>

        {/* Dynamic 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayMetrics.map((metric, idx) => (
            <MetricCard
              key={metric.id || `popular-metric-${idx}`}
              {...metric}
            />
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-4 space-y-3.5 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-auto flex-1 max-w-md flex items-center gap-2">
              <div className="relative flex-1 flex items-center bg-surface-container-low rounded-lg px-3 py-2 border border-surface-container focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-secondary text-base mr-2 shrink-0">
                  search
                </span>
                <input
                  id="places-search-input"
                  className="bg-transparent w-full text-xs text-on-surface placeholder:text-secondary focus:outline-none"
                  placeholder="Search places by name, monument ID, or region..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-secondary hover:text-on-surface text-xs ml-1"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-surface-container transition-colors shrink-0"
              >
                Search
              </button>
            </div>

            {/* Reusable Filter Tabs */}
            <FilterTabs
              tabs={filterTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        {/* Places Data Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container-low/80 text-[0.68rem] uppercase font-bold text-secondary tracking-wider border-b border-surface-container">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Image</th>
                  <th className="py-3 px-4">Name place</th>
                  <th className="py-3 px-4">Type / Category</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Publication Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {filteredPlaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary">
                      No heritage places matching the current filter.
                    </td>
                  </tr>
                ) : (
                  paginatedPlaces.map((place) => (
                    <PlaceTableRow
                      key={place.id}
                      place={place}
                      onView={onViewPlace}
                      onEdit={onEditPlace}
                      onDelete={handleDelete}
                      onQuickPublish={handleQuickPublish}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Reusable Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPlaces.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            rowOptions={['10', '25', '50']}
            itemLabel="verified heritage places"
          />
        </div>
      </div>
    </main>
  );
};
