import React, { useState } from 'react';
import { HeritageSite } from '../types';

interface TicketPassModalProps {
  site: HeritageSite;
  onClose: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({ site, onClose }) => {
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [slot, setSlot] = useState<string>('10:00 AM - 12:00 PM');
  const [ticketConfirmed, setTicketConfirmed] = useState<boolean>(false);
  const ticketId = `ASI-MP-${Math.floor(100000 + Math.random() * 900000)}`;

  const totalAmount = visitorCount * 10;

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
                {ticketConfirmed ? 'Official E-Pass Confirmed' : 'Book Time-Slotted Pass'}
              </h3>
              <span className="text-xs text-[#a14009] font-medium">
                {site.name} • Archaeological Survey of India
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
        {!ticketConfirmed ? (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#747878] mb-1.5">
                Select Visiting Date & Slot
              </label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#c4c7c7] text-sm text-[#1a1c1c] bg-[#f9f9f9] focus:border-[#a14009] focus:outline-none"
              >
                <option>Today: 10:00 AM – 12:00 PM (Morning Slot)</option>
                <option>Today: 12:00 PM – 02:30 PM (Midday Slot)</option>
                <option>Today: 02:30 PM – 05:00 PM (Afternoon Slot)</option>
                <option>Today: 07:30 PM – 09:15 PM (Sound & Light Show)</option>
                <option>Tomorrow: 10:00 AM – 12:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#747878] mb-1.5">
                Number of Visitors (Indian Citizen Tariffs)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))}
                  className="w-10 h-10 rounded-lg border border-[#c4c7c7] flex items-center justify-center text-lg font-bold text-[#1a1c1c] hover:bg-[#eeeeee] cursor-pointer"
                >
                  -
                </button>
                <span className="font-serif text-xl font-bold text-[#1a1c1c] w-8 text-center">
                  {visitorCount}
                </span>
                <button
                  onClick={() => setVisitorCount(Math.min(10, visitorCount + 1))}
                  className="w-10 h-10 rounded-lg border border-[#c4c7c7] flex items-center justify-center text-lg font-bold text-[#1a1c1c] hover:bg-[#eeeeee] cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs text-[#747878] ml-2">₹10 per adult (Children free)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f9f9f9] border border-[#e2e2e2] space-y-2 text-xs text-[#444748]">
              <div className="flex justify-between">
                <span>Pass Category:</span>
                <strong className="text-[#1a1c1c]">ASI Regular E-Pass</strong>
              </div>
              <div className="flex justify-between">
                <span>Site Entry:</span>
                <strong className="text-[#1a1c1c]">{site.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Fee:</span>
                <strong className="text-[#a14009] text-sm">₹{totalAmount}</strong>
              </div>
            </div>

            <button
              onClick={() => setTicketConfirmed(true)}
              className="w-full py-3 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white font-semibold text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Confirm & Generate Digital E-Pass (₹{totalAmount})</span>
            </button>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-3xl">check</span>
            </div>

            <h4 className="font-serif text-xl font-bold text-[#1a1c1c]">
              ASI Verified Monument Pass
            </h4>
            <p className="text-xs text-[#555555]">
              Show this digital QR voucher at the ASI ticketing turnstiles or security checkpoint.
            </p>

            {/* Render Simulated QR Code */}
            <div className="p-4 bg-white rounded-xl border-2 border-dashed border-[#a14009] shadow-sm flex flex-col items-center">
              <div className="w-40 h-40 bg-neutral-900 rounded-lg p-2 flex items-center justify-center">
                {/* SVG QR Code Pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                  <rect x="10" y="10" width="25" height="25" rx="2" />
                  <rect x="65" y="10" width="25" height="25" rx="2" />
                  <rect x="10" y="65" width="25" height="25" rx="2" />
                  <rect x="15" y="15" width="15" height="15" fill="black" />
                  <rect x="70" y="15" width="15" height="15" fill="black" />
                  <rect x="15" y="70" width="15" height="15" fill="black" />
                  <circle cx="22.5" cy="22.5" r="4" fill="white" />
                  <circle cx="77.5" cy="22.5" r="4" fill="white" />
                  <circle cx="22.5" cy="77.5" r="4" fill="white" />
                  {/* Internal matrix dots */}
                  <rect x="42" y="15" width="8" height="8" />
                  <rect x="42" y="30" width="8" height="8" />
                  <rect x="15" y="45" width="8" height="8" />
                  <rect x="30" y="45" width="8" height="8" />
                  <rect x="45" y="45" width="10" height="10" />
                  <rect x="65" y="45" width="8" height="8" />
                  <rect x="80" y="45" width="8" height="8" />
                  <rect x="42" y="65" width="8" height="8" />
                  <rect x="42" y="78" width="8" height="8" />
                  <rect x="65" y="65" width="15" height="8" />
                  <rect x="70" y="78" width="18" height="8" />
                </svg>
              </div>
              <span className="font-mono text-xs font-bold text-[#1a1c1c] mt-2 tracking-wider">
                {ticketId}
              </span>
            </div>

            <div className="w-full text-left bg-[#f9f9f9] p-3 rounded-lg text-xs space-y-1 text-[#444748]">
              <div className="flex justify-between">
                <span>Monument:</span>
                <span className="font-semibold text-[#1a1c1c]">{site.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Slot:</span>
                <span className="font-semibold text-[#1a1c1c]">{slot}</span>
              </div>
              <div className="flex justify-between">
                <span>Visitors:</span>
                <span className="font-semibold text-[#1a1c1c]">{visitorCount} Adult(s)</span>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-lg border border-[#c4c7c7] text-xs font-semibold hover:bg-[#eeeeee] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Pass</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-[#a14009] text-white text-xs font-semibold hover:bg-[#7d2d00] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
