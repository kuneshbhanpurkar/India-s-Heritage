import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HeritageSite } from '../types';
import { MonumentCard } from './MonumentCard';

interface AroundMeMapProps {
  sites: HeritageSite[];
  selectedSite: HeritageSite;
  onSelectSite: (site: HeritageSite) => void;
  onViewMonograph: (site: HeritageSite) => void;
  onGetDirections: (site: HeritageSite) => void;
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

const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 }; // Indore Core

const isValidCoordinate = (coordinate: { lat: number; lng: number } | null | undefined) =>
  Boolean(coordinate && Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng) && coordinate.lat !== 0 && coordinate.lng !== 0);

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char] || char));

export const AroundMeMap: React.FC<AroundMeMapProps> = ({
  sites,
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const resolvedCenter = isValidCoordinate(customMapCenter) ? customMapCenter! : DEFAULT_CENTER;

  // 1. Detect User's Live Geolocation
  const locateUser = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setIsLocating(false);
          if (leafletMapRef.current) {
            leafletMapRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.5 });
          }
        },
        (err) => {
          console.warn('Geolocation error or denied:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    locateUser();
  }, []);

  // 2. Load Leaflet CDN script & stylesheet dynamically
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

  // 3. Category definitions
  const categories = [
    { label: 'All & Popular', id: 'All', icon: 'stars' },
    { label: 'Palaces & Forts', id: 'Fort', icon: 'fort' },
    { label: 'Ancient Temples', id: 'Temple', icon: 'temple_hindu' },
    { label: 'Heritage Bazaars', id: 'Cultural Heritage', icon: 'storefront' },
    { label: 'Monuments & Havelis', id: 'Monument', icon: 'account_balance' },
    { label: 'Other Heritage', id: 'Other', icon: 'nature_people' },
  ];

  // 4. Calculate live distances & filter/sort sites
  const processedSites = useMemo(() => {
    const referenceCoords = userCoords || resolvedCenter;

    return sites.map((site) => {
      let lat = site.coordinates?.lat;
      let lng = site.coordinates?.lng;

      // Fallback coordinates within cluster if missing
      if (!isValidCoordinate({ lat, lng })) {
        lat = resolvedCenter.lat + (Math.random() - 0.5) * 0.02;
        lng = resolvedCenter.lng + (Math.random() - 0.5) * 0.02;
      }

      const dist = calculateHaversineKm(referenceCoords.lat, referenceCoords.lng, lat, lng);
      const display = formatDistance(dist);

      return {
        ...site,
        coordinates: { ...site.coordinates, lat, lng },
        distanceKm: dist,
        distanceDisplay: display,
      };
    });
  }, [sites, userCoords, resolvedCenter]);

  const filteredSites = useMemo(() => {
    return processedSites
      .filter((site) => {
        const matchesCategory =
          activeCategory === 'All' ||
          site.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
          (activeCategory === 'Fort' && (site.category.includes('Palace') || site.category.includes('Fort'))) ||
          (activeCategory === 'Monument' && (site.category.includes('Monument') || site.category.includes('Haveli') || site.category.includes('Stepwell')));

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          site.name.toLowerCase().includes(q) ||
          site.description?.toLowerCase().includes(q) ||
          site.category.toLowerCase().includes(q) ||
          site.dynasty?.toLowerCase().includes(q);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [processedSites, activeCategory, searchQuery]);

  // 5. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!isLeafletReady || !window.L || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [resolvedCenter.lat, resolvedCenter.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Layer URLs
      const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const esriSatelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

      const tileLayer = window.L.tileLayer(mapMode === 'terrain' ? esriSatelliteUrl : osmUrl, {
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isLeafletReady]);

  // 6. Update Map Center & Tiles on Mode / City Change
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !window.L) return;

    map.flyTo([resolvedCenter.lat, resolvedCenter.lng], 13, { duration: 1.2 });

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const esriSatelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      tileLayerRef.current = window.L.tileLayer(mapMode === 'terrain' ? esriSatelliteUrl : osmUrl, {
        maxZoom: 19,
      }).addTo(map);
    }
  }, [resolvedCenter, mapMode]);

  // 7. Render User Location Beacon Marker
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
        <p style="margin: 4px 0 0 0; color: #64748b;">GPS Coordinates: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E</p>
      </div>
    `);
    userMarkerRef.current = marker;
  }, [userCoords, isLeafletReady]);

  // 8. Render Monument Markers on Leaflet Map
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !window.L) return;

    // Clear previous monument markers
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
            <a href="https://www.google.com/maps/dir/?api=1&destination=${site.coordinates.lat},${site.coordinates.lng}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background: #a14009; color: white; text-decoration: none; font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 6px;">
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
  }, [filteredSites, selectedSite, isLeafletReady]);

  const handlePinClick = (site: HeritageSite) => {
    onSelectSite(site);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([site.coordinates.lat, site.coordinates.lng], 15, { duration: 1 });
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

  return (
    <div className="relative w-full h-[calc(100dvh-104px)] md:h-[calc(100dvh-80px)] overflow-hidden bg-[#F4F3EE] select-none">
      {/* 1. Live Interactive Map Viewport (Leaflet + OpenStreetMap & ESRI Satellite Layers) */}
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

              {/* City Dropdown Menu */}
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
                placeholder={`Search monuments, temples, stepwells in ${selectedDistrictName}...`}
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

            {/* Live GPS Proximity Tracker Button */}
            <button
              onClick={locateUser}
              disabled={isLocating}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer ${
                userCoords
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-[#a14009] text-white hover:bg-[#843e1d]'
              }`}
              title="Detect live GPS location & calculate closest monuments"
            >
              <span className={`material-symbols-outlined text-[16px] ${isLocating ? 'animate-spin' : ''}`}>
                {isLocating ? 'sync' : 'my_location'}
              </span>
              <span className="hidden sm:inline">
                {isLocating ? 'Locating...' : userCoords ? 'GPS Live' : 'Locate Me'}
              </span>
            </button>
          </div>

          {/* Category Filter Pills & Mode Switcher */}
          <div className="w-full flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
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

            {/* GPS Readout & View Mode Toggle */}
            <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-sm text-[#444748] text-[11px] shrink-0 border border-[#e2e2e2]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-medium">
                {userCoords
                  ? `${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° E (Device GPS)`
                  : `${resolvedCenter.lat.toFixed(4)}° N, ${resolvedCenter.lng.toFixed(4)}° E (${selectedDistrictName})`}
              </span>
              <div className="h-3 w-px bg-[#e2e2e2] mx-1" />
              <button
                onClick={() => setMapMode('map')}
                className={`font-bold uppercase cursor-pointer ${
                  mapMode === 'map' ? 'text-[#a14009]' : 'text-[#747878] hover:text-[#1a1c1c]'
                }`}
              >
                STREET
              </button>
              <button
                onClick={() => setMapMode('terrain')}
                className={`font-bold uppercase cursor-pointer ${
                  mapMode === 'terrain' ? 'text-[#a14009]' : 'text-[#747878] hover:text-[#1a1c1c]'
                }`}
              >
                SATELLITE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Floating Map Controls (Right Vertical Dock) */}
      <div className="absolute right-3 sm:right-6 top-28 sm:top-36 z-30 flex flex-col gap-2">
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#e2e2e2] overflow-hidden">
          <button
            onClick={handleResetNorth}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="Center Map on City"
          >
            <span className="material-symbols-outlined text-[20px] text-[#a14009]">explore</span>
          </button>
          <div className="w-full h-px bg-[#e2e2e2]" />
          <button
            onClick={() => handleZoom(1)}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <div className="w-full h-px bg-[#e2e2e2]" />
          <button
            onClick={() => handleZoom(-1)}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
        </div>

        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#e2e2e2] overflow-hidden">
          <button
            onClick={locateUser}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="My Live Geolocation"
          >
            <span className="material-symbols-outlined text-[20px] text-blue-600">my_location</span>
          </button>
          <div className="w-full h-px bg-[#e2e2e2]" />
          <button
            onClick={() => setMapMode(mapMode === 'map' ? 'terrain' : 'map')}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#1a1c1c] hover:bg-[#f3f3f3] transition-colors cursor-pointer"
            title="Toggle Satellite / Map Layer"
          >
            <span className="material-symbols-outlined text-[20px] text-[#a14009]">layers</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Docked Horizontal Carousel of Monument Cards */}
      <div className="absolute bottom-2 sm:bottom-5 left-0 right-0 z-30 px-3 sm:px-8 md:px-12 lg:px-16 xl:px-20 flex flex-col gap-2">
        {/* Carousel Header Proximity Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs text-[#1a1c1c] font-bold flex items-center gap-2 border border-[#e2e2e2]">
              <span className="w-2 h-2 rounded-full bg-[#a14009] animate-pulse" />
              <span>
                {filteredSites.length} Verified Monuments in {selectedDistrictName}
              </span>
              <span className="text-[#a14009] font-medium hidden sm:inline">
                • {userCoords ? 'Real-Time Live Proximity Distance' : 'Sorted by City Proximity'}
              </span>
            </span>
          </div>

          {/* Carousel Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollCarousel('left')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md text-[#1a1c1c] flex items-center justify-center hover:bg-[#f0f0f0] transition-colors border border-[#e2e2e2] cursor-pointer"
              title="Previous Monuments"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 backdrop-blur-md shadow-md text-[#1a1c1c] flex items-center justify-center hover:bg-[#f0f0f0] transition-colors border border-[#e2e2e2] cursor-pointer"
              title="Next Monuments"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={carouselRef}
          className="w-full flex items-stretch gap-4 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth snap-x"
        >
          {filteredSites.length === 0 ? (
            <div className="w-full p-6 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e2e2e2] text-center text-sm font-semibold text-[#555] shadow-lg">
              No monuments found matching "{searchQuery}" in {selectedDistrictName}.
            </div>
          ) : (
            filteredSites.map((site) => (
              <MonumentCard
                key={site.id}
                site={site}
                variant="carousel"
                isActive={selectedSite?.id === site.id}
                isFavorite={favorites.includes(site.id)}
                onToggleFavorite={onToggleFavorite}
                onSelectSite={handlePinClick}
                onViewMonograph={onViewMonograph}
                onGetDirections={onGetDirections}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
