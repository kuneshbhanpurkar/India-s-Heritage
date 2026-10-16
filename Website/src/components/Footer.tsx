import React, { useState } from 'react';
import { PageRoute } from '../types';

interface FooterProps {
  onNavigate?: (route: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [footerToast, setFooterToast] = useState<string | null>(null);

  const handleInfoClick = (title: string) => {
    setFooterToast(`${title} document is being prepared and will be published soon.`);
    setTimeout(() => setFooterToast(null), 3500);
  };

  const handleInstallClick = () => {
    window.dispatchEvent(new CustomEvent('dharohar:trigger-pwa-install'));
  };

  return (
    <footer className="w-full bg-[#FAF7F2] border-t border-[#E5DACF] text-[#333333] font-sans" data-purpose="editorial-footer">
      {/* 1. Upper Status & Institutional Subbar */}
      <div className="border-b border-[#E5DACF] bg-[#F4EFEA]/80 backdrop-blur-md px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-3 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: National Digital Heritage Repository status */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <div className="flex items-center gap-2 font-semibold text-[#1a1a1a] tracking-wider uppercase text-[10px] sm:text-[11px]">
              <img src="/logo.png" alt="Our Dharohar" className="w-4 h-4 rounded-xs object-contain" />
              <span>Our Dharohar</span>
              <span className="text-[#D0C2B4]">|</span>
              <span className="text-[#8B3E14] font-medium normal-case tracking-normal">National Heritage Digital Repository</span>
            </div>
          </div>

          {/* Middle: Four Core Mandates */}
          <div className="hidden lg:flex items-center gap-3 text-center text-[11px] uppercase tracking-wider font-semibold">
            <span className="text-[#8B3E14]">Discover</span>
            <span className="text-[#D0C2B4]">•</span>
            <span className="text-neutral-700">Experience</span>
            <span className="text-[#D0C2B4]">•</span>
            <span className="text-amber-800">Reward</span>
            <span className="text-[#D0C2B4]">•</span>
            <span className="text-emerald-800">Preserve</span>
          </div>

          {/* Right: Verification Tag */}
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="material-symbols-outlined text-[17px] text-emerald-700">verified</span>
            <span className="text-[11px] font-medium">Government of India Cultural Partner</span>
          </div>
        </div>
      </div>

      {/* 2. Main 4-Column Professional Editorial Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Column 1: Brand, Mandate & Mobile App CTA (Col 1 to 5) */}
          <div className="lg:col-span-5 flex flex-col items-start gap-4">
            <div
              onClick={() => onNavigate?.('landing')}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="Our Dharohar Logo"
                className="w-12 h-12 rounded-xl object-contain shadow-sm border border-amber-600/30 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold text-[#470D1F] tracking-tight group-hover:text-[#68142D] transition-colors">
                  Our Dharohar
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#8B3E14] font-semibold">
                  National Heritage Archive
                </span>
              </div>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed max-w-sm">
              Dedicated to cataloging, preserving, and rewarding the exploration of India's centrally protected monuments, living traditions, temple architecture, and cultural guilds.
            </p>

            {/* Institutional Seal Badge */}
            <div className="w-full max-w-sm p-3 rounded-xl bg-[#F3ECE4] border border-[#E0D5C7] text-[11px] text-[#665544] flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-[#8B3E14] shrink-0">account_balance</span>
              <span className="leading-snug">
                Ministry of Culture &amp; Tourism Initiative in technical collaboration with Archaeological Survey of India (ASI).
              </span>
            </div>

            {/* PWA Mobile App Card */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#470D1F] hover:bg-[#5D132A] text-white text-xs font-semibold shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer border border-[#D4AF37]/30"
                title="Install Our Dharohar PWA on Android or iPhone"
              >
                <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">install_mobile</span>
                <span>Install Mobile App (PWA)</span>
              </button>
              <span className="text-[11px] text-[#777777] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-emerald-700">offline_bolt</span>
                <span>Works 100% Offline</span>
              </span>
            </div>
          </div>

          {/* Column 2: Heritage Discovery (Col 6 to 7) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#470D1F] border-b border-[#E5DACF] pb-2 font-serif">
              Heritage Explore
            </h4>
            <ul className="space-y-2.5 text-xs text-[#555555]">
              <li>
                <button
                  onClick={() => onNavigate?.('landing')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  National Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('explore')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Monument Registry
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('around-me')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Interactive GIS Map
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('passport')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Heritage Passport &amp; Stamps
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('Curated Cultural Trails')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Curated Heritage Trails
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Conservation & Guidelines (Col 8 to 9) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#470D1F] border-b border-[#E5DACF] pb-2 font-serif">
              Conservation &amp; Visitor
            </h4>
            <ul className="space-y-2.5 text-xs text-[#555555]">
              <li>
                <button
                  onClick={() => handleInfoClick('Heritage Conservation By-laws')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Conservation By-laws &amp; Acts
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('Visitor Accessibility')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Visitor Accessibility &amp; Facilities
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('ASI Protected Monuments Protocol')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  ASI Centrally Protected Protocol
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('Monument Ticketing Pass')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  E-Ticketing &amp; Visitor Passes
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('Heritage Photographic Guidelines')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Photography &amp; Research Guidelines
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Governance & Officers (Col 10 to 12) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#470D1F] border-b border-[#E5DACF] pb-2 font-serif">
              Administration
            </h4>
            <ul className="space-y-2.5 text-xs text-[#555555]">
              <li>
                <button
                  onClick={() => onNavigate?.('auth')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left font-medium text-[#470D1F]"
                >
                  Citizen Sign In / Register
                </button>
              </li>
              <li>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#8B3E14] hover:underline transition-colors text-left flex items-center gap-1"
                >
                  <span>Officer Portal</span>
                  <span className="material-symbols-outlined text-[13px] opacity-70">open_in_new</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('Privacy Policy')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('Terms of Documentation')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleInfoClick('Directorate Technical Support')}
                  className="hover:text-[#8B3E14] hover:underline transition-colors cursor-pointer text-left"
                >
                  Technical Support
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* 3. Bottom Legal & Attribution Bar */}
      <div className="border-t border-[#E5DACF] bg-[#F2EDE6] px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-5 text-xs text-[#666666]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="font-medium text-[#444444]">
              © {new Date().getFullYear()} Our Dharohar Digital Heritage. All rights reserved.
            </p>
            <span className="hidden sm:inline text-[#D0C2B4]">|</span>
            <p className="text-[11px] text-[#777777]">
              Content managed by the National Heritage Circles of India.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => handleInfoClick('Privacy Policy')}
              className="hover:text-[#470D1F] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => handleInfoClick('Accessibility Statement')}
              className="hover:text-[#470D1F] transition-colors cursor-pointer"
            >
              Accessibility
            </button>
            <span>•</span>
            <button
              onClick={() => handleInfoClick('Digital Archives Sitemap')}
              className="hover:text-[#470D1F] transition-colors cursor-pointer"
            >
              Sitemap
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification for policy popups */}
      {footerToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-2.5 rounded-xl text-xs shadow-2xl border border-white/10 flex items-center gap-2.5 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px] text-amber-400">info</span>
          <span>{footerToast}</span>
        </div>
      )}
    </footer>
  );
};
