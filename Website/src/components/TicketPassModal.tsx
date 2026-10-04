import React from 'react';
import { HeritageSite } from '../types';

interface TicketPassModalProps {
  site: HeritageSite;
  onClose: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({ site, onClose }) => {
  const hasTariffs = site.visitorTariffs && site.visitorTariffs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#e2e2e2] flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#fbf9f5] border-b border-[#e7e2d9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#a14009] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1a1c1c] leading-tight">
                Time-Slotted E-Pass Booking
              </h3>
              <span className="text-xs text-[#a14009] font-medium">
                {site.name} • Dharohar Digital Heritage
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#fdf8f5] border border-[#a14009]/20 space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-[#f6eee9] text-[#a14009] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">upgrade</span>
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#a14009]/10 text-[#a14009] text-[10px] font-bold uppercase tracking-wider">
                Feature In Progress
              </span>
              <h4 className="font-serif text-lg font-bold text-[#1a1c1c] mt-1.5">
                Online E-Pass Booking Coming Soon
              </h4>
              <p className="text-xs text-[#5f5e5e] max-w-sm mt-1 leading-relaxed">
                We are currently integrating official time-slotted pass booking and QR ticketing for {site.name}. This feature will be updated in an upcoming release.
              </p>
            </div>
          </div>

          {/* Practical On-site Ticket Guide */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] border border-[#e2e2e2] space-y-3 text-xs text-[#444748]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1c1c]">
              <span className="material-symbols-outlined text-[#a14009] text-[18px]">storefront</span>
              <span>On-Site Ticketing Information</span>
            </div>
            <p className="text-xs text-[#555555]">
              Visitors can obtain admission tokens and passes directly at the monument gate entry counters during operational hours.
            </p>

            {hasTariffs && (
              <div className="pt-2 border-t border-[#e8e8e8] space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#747878] block">
                  Official Admission Tariffs
                </span>
                {site.visitorTariffs!.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span>{t.category}</span>
                    <strong className="text-[#a14009]">{t.price}</strong>
                  </div>
                ))}
              </div>
            )}

            {site.openingHours && (
              <div className="pt-2 border-t border-[#e8e8e8] flex justify-between items-center text-xs">
                <span>Visiting Hours:</span>
                <strong className="text-[#1a1c1c]">{site.openingHours}</strong>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
