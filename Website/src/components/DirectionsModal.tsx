import React, { useState } from 'react';
import { HeritageSite } from '../types';

interface DirectionsModalProps {
  site: HeritageSite | null;
  onClose: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({ site, onClose, userCoords }) => {
  const [transportMode, setTransportMode] = useState<'walk' | 'transit' | 'drive'>('walk');
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!site) return null;

  const hasCoordinates =
    site.coordinates &&
    typeof site.coordinates.lat === 'number' &&
    typeof site.coordinates.lng === 'number' &&
    !isNaN(site.coordinates.lat) &&
    !isNaN(site.coordinates.lng) &&
    (site.coordinates.lat !== 0 || site.coordinates.lng !== 0);

  const travelModeParam =
    transportMode === 'walk' ? 'walking' : transportMode === 'transit' ? 'transit' : 'driving';

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${site.coordinates.lat},${site.coordinates.lng}${
        userCoords ? `&origin=${userCoords.lat},${userCoords.lng}` : ''
      }&travelmode=${travelModeParam}`
    : `https://maps.google.com/?q=${encodeURIComponent(site.name + ' ' + (site.location || ''))}`;

  const copyCoordinates = async () => {
    if (!hasCoordinates) return;
    try {
      await navigator.clipboard.writeText(`${site.coordinates.lat}, ${site.coordinates.lng}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {
      // ignore
    }
  };

  const modeDescriptions = {
    walk: {
      title: 'Pedestrian Walking Route',
      desc: 'Shortest walking path via designated pedestrian zones, heritage circles, and monument entrance gates.',
      eta: site.directionTimeMinutes > 0 ? `${site.directionTimeMinutes} min walk` : 'Quick walk',
      icon: 'directions_walk',
    },
    transit: {
      title: 'Public Transit & Metro',
      desc: 'Connecting bus stops, metro corridors, and local transit stations with arrival frequency.',
      eta: site.distanceKm > 0 ? `~${Math.max(2, Math.round(site.distanceKm * 2.5))} min transit` : 'Local transit',
      icon: 'directions_bus',
    },
    drive: {
      title: 'Auto, Taxi & Driving',
      desc: 'Real-time traffic-optimized vehicular routing directly to monument visitor parking or drop-off zone.',
      eta: site.distanceKm > 0 ? `~${Math.max(3, Math.round(site.distanceKm * 2))} min drive` : 'Direct drive',
      icon: 'directions_car',
    },
  };

  const currentModeInfo = modeDescriptions[transportMode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#e2e2e2] flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-[#fbf9f5] border-b border-[#e7e2d9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#a14009] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">directions</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1a1c1c] leading-tight">
                Route to {site.name}
              </h3>
              <span className="text-xs text-[#a14009] font-medium">
                {site.distanceDisplay || (site.distanceKm > 0 ? `${site.distanceKm.toFixed(1)} km away` : 'Location available')} • {currentModeInfo.eta}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center border-b border-[#e2e2e2] bg-[#f9f9f9] px-4 py-2 text-xs">
          <button
            onClick={() => setTransportMode('walk')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer ${
              transportMode === 'walk'
                ? 'bg-[#a14009] text-white shadow-xs'
                : 'text-[#444748] hover:text-[#1a1c1c]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">directions_walk</span>
            <span>Walk{site.directionTimeMinutes > 0 ? ` (${site.directionTimeMinutes}m)` : ''}</span>
          </button>
          <button
            onClick={() => setTransportMode('transit')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer ${
              transportMode === 'transit'
                ? 'bg-[#a14009] text-white shadow-xs'
                : 'text-[#444748] hover:text-[#1a1c1c]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">directions_bus</span>
            <span>Transit / Metro</span>
          </button>
          <button
            onClick={() => setTransportMode('drive')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-colors cursor-pointer ${
              transportMode === 'drive'
                ? 'bg-[#a14009] text-white shadow-xs'
                : 'text-[#444748] hover:text-[#1a1c1c]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">directions_car</span>
            <span>Drive / Taxi</span>
          </button>
        </div>

        {/* Interactive Google Map Destination Preview */}
        {hasCoordinates && (
          <div className="relative w-full h-44 bg-neutral-100 overflow-hidden border-b border-[#e2e2e2]">
            <iframe
              title={`Map directions to ${site.name}`}
              className="w-full h-full border-0"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}&z=16&output=embed`}
            />
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold text-[#1a1c1c] shadow-xs flex items-center gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#a14009]"></span>
              Destination: {site.coordinates.lat.toFixed(4)}° N, {site.coordinates.lng.toFixed(4)}° E
            </div>
          </div>
        )}

        {/* Route Details & Guidance */}
        <div className="p-5 flex flex-col gap-3.5 max-h-60 overflow-y-auto">
          {/* Origin and Destination Card */}
          <div className="bg-[#fcfbf9] border border-[#e8e4dc] rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-xs text-[#444748]">
              <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs shrink-0"></span>
              <span className="font-medium">
                {userCoords ? (
                  <>Your Location <span className="text-[11px] text-[#747878]">({userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E)</span></>
                ) : (
                  'Current Location (GPS)'
                )}
              </span>
            </div>
            <div className="w-0.5 h-3 bg-neutral-300 ml-1.5 -my-1"></div>
            <div className="flex items-center gap-2.5 text-xs text-[#1a1c1c]">
              <span className="w-3 h-3 rounded-full bg-[#a14009] border-2 border-white shadow-xs shrink-0"></span>
              <span className="font-bold">{site.name}</span>
              {site.location && <span className="text-[11px] text-[#747878]">({site.location})</span>}
            </div>
          </div>

          {/* Mode Guidance Note */}
          <div className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs">
            <span className="material-symbols-outlined text-[#a14009] text-base shrink-0 mt-0.5">
              {currentModeInfo.icon}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-[#823200]">{currentModeInfo.title}</div>
              <p className="text-[#5c4033] mt-0.5 leading-relaxed text-[11px]">{currentModeInfo.desc}</p>
            </div>
          </div>

          {/* Coordinates Action Bar */}
          {hasCoordinates && (
            <div className="flex items-center justify-between text-xs px-1 text-[#747878]">
              <span>Coordinates: {site.coordinates.lat.toFixed(5)}, {site.coordinates.lng.toFixed(5)}</span>
              <button
                onClick={copyCoordinates}
                type="button"
                className="flex items-center gap-1 text-[#a14009] hover:text-[#7d2d00] font-semibold text-[11px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">
                  {copiedCoords ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCoords ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer with external maps navigation link */}
        <div className="p-4 bg-[#f9f9f9] border-t border-[#e2e2e2] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#c4c7c7] text-[#444748] text-xs font-semibold hover:bg-[#eeeeee] transition-colors cursor-pointer"
          >
            Close
          </button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">navigation</span>
            <span>Start Live Navigation</span>
          </a>
        </div>
      </div>
    </div>
  );
};

