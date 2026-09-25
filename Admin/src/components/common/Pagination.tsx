import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  rowsPerPage: string | number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rows: string) => void;
  rowOptions?: (string | number)[];
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowOptions = ['10', '25', '50'],
  itemLabel = 'verified heritage places',
  className = '',
}) => {
  const pageSize = Number(rowsPerPage) || 10;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`px-4 py-3 bg-surface-container-low/70 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary ${className}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span>
          Showing{' '}
          <span className="font-semibold text-on-surface">
            {startItem}-{endItem}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-on-surface">
            {totalItems.toLocaleString()}
          </span>{' '}
          {itemLabel}
        </span>
        {onRowsPerPageChange && (
          <>
            <span className="text-outline-variant">•</span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="rows-per-page">Rows:</label>
              <select
                id="rows-per-page"
                value={String(rowsPerPage)}
                onChange={(e) => onRowsPerPageChange(e.target.value)}
                className="bg-surface-container-lowest border border-surface-container rounded px-1.5 py-0.5 text-on-surface font-semibold text-xs focus:outline-none"
              >
                {rowOptions.map((opt) => (
                  <option key={String(opt)} value={String(opt)}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="p-1.5 rounded border border-surface-container bg-surface-container-lowest text-secondary hover:bg-surface-container disabled:opacity-40 transition-colors"
          title="Previous Page"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        {[1, 2, 3].map((page) => {
          if (page > totalPages) return null;
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-white font-semibold'
                  : 'border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
            >
              {page}
            </button>
          );
        })}

        {totalPages > 3 && (
          <>
            <span className="px-1 text-secondary">...</span>
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                currentPage === totalPages
                  ? 'border-primary bg-primary text-white font-semibold'
                  : 'border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="p-1.5 rounded border border-surface-container bg-surface-container-lowest text-secondary hover:bg-surface-container disabled:opacity-40 transition-colors"
          title="Next Page"
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
