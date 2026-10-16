import React, { useRef, useState, useEffect } from 'react';
import { HeritageSite } from '../types';
import { MonumentCard } from './MonumentCard';

interface CategoryCarouselRowProps {
  items: HeritageSite[];
  favorites: string[];
  onViewMonograph: (site: HeritageSite) => void;
  onToggleFavorite: (id: string) => void;
  onGetDirections: (site: HeritageSite) => void;
}

export const CategoryCarouselRow: React.FC<CategoryCarouselRowProps> = ({
  items,
  favorites,
  onViewMonograph,
  onToggleFavorite,
  onGetDirections,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check whether content overflows container width and track scroll limits
  const updateScrollState = () => {
    const el = containerRef.current;
    if (!el) return;

    const isOverflowing = el.scrollWidth > el.clientWidth + 6;
    setHasOverflow(isOverflowing);

    if (isOverflowing) {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  };

  useEffect(() => {
    // Initial check after paint
    const timer = setTimeout(updateScrollState, 80);

    const el = containerRef.current;
    if (!el) return () => clearTimeout(timer);

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateScrollState());
      resizeObserver.observe(el);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;

    // Scroll by roughly 2 cards width
    const firstChild = el.firstElementChild as HTMLElement | null;
    const cardStep = firstChild ? firstChild.offsetWidth + 24 : 320;
    const amount = direction === 'left' ? -cardStep * 1.5 : cardStep * 1.5;

    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full group/carousel">
      {/* Left Scroll Button - ONLY shown if content overflows AND can scroll left */}
      {hasOverflow && canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -translate-x-2 sm:-translate-x-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-md shadow-xl text-[#1a1c1c] hover:text-[#a14009] flex items-center justify-center hover:bg-white active:scale-95 transition-all border border-[#e2e2e2] cursor-pointer"
          title="Previous items"
          aria-label="Scroll left"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
      )}

      {/* Horizontal Scrollable Row */}
      <div
        ref={containerRef}
        onScroll={updateScrollState}
        className="w-full flex items-stretch gap-6 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((site) => (
          <div
            key={site.id}
            className="w-[280px] sm:w-[320px] lg:w-[330px] shrink-0 snap-start flex flex-col"
          >
            <MonumentCard
              site={site}
              isFavorite={favorites.includes(site.id)}
              onSelectSite={onViewMonograph}
              onViewMonograph={onViewMonograph}
              onToggleFavorite={onToggleFavorite}
              onGetDirections={onGetDirections}
            />
          </div>
        ))}
      </div>

      {/* Right Scroll Button - ONLY shown if content overflows AND can scroll right */}
      {hasOverflow && canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 translate-x-2 sm:translate-x-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-md shadow-xl text-[#1a1c1c] hover:text-[#a14009] flex items-center justify-center hover:bg-white active:scale-95 transition-all border border-[#e2e2e2] cursor-pointer"
          title="Next items"
          aria-label="Scroll right"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_right</span>
        </button>
      )}
    </div>
  );
};
