import React from 'react';
import { HeritageSite } from '../types';

interface MonumentCardProps {
  site: HeritageSite;
  variant?: 'grid' | 'carousel' | 'compact';
  isFavorite?: boolean;
  onToggleFavorite?: (siteId: string) => void;
  onSelectSite?: (site: HeritageSite) => void;
  onViewMonograph?: (site: HeritageSite) => void;
  onGetDirections?: (site: HeritageSite) => void;
  isActive?: boolean;
}

export const MonumentCard: React.FC<MonumentCardProps> = ({
  site,
  variant = 'grid',
  isFavorite = false,
  onToggleFavorite,
  onSelectSite,
  onViewMonograph,
  onGetDirections,
  isActive = false,
}) => {
  // CAROUSEL VARIANT (Used in Around Me bottom dock)
  if (variant === 'carousel') {
    return (
      <div
        onClick={() => onSelectSite?.(site)}
        className={`w-[280px] sm:w-[320px] shrink-0 snap-start bg-[#ffffff] rounded-xl p-3 shadow-md hover:shadow-xl flex flex-col justify-between relative group hover:-translate-y-1 transition-all cursor-pointer border ${
          isActive ? 'border-[#a14009] ring-2 ring-[#a14009]/30' : 'border-[#e2e2e2]'
        }`}
      >
        {site.statusBadge && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2 py-0.5 rounded bg-[#a14009] text-white text-[9px] uppercase font-bold tracking-wider shadow">
              {site.statusBadge}
            </span>
          </div>
        )}

        <div>
          {/* Card Media Preview */}
          <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2.5 bg-[#eeeeee]">
            <img
              alt={site.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src={site.image}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-white text-[10px]">
              <span className="material-symbols-outlined text-[12px] text-[#ffe088]">star</span>
              <span className="font-bold">{site.rating}</span>
              <span className="opacity-80">({site.reviewsCount})</span>
            </div>
          </div>

          {/* Titles & Favorite Button */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-[16px] text-[#1a1c1c] leading-tight font-semibold truncate">
                {site.name}
              </h3>
              <p className="text-[11px] text-[#a14009] font-medium mt-0.5 truncate">
                {site.subTitle || site.dynasty}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(site.id);
              }}
              className="text-[#747878] hover:text-[#a14009] p-1 transition-colors shrink-0"
              title={isFavorite ? 'Remove from Saved' : 'Save to Favorites'}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  isFavorite ? 'text-[#a14009] fill-1' : ''
                }`}
              >
                favorite
              </span>
            </button>
          </div>

          {/* Distance & Status Meta */}
          <div className="mt-2 flex items-center gap-2 text-[#444748] text-[10px]">
            <span className="flex items-center gap-1 text-[#a14009] font-semibold">
              <span className="material-symbols-outlined text-[12px]">near_me</span>
              {site.distanceKm} km away
            </span>
            <span>•</span>
            <span className="text-[#735c00] font-medium truncate">{site.openingHours}</span>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 border-t border-[#f3f3f3]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGetDirections?.(site);
            }}
            className="flex-1 py-1.5 px-3 rounded bg-[#a14009] hover:bg-[#7d2d00] text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px]">directions_walk</span>
            <span>Directions ({site.directionTimeMinutes} min)</span>
          </button>
          {site.hasAudio ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewMonograph?.(site);
              }}
              className="py-1.5 px-2.5 rounded bg-[#ffdbcd] text-[#360f00] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#ffb596] transition-colors"
            >
              <span className="material-symbols-outlined text-[12px]">headphones</span>
              <span>Audio</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewMonograph?.(site);
              }}
              className="py-1.5 px-2.5 rounded bg-[#f3f3f3] hover:bg-[#eeeeee] text-[#1a1c1c] text-[11px] font-semibold transition-colors"
            >
              Monograph
            </button>
          )}
        </div>
      </div>
    );
  }

  // STANDARD GRID VARIANT (Used in Home Page & Explore Grid)
  return (
    <article
      onClick={() => onViewMonograph?.(site)}
      className="bg-white rounded-xl overflow-hidden border border-[#e7e2d9] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer"
    >
      <div className="relative h-44 sm:h-48 overflow-hidden bg-neutral-100">
        <img
          alt={site.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          src={site.image}
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="bg-white/90 backdrop-blur-xs text-[10px] font-semibold text-[#1a1a1a] px-2 py-0.5 rounded shadow-xs">
            {site.verifiedType || 'ASI Verified'}
          </span>
          <span className="bg-[#A0522D]/90 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-xs">
            {site.location.includes('MP') || site.location.includes('Indore')
              ? 'Madhya Pradesh'
              : site.location}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(site.id);
          }}
          className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs p-1.5 rounded-full text-[#1a1a1a] hover:text-[#ba1a1a] transition-colors shadow-xs"
          title={isFavorite ? 'Saved' : 'Save'}
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              isFavorite ? 'text-[#a14009] fill-1' : ''
            }`}
          >
            favorite
          </span>
        </button>

        {/* Rating Overlay */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
          ★ {site.rating}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0522D] block mb-1">
            {site.dynasty}
          </span>
          <h3 className="font-serif text-base font-bold text-[#1a1a1a] group-hover:text-[#A0522D] transition-colors mb-1.5 leading-snug">
            {site.name}
          </h3>
          <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed">
            {site.description}
          </p>
        </div>

        <div className="pt-3.5 mt-3 border-t border-[#e7e2d9]/60 flex items-center justify-between">
          <span className="text-[11px] text-[#747878] flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#A0522D]">location_on</span>
            {site.location}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewMonograph?.(site);
            }}
            className="inline-flex items-center gap-1 bg-[#A0522D] hover:bg-[#843e1d] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <span>View Monograph</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>
      </div>
    </article>
  );
};
