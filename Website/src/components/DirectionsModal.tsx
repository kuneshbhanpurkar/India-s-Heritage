import React, { useState } from 'react';
import { HeritageSite } from '../types';

interface DirectionsModalProps {
  site: HeritageSite | null;
  onClose: () => void;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({ site, onClose }) => {
  const [transportMode, setTransportMode] = useState<'walk' | 'transit' | 'drive'>('walk');

  if (!site) return null;

  const stepsByMode = {
    walk: [
      {
        instruction: `Head toward the main access road in ${site.location || 'the local circle'}`,
        dist: '120 m',
        time: '2 min',
      },
      {
        instruction: `Follow the official heritage pedestrian route toward ${site.name}`,
        dist: '180 m',
        time: '3 min',
      },
      {
        instruction: `Arrive at the main entrance gate of ${site.name}`,
        dist: '100 m',
        time: '1 min',
      },
    ],
    transit: [
      {
        instruction: `Board local transit / metro toward ${site.location || 'heritage zone'}`,
        dist: '1.2 km',
        time: '6 min',
      },
      {
        instruction: `Alight at the nearest station or stop for ${site.name}`,
        dist: '50 m',
        time: '1 min',
      },
      {
        instruction: `Walk along the designated heritage pathway into ${site.name}`,
        dist: '150 m',
        time: '2 min',
      },
    ],
    drive: [
      {
        instruction: `Follow navigation along the main arterial route in ${site.location || 'the city'}`,
        dist: '600 m',
        time: '3 min',
      },
      {
        instruction: `Enter the visitor parking facility designated for ${site.name}`,
        dist: '150 m',
        time: '2 min',
      },
      {
        instruction: `Short pedestrian walk to ${site.name} main portal`,
        dist: '120 m',
        time: '2 min',
      },
    ],
  };

  const steps = stepsByMode[transportMode];

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
                {site.distanceKm} km away • {site.directionTimeMinutes} min walk
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
            <span>Walk ({site.directionTimeMinutes}m)</span>
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
            <span>iBus / Metro</span>
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
            <span>Auto / Taxi</span>
          </button>
        </div>

        {/* Live Interactive Google Map Preview */}
        <div className="relative w-full h-44 bg-neutral-100 overflow-hidden border-b border-[#e2e2e2]">
          <iframe
            title={`Google Map directions to ${site.name}`}
            className="w-full h-full border-0"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}&z=16&output=embed`}
          />
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded text-[10px] font-bold text-[#1a1c1c] shadow-xs pointer-events-none">
            Destination: {site.name} ({site.coordinates.lat}° N, {site.coordinates.lng}° E)
          </div>
        </div>

        {/* Turn by turn steps */}
        <div className="p-5 flex flex-col gap-3.5 max-h-56 overflow-y-auto">
          <div className="text-[11px] uppercase tracking-wider font-bold text-[#747878]">
            Turn-by-Turn Navigation Steps ({transportMode.toUpperCase()})
          </div>
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-[#f3f3f3] text-[#a14009] flex items-center justify-center font-bold text-[11px] shrink-0 border border-[#e2e2e2]">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="text-[#1a1c1c] font-medium leading-relaxed">{step.instruction}</p>
                <div className="flex items-center gap-2 text-[11px] text-[#747878] mt-0.5">
                  <span>{step.dist}</span>
                  <span>•</span>
                  <span>{step.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with external maps link */}
        <div className="p-4 bg-[#f9f9f9] border-t border-[#e2e2e2] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#c4c7c7] text-[#444748] text-xs font-semibold hover:bg-[#eeeeee] transition-colors cursor-pointer"
          >
            Close
          </button>
          <a
            href={
              site.coordinates?.lat && site.coordinates?.lng
                ? `https://www.google.com/maps/dir/?api=1&destination=${site.coordinates.lat},${site.coordinates.lng}`
                : `https://maps.google.com/?q=${encodeURIComponent(site.name + ' ' + (site.location || ''))}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">directions</span>
            <span>Navigate in Google Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
};
