import React from 'react';
import { HeritageSite } from '../types';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedSites: HeritageSite[];
  onRemoveFavorite: (siteId: string) => void;
  onViewMonograph: (site: HeritageSite) => void;
  onOpenDirections: (site: HeritageSite) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  savedSites,
  onRemoveFavorite,
  onViewMonograph,
  onOpenDirections,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-full sm:max-w-md bg-[#F4F3EE] h-full shadow-2xl flex flex-col border-l border-[#e2e2e2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 bg-white border-b border-[#e2e2e2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#a14009] text-2xl">favorite</span>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1a1c1c] leading-tight">
                Saved Heritage Sites
              </h2>
              <span className="text-xs text-[#747878] font-medium">
                {savedSites.length} {savedSites.length === 1 ? 'site' : 'sites'} in your itinerary
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#eeeeee] flex items-center justify-center text-[#1a1c1c] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Saved List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedSites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#747878]">
              <span className="material-symbols-outlined text-4xl mb-2 text-[#a14009]">
                favorite_border
              </span>
              <p className="font-serif text-base font-bold text-[#1a1c1c]">No saved sites yet</p>
              <p className="text-xs mt-1 max-w-xs">
                Tap the heart icon on any monument card across the dashboard or map to save it here.
              </p>
            </div>
          ) : (
            savedSites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-xl p-3 border border-[#e2e2e2] shadow-xs flex items-center gap-3 hover:shadow-md transition-shadow group"
              >
                <img
                  src={site.image}
                  alt={site.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 cursor-pointer"
                  onClick={() => {
                    onViewMonograph(site);
                    onClose();
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-serif text-sm font-bold text-[#1a1c1c] truncate cursor-pointer hover:text-[#a14009]"
                    onClick={() => {
                      onViewMonograph(site);
                      onClose();
                    }}
                  >
                    {site.name}
                  </h3>
                  <p className="text-xs text-[#a14009] truncate">{site.dynasty}</p>
                  <p className="text-[11px] text-[#747878] flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    <span>{site.distanceKm} km away</span>
                  </p>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => onRemoveFavorite(site.id)}
                    className="p-1 text-[#747878] hover:text-[#ba1a1a] rounded transition-colors cursor-pointer"
                    title="Remove from saved"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenDirections(site);
                      onClose();
                    }}
                    className="p-1 text-[#a14009] hover:bg-[#ffdbcd] rounded transition-colors cursor-pointer"
                    title="Get directions"
                  >
                    <span className="material-symbols-outlined text-[18px]">directions</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {savedSites.length > 0 && (
          <div className="p-4 bg-white border-t border-[#e2e2e2] flex items-center justify-between gap-3">
            <span className="text-xs text-[#747878]">
              Ready to explore {savedSites.length} locations
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
