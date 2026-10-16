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

  return (
    <footer className="w-full bg-[#fbf9f5] border-t border-[#e7e2d9]" data-purpose="editorial-footer">
      {/* Upper Status & Gazette Subbar */}
      <div className="border-b border-[#e7e2d9] bg-[#faf6f0]/95 backdrop-blur-md px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-3 text-xs text-[#555555]">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left side: Institutional Seal & Repository Identification */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A0522D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A0522D]"></span>
            </span>
            <span className="font-semibold text-[#1a1a1a] tracking-wider uppercase text-[10px] sm:text-[11px] flex items-center gap-1.5">
              <span className="text-[#A0522D] font-serif font-bold text-xs">🏛</span> Dharohar
              <span className="text-[#e7e2d9] font-normal">|</span>
              <span className="text-[#A0522D] font-medium">National Digital Heritage Repository</span>
            </span>
          </div>

          {/* Middle: Core Motto */}
          <div className="hidden lg:flex items-center gap-2 text-center text-[11px] font-sans">
            <span className="font-semibold uppercase tracking-wider text-[#A0522D]">Discover</span>
            <span className="text-neutral-300">•</span>
            <span className="font-semibold uppercase tracking-wider text-neutral-800">Experience</span>
            <span className="text-neutral-300">•</span>
            <span className="font-semibold uppercase tracking-wider text-amber-700">Preserve</span>
          </div>

          {/* Right side: Verification Status */}
          <div className="flex items-center gap-2 text-xs text-[#555555]">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
            <span className="text-[11px] font-medium">Verified National Heritage Archive</span>
          </div>
        </div>
      </div>

      {/* Main Bottom Footer */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-10 sm:py-12 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-serif text-2xl font-bold text-[#A0522D]">
            Dharohar
          </span>
          <p className="text-xs text-[#555555]">
            Preserving centuries of Indian heritage, monuments, and cultural traditions.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-[#555555]">
          <button
            onClick={() => onNavigate?.('landing')}
            className="hover:text-[#A0522D] transition-colors cursor-pointer font-medium"
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate?.('explore')}
            className="hover:text-[#A0522D] transition-colors cursor-pointer"
          >
            National Monument Registry
          </button>
          <button
            onClick={() => onNavigate?.('auth')}
            className="hover:text-[#A0522D] transition-colors cursor-pointer font-medium"
          >
            Sign In / Register
          </button>
          <button
            onClick={() => handleInfoClick('Heritage Conservation By-laws')}
            className="hover:text-[#A0522D] transition-colors cursor-pointer"
          >
            Conservation By-laws
          </button>
          <button
            onClick={() => handleInfoClick('Visitor Accessibility')}
            className="hover:text-[#A0522D] transition-colors cursor-pointer"
          >
            Visitor Accessibility
          </button>
          <button
            onClick={() => handleInfoClick('Privacy Policy')}
            className="hover:text-[#A0522D] transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('dharohar:trigger-pwa-install'))}
            className="hover:text-[#A0522D] text-[#A0522D] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">install_mobile</span>
            Install Mobile App
          </button>
        </div>

        <div className="text-xs text-[#555555] text-center md:text-right">
          © {new Date().getFullYear()} Dharohar Digital Heritage. All rights reserved.
        </div>
      </div>

      {/* Toast Notification for upcoming policy documents */}
      {footerToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1c1c] text-white px-4 py-2.5 rounded-lg text-xs shadow-lg flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[16px] text-amber-400">info</span>
          <span>{footerToast}</span>
        </div>
      )}
    </footer>
  );
};
