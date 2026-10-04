import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { HeritageSite } from '../types';
import { MonumentCard } from './MonumentCard';
import { getNearby, toHeritageSite } from '../api';

interface AroundMeMapProps {
  sites: HeritageSite[];
  selectedSite: HeritageSite;
  onSelectSite: (site: HeritageSite) => void;
  onViewMonograph: (site: HeritageSite) => void;
  onGetDirections: (site: HeritageSite, userCoords?: { lat: number; lng: number } | null) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onExploreCategory: (category: string) => void;
  onOpenStateDistrictModal?: () => void;
  selectedDistrictName?: string;
  selectedStateCode?: string;
  customMapCenter?: { lat: number; lng: number } | null;
}

declare global {
  interface Window {
    google?: any;
    L?: any;
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 }; // Indore Core
const NEARBY_RADIUS_KM = 50;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isValidCoordinate = (lat: number | undefined, lng: number | undefined): boolean =>
  lat !== undefined &&
  lng !== undefined &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat !== 0 &&
  lng !== 0 &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Keep 3 decimal places internally — round only for display
  return Math.round(R * c * 1000) / 1000;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char)
  );

// ─── Component ─────────────────────────────────────────────────────────────────
export const AroundMeMap: React.FC<AroundMeMapProps> = ({
  sites: propSites,
  selectedSite,
  onSelectSite,
  onViewMonograph,
  onGetDirections,
  favorites,
  onToggleFavorite,
  onExploreCategory,
  onOpenStateDistrictModal,
  selectedDistrictName = 'Indore',
  selectedStateCode = 'MP',
  customMapCenter,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapMode, setMapMode] = useState<'map' | 'terrain'>('map');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);

  // Location state — clearly separated
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<
    'idle' | 'loading' | 'granted' | 'denied' | 'unavailable'
  >('idle');

  // Nearby API state
  const [nearbySites, setNearbySites] = useState<HeritageSite[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const resolvedCenter = useMemo(
    () =>
      customMapCenter &&
      isValidCoordinate(customMapCenter.lat, customMapCenter.lng)
        ? customMapCenter
        : DEFAULT_CENTER,
    [customMapCenter]
  );

  // ─── Fetch nearby places from backend when GPS is obtained ──────────────────
  const fetchNearby = useCallback(
    async (lat: number, lng: number) => {
      setNearbyLoading(true);
      try {
        const cards = await getNearby(lat, lng, NEARBY_RADIUS_KM);
        const converted: HeritageSite[] = cards
          .filter((c) => isValidCoordinate(c.latitude, c.longitude))
          .map((c) => toHeritageSite(c));
        setNearbySites(converted);
      } catch (err) {
        console.warn('getNearby failed, using district sites:', err);
        // Don't crash — fall back to district sites already loaded
        setNearbySites(null);
      } finally {
        setNearbyLoading(false);
      }
    },
    []
  );

  // ─── Request user GPS location ───────────────────────────────────────────────
  const locateUser = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationState('unavailable');
      return;
    }

    // If we already have coordinates, fly to them immediately for instant UX feedback
    if (userCoords && leafletMapRef.current) {
      leafletMapRef.current.flyTo([userCoords.lat, userCoords.lng], 15, { duration: 1.2 });
    }

    setLocationState('loading');

    const handleSuccess = (pos: GeolocationPosition) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(coords);
      setLocationState('granted');
      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.5 });
      }
      // Fetch nearby places from backend using real coordinates
      fetchNearby(coords.lat, coords.lng);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('Geolocation high-accuracy error:', err);
      if (err.code === 1 /* PERMISSION_DENIED */) {
        setLocationState('denied');
      } else {
        // Fallback for browsers/laptops that fail high accuracy GPS lock
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (err2) => {
            console.warn('Geolocation fallback error:', err2);
            if (err2.code === 1) {
              setLocationState('denied');
            } else {
              setLocationState('unavailable');
            }
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
        );
      }
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000,
    });
  }, [fetchNearby, userCoords]);

  // Auto-request on mount
  useEffect(() => {
    locateUser();
  }, []);

  // ─── Load Leaflet CDN ────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.L) {
      setIsLeafletReady(true);
      return;
    }

    const cssId = 'leaflet-cdn-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-cdn-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setIsLeafletReady(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setIsLeafletReady(true));
    }
  }, []);

  // ─── Category definitions ────────────────────────────────────────────────────
  const categories = [
    { label: 'All & Popular', id: 'All', icon: 'stars' },
    { label: 'Palaces & Forts', id: 'Fort', icon: 'fort' },
    { label: 'Ancient Temples', id: 'Temple', icon: 'temple_hindu' },
    { label: 'Heritage Bazaars', id: 'Cultural Heritage', icon: 'storefront' },
    { label: 'Monuments & Havelis', id: 'Monument', icon: 'account_balance' },
    { label: 'Other Heritage', id: 'Other', icon: 'nature_people' },
  ];

  // ─── Source of truth: nearbySites (real API) > propSites (district) ──────────
  // Only include sites with valid coordinates; no fake coords assigned
  const baseSites = useMemo(() => {
    const source = nearbySites ?? propSites;
    return source.filter((site) =>
      isValidCoordinate(site.coordinates?.lat, site.coordinates?.lng)
    );
  }, [nearbySites, propSites]);

  // Sites without coordinates — tracked separately for transparency
  const sitesWithoutCoords = useMemo(() => {
    const source = nearbySites ?? propSites;
    return source.filter(
      (site) => !isValidCoordinate(site.coordinates?.lat, site.coordinates?.lng)
    );
  }, [nearbySites, propSites]);

  // ─── Calculate distances (only when userCoords or baseSites change) ──────────
  const processedSites = useMemo(() => {
    const referenceCoords = userCoords ?? resolvedCenter;
    return baseSites.map((site) => {
      const lat = site.coordinates.lat;
      const lng = site.coordinates.lng;
      const dist = calculateHaversineKm(referenceCoords.lat, referenceCoords.lng, lat, lng);
      return {
        ...site,
        distanceKm: dist,
        distanceDisplay: formatDistance(dist),
      };
    });
  }, [baseSites, userCoords, resolvedCenter]);

  // ─── Filter + sort ───────────────────────────────────────────────────────────
  const filteredSites = useMemo(() => {
    return processedSites
      .filter((site) => {
        const matchesCategory =
          activeCategory === 'All' ||
          site.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
          (activeCategory === 'Fort' &&
            (site.category.includes('Palace') || site.category.includes('Fort'))) ||
          (activeCategory === 'Monument' &&
            (site.category.includes('Monument') ||
              site.category.includes('Haveli') ||
              site.category.includes('Stepwell')));

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          site.name.toLowerCase().includes(q) ||
          site.description?.toLowerCase().includes(q) ||
          site.category.toLowerCase().includes(q) ||
          site.dynasty?.toLowerCase().includes(q);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm); // nearest first
  }, [processedSites, activeCategory, searchQuery]);

  // ─── Initialize Leaflet Map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isLeafletReady || !window.L || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [resolvedCenter.lat, resolvedCenter.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Base tiles are attached by the dedicated tile-layer effect below
      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      tileLayerRef.current = null;
    };
  }, [isLeafletReady]);

  // ─── Base tile layer (Street / Satellite) — swaps without moving the map ────
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!isLeafletReady || !map || !window.L) return;

    // Remove previous base layer (if it belongs to this map instance)
    if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
      map.removeLayer(tileLayerRef.current);
    }

    let layer: any;
    if (mapMode === 'terrain') {
      const imagery = window.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18 }
      );
      const labels = window.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18 }
      );
      layer = window.L.layerGroup([imagery, labels]);
    } else {
      layer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      });
    }

    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [mapMode, isLeafletReady]);

  // ─── Re-center map when the selected city/district changes ──────────────────
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !window.L) return;
    map.flyTo([resolvedCenter.lat, resolvedCenter.lng], 13, { duration: 1.2 });
  }, [resolvedCenter]);

  // ─── User location beacon marker ─────────────────────────────────────────────
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !window.L || !userCoords) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    const userIconHtml = `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></span>
        <span class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></span>
      </div>
    `;

    const userIcon = window.L.divIcon({
      className: 'user-gps-marker',
      html: userIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = window.L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
        <strong style="color: #2563eb;">📍 Your Current Location</strong>
        <p style="margin: 4px 0 0 0; color: #64748b;">GPS: ${userCoords.lat.toFixed(5)}° N, ${userCoords.lng.toFixed(5)}° E</p>
      </div>
    `);
    userMarkerRef.current = marker;
  }, [userCoords, isLeafletReady]);

  // ─── Render heritage markers on map ─────────────────────────────────────────
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !window.L) return;

    leafletMarkersRef.current.forEach((m) => map.removeLayer(m));
    leafletMarkersRef.current = [];

    filteredSites.forEach((site) => {
      const isSelected = selectedSite?.id === site.id;
      const categoryIcon = site.category.includes('Temple')
        ? 'temple_hindu'
        : site.category.includes('Fort') || site.category.includes('Palace')
        ? 'fort'
        : site.category.includes('Cultural')
        ? 'theater_comedy'
        : site.category.includes('Festival')
        ? 'celebration'
        : 'account_balance';

      const markerHtml = `
        <div class="cursor-pointer group flex flex-col items-center transition-transform hover:scale-110 ${isSelected ? 'scale-110 z-50' : 'z-20'}">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border ${
            isSelected
              ? 'bg-[#a14009] text-white border-amber-300 ring-2 ring-amber-400/50'
              : 'bg-white text-[#1a1c1c] border-[#e2e2e2] hover:border-[#a14009]'
          }">
            <span class="material-symbols-outlined text-[13px] ${isSelected ? 'text-amber-200' : 'text-[#a14009]'}">
              ${categoryIcon}
            </span>
            <span class="text-[11px] font-bold whitespace-nowrap max-w-[130px] truncate">
              ${escapeHtml(site.name)}
            </span>
            <span class="text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
              isSelected ? 'bg-black/30 text-white' : 'bg-amber-100 text-amber-900'
            }">
              ${escapeHtml(site.distanceDisplay)}
            </span>
          </div>
          <div class="w-2.5 h-2.5 rotate-45 -mt-1.5 ${isSelected ? 'bg-[#a14009]' : 'bg-white'} border-r border-b ${
        isSelected ? 'border-amber-300' : 'border-[#e2e2e2]'
      }"></div>
        </div>
      `;

      const customIcon = window.L.divIcon({
        className: 'heritage-custom-pin',
        html: markerHtml,
        iconSize: [160, 40],
        iconAnchor: [80, 40],
      });

      const marker = window.L.marker([site.coordinates.lat, site.coordinates.lng], {
        icon: customIcon,
      }).addTo(map);

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
          ${
            site.image
              ? `<img src="${escapeHtml(site.image)}" alt="${escapeHtml(site.name)}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;" />`
              : ''
          }
          <strong style="font-size: 13px; color: #1a1c1c; display: block;">${escapeHtml(site.name)}</strong>
          <span style="display: inline-block; font-size: 10px; font-weight: 700; color: #a14009; background: #ffedd5; padding: 2px 6px; border-radius: 4px; margin: 4px 0;">
            ${escapeHtml(site.category)} • ${escapeHtml(site.distanceDisplay)}
          </span>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 8px 0; line-height: 1.3;">
            ${escapeHtml(site.description ? site.description.slice(0, 90) + '...' : '')}
          </p>
          <div style="display: flex; gap: 6px;">
            <a href="https://www.google.com/maps/dir/?api=1${userCoords ? `&origin=${userCoords.lat},${userCoords.lng}` : ''}&destination=${site.coordinates.lat},${site.coordinates.lng}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #a14009; color: white; text-decoration: none; font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 6px;">
              Get Directions
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectSite(site);
        const idx = filteredSites.findIndex((s) => s.id === site.id);
        if (idx !== -1 && carouselRef.current) {
          carouselRef.current.scrollTo({ left: idx * 340, behavior: 'smooth' });
        }
      });

      leafletMarkersRef.current.push(marker);
    });
  }, [filteredSites, selectedSite, isLeafletReady, userCoords]);

  // ─── Card/map sync helpers ───────────────────────────────────────────────────
  const handlePinClick = (site: HeritageSite) => {
    onSelectSite(site);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([site.coordinates.lat, site.coordinates.lng], 15, {
        duration: 1,
      });
    }
    const idx = filteredSites.findIndex((s) => s.id === site.id);
    if (idx !== -1 && carouselRef.current) {
      carouselRef.current.scrollTo({ left: idx * 340, behavior: 'smooth' });
    }
  };

  const handleZoom = (delta: number) => {
    if (leafletMapRef.current) {
      const zoom = leafletMapRef.current.getZoom() + delta;
      leafletMapRef.current.setZoom(zoom);
    }
  };

  const handleResetNorth = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([resolvedCenter.lat, resolvedCenter.lng], 13, { duration: 1 });
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const amount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // ─── Location state banner ───────────────────────────────────────────────────
  const renderLocationBanner = () => {
    if (locationState === 'loading') {
      return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl border border-[#e2e2e2] flex flex-col items-center gap-3 min-w-[260px]">
          <span className="material-symbols-outlined text-blue-600 text-[36px] animate-spin">sync</span>
          <div className="text-center">
            <p className="font-bold text-[#1a1c1c] text-sm">Locating You…</p>
            <p className="text-[11px] text-[#747878] mt-1">Requesting GPS access to find heritage nearby</p>
          </div>
        </div>
      );
    }

    if (locationState === 'denied') {
      return (
        <div className="absolute bottom-36 sm:bottom-44 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-white/97 backdrop-blur-md rounded-2xl px-5 py-4 shadow-2xl border border-amber-200 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[24px] shrink-0">location_off</span>
            <div>
              <p className="font-bold text-[#1a1c1c] text-sm">Location Access Denied</p>
              <p className="text-[11px] text-[#555] mt-1 leading-relaxed">
                Location permission is required for accurate Around Me results. Places are currently sorted by {selectedDistrictName} city center. Enable location in your browser settings and retry.
              </p>
            </div>
          </div>
          <button
            onClick={locateUser}
            className="w-full py-2 rounded-xl bg-[#a14009] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#843e1d] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">my_location</span>
            Retry Location Access
          </button>
        </div>
      );
    }

    if (locationState === 'unavailable') {
      return (
        <div className="absolute bottom-36 sm:bottom-44 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-white/97 backdrop-blur-md rounded-2xl px-5 py-4 shadow-2xl border border-red-200 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-[24px] shrink-0">gps_off</span>
          <div>
            <p className="font-bold text-[#1a1c1c] text-sm">Location Unavailable</p>
            <p className="text-[11px] text-[#555] mt-1 leading-relaxed">
              Unable to determine your current location. Check that your device's GPS is enabled. Showing heritage places near {selectedDistrictName}.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  // ─── Carousel empty states ───────────────────────────────────────────────────
  const renderCarouselContent = () => {
    if (locationState === 'loading') {
      return (
        <div className="w-full p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e2e2e2] text-center shadow-lg flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-blue-600 text-[20px] animate-spin">sync</span>
          <span className="text-sm font-semibold text-[#555]">Finding nearby heritage places…</span>
        </div>
      );
    }

    if (nearbyLoading) {
      return (
        <div className="w-full p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e2e2e2] text-center shadow-lg flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[#a14009] text-[20px] animate-spin">sync</span>
          <span className="text-sm font-semibold text-[#555]">Loading nearby heritage places…</span>
        </div>
      );
    }

    if (filteredSites.length === 0) {
      if (activeCategory !== 'All' || searchQuery) {
        return (
          <div className="w-full p-6 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e2e2e2] text-center text-sm font-semibold text-[#555] shadow-lg">
            No places match your filter
            {searchQuery ? ` for "${searchQuery}"` : ''}{activeCategory !== 'All' ? ` in category "${activeCategory}"` : ''}.
          </div>
        );
      }

      if (locationState === 'denied' || locationState === 'unavailable') {
        return (
          <div className="w-full p-6 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e2e2e2] text-center text-sm font-semibold text-[#555] shadow-lg">
            No heritage places with coordinates found near {selectedDistrictName}.
          </div>
        );
      }

      return (
        <div className="w-full p-6 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e2e2e2] text-center text-sm font-semibold text-[#555] shadow-lg">
          No heritage places found nearby within {NEARBY_RADIUS_KM} km.
        </div>
      );
    }

    return filteredSites.map((site) => (
      <MonumentCard
        key={site.id}
        site={site}
        variant="carousel"
        isActive={selectedSite?.id === site.id}
        isFavorite={favorites.includes(site.id)}
        onToggleFavorite={onToggleFavorite}
        onSelectSite={handlePinClick}
        onViewMonograph={onViewMonograph}
        onGetDirections={(s) => onGetDirections(s, userCoords)}
      />
    ));
  };

  return (
    <div className="relative w-full h-[calc(100dvh-104px)] md:h-[calc(100dvh-80px)] overflow-hidden bg-[#F4F3EE] select-none">
      {/* 1. Live Interactive Map Viewport */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Top Floating Navigation & Search Console */}
      <div className="absolute top-2 sm:top-4 left-0 right-0 z-40 px-3 sm:px-8 md:px-12 lg:px-16 xl:px-20 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-7xl flex flex-col gap-2 pointer-events-auto">
          {/* Search & City Anchor Bar */}
          <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#e2e2e2]">
            {/* City Selector Anchor */}
            <div className="relative">
              <button
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#1a1c1c] cursor-pointer transition-all shrink-0 border border-neutral-200"
                title="Change Base City"
              >
                <span className="material-symbols-outlined text-[#a14009] text-[18px]">location_on</span>
                <span className="text-xs sm:text-[13px] font-bold whitespace-nowrap">
                  {selectedDistrictName}, {selectedStateCode}
                </span>
                <span className="hidden md:inline text-[10px] text-[#a14009] font-bold uppercase ml-0.5 bg-amber-100 px-1.5 py-0.5 rounded">
                  Change
                </span>
                <span className="material-symbols-outlined text-[14px] text-[#747878]">expand_more</span>
              </button>

              {/* City Dropdown */}
              {isCityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-[#e2e2e2] rounded-2xl shadow-2xl z-50 py-1.5 text-xs overflow-hidden animate-fadeIn">
                  <div className="px-3.5 py-2 font-bold uppercase text-[#747878] text-[10px] tracking-wider border-b border-neutral-100">
                    Heritage Cities Directory
                  </div>
                  {[
                    { name: 'Indore Heritage Core', lat: 22.7196, lng: 75.8577 },
                    { name: 'Jaipur Pink City Citadel', lat: 26.9124, lng: 75.7873 },
                    { name: 'Delhi National Heritage Zone', lat: 28.6139, lng: 77.2090 },
                    { name: 'Ujjain Mahakal Sanctuary', lat: 23.1765, lng: 75.7885 },
                    { name: 'Varanasi Ghats & Sacred Core', lat: 25.3176, lng: 82.9739 },
                  ].map((city) => (
                    <button
                      key={city.name}
                      onClick={() => {
                        setIsCityDropdownOpen(false);
                        setSearchQuery('');
                        if (leafletMapRef.current) {
                          leafletMapRef.current.flyTo([city.lat, city.lng], 14, { duration: 1.2 });
                        }
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#f5f5f5] text-[#1a1c1c] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="font-semibold">{city.name}</span>
                      <span className="material-symbols-outlined text-xs text-[#a14009]">arrow_forward</span>
                    </button>
                  ))}

                  <div className="p-2 border-t border-[#e2e2e2] bg-[#fbf9f5]">
                    <button
                      onClick={() => {
                        setIsCityDropdownOpen(false);
                        onOpenStateDistrictModal?.();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#a14009] hover:bg-[#843e1d] text-white font-bold flex items-center justify-between cursor-pointer shadow-sm transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">map</span>
                        <span>All States & Districts Directory</span>
                      </span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search Input Field */}
            <div className="flex items-center flex-1 min-w-0 px-2 gap-2">
              <span className="material-symbols-outlined text-[#747878] text-[20px]">search</span>
              <input
                className="w-full bg-transparent text-[14px] text-[#1a1c1c] placeholder:text-[#747878] focus:outline-none truncate font-medium"
                placeholder={`Search monuments, temples, stepwells near you…`}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#747878] hover:text-[#1a1c1c] p-1 cursor-pointer"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* GPS Location Button */}
            <button
              onClick={locateUser}
              disabled={locationState === 'loading'}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer ${
                locationState === 'granted'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : locationState === 'denied' || locationState === 'unavailable'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#a14009] text-white hover:bg-[#843e1d]'
              }`}
              title={
                locationState === 'granted'
                  ? 'GPS Active — click to refresh'
                  : locationState === 'denied'
                  ? 'Location denied — click to retry'
                  : 'Detect my GPS location'
              }
            >
              <span
                className={`material-symbols-outlined text-[16px] ${locationState === 'loading' ? 'animate-spin' : ''}`}
              >
                {locationState === 'loading'
                  ? 'sync'
                  : locationState === 'denied' || locationState === 'unavailable'
                  ? 'location_off'
                  : 'my_location'}
              </span>
              <span className="hidden sm:inline">
                {locationState === 'loading'
                  ? 'Locating…'
                  : locationState === 'granted'
                  ? 'GPS Live'
                  : locationState === 'denied'
                  ? 'Denied'
                  : 'Locate Me'}
              </span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-[#a14009] text-white ring-2 ring-[#a14009]/30'
                      : 'bg-white/95 backdrop-blur-sm text-[#1a1c1c] hover:bg-white border border-[#e2e2e2]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      activeCategory === cat.id ? 'text-white' : 'text-[#a14009]'
                    }`}
                  >
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Floating Map Controls (Right Vertical Dock) */}
      <div className="absolute right-3 sm:right-6 top-28 sm:top-36 z-30 flex flex-col gap-2">
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#e2e2e2] overflow-hidden">
          <button
            onClick={handleResetNorth}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="Center Map"
          >
            <span className="material-symbols-outlined text-[20px] text-[#a14009]">explore</span>
          </button>
          <div className="w-full h-px bg-[#e2e2e2]" />
          <button
            onClick={() => handleZoom(1)}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <div className="w-full h-px bg-[#e2e2e2]" />
          <button
            onClick={() => handleZoom(-1)}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
        </div>

        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#e2e2e2] overflow-hidden">
          <button
            onClick={locateUser}
            className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-colors cursor-pointer ${
              locationState === 'loading'
                ? 'bg-amber-50 text-amber-600'
                : locationState === 'granted'
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-[#1a1c1c] hover:bg-[#f3f3f3]'
            }`}
            title={locationState === 'granted' ? 'Center to My Location' : 'Locate Me (GPS)'}
          >
            <span className={`material-symbols-outlined text-[20px] text-blue-600 ${locationState === 'loading' ? 'animate-spin' : ''}`}>
              {locationState === 'loading' ? 'sync' : 'my_location'}
            </span>
          </button>
          <div className="w-full h-px bg-[#e2e2e2]" />
          <button
            onClick={() => setMapMode('map')}
            className={`w-10 min-h-[44px] sm:w-11 sm:min-h-[46px] py-1 px-0.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              mapMode === 'map' ? 'bg-[#a14009] text-white' : 'text-[#444748] hover:bg-[#f3f3f3]'
            }`}
            title="Street Map View"
          >
            <span className="material-symbols-outlined text-[17px] leading-none mb-0.5">map</span>
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight leading-none text-center">Street</span>
          </button>
          <div className="w-full h-px bg-[#e2e2e2]" />
          <button
            onClick={() => setMapMode('terrain')}
            className={`w-10 min-h-[44px] sm:w-11 sm:min-h-[46px] py-1 px-0.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              mapMode === 'terrain' ? 'bg-[#a14009] text-white' : 'text-[#444748] hover:bg-[#f3f3f3]'
            }`}
            title="Satellite Map View"
          >
            <span className="material-symbols-outlined text-[17px] leading-none mb-0.5">satellite_alt</span>
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight leading-none text-center">Satellite</span>
          </button>
        </div>
      </div>

      {/* 4. Location Status Banners (denied / unavailable / loading) */}
      {renderLocationBanner()}

      {/* 5. Bottom Docked Horizontal Carousel */}
      <div className="absolute bottom-2 sm:bottom-5 left-0 right-0 z-30 px-3 sm:px-8 md:px-12 lg:px-16 xl:px-20 flex flex-col gap-2">
        {/* Carousel Header */}
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs text-[#1a1c1c] font-bold flex items-center gap-2 border border-[#e2e2e2]">
              <span
                className={`w-2 h-2 rounded-full ${
                  locationState === 'granted'
                    ? 'bg-emerald-500 animate-pulse'
                    : locationState === 'loading'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-[#a14009]'
                }`}
              />
              <span>
                {locationState === 'loading'
                  ? 'Locating…'
                  : `${filteredSites.length} ${locationState === 'granted' ? 'Places Near You' : `Heritage Sites in ${selectedDistrictName}`}`}
              </span>
              {locationState === 'granted' && userCoords && (
                <span className="text-[#a14009] font-medium hidden sm:inline">
                  • Sorted by Real Distance
                </span>
              )}
              {sitesWithoutCoords.length > 0 && (
                <span className="text-[#747878] font-medium hidden sm:inline text-[10px]">
                  • {sitesWithoutCoords.length} sites without map data excluded
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Horizontal Carousel with Flanking Left / Right Navigation */}
        <div className="relative w-full">
          {filteredSites.length > 1 && (
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -translate-x-1 sm:-translate-x-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-md shadow-xl text-[#1a1c1c] flex items-center justify-center hover:bg-[#f0f0f0] active:scale-95 transition-all border border-[#e2e2e2] cursor-pointer"
              title="Previous Monuments"
              aria-label="Scroll left"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
          )}

          <div
            ref={carouselRef}
            className="w-full flex items-stretch gap-4 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth snap-x px-2 sm:px-4"
          >
            {renderCarouselContent()}
          </div>

          {filteredSites.length > 1 && (
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 translate-x-1 sm:translate-x-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-md shadow-xl text-[#1a1c1c] flex items-center justify-center hover:bg-[#f0f0f0] active:scale-95 transition-all border border-[#e2e2e2] cursor-pointer"
              title="Next Monuments"
              aria-label="Scroll right"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
