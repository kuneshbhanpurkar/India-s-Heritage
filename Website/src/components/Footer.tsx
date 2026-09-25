import React from 'react';
import { PageRoute } from '../types';

interface FooterProps {
  onNavigate?: (route: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
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
              <span className="text-[#A0522D] font-serif font-bold text-xs">🏛</span> Indian Heritage
              <span className="text-[#e7e2d9] font-normal">|</span>
              <span className="text-[#A0522D] font-medium">National Digital Repository</span>
            </span>
            <span className="hidden sm:inline-block bg-[#A0522D]/10 text-[#A0522D] border border-[#A0522D]/25 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
              ASI Partner
            </span>
          </div>

          {/* Middle: Core Motto */}
          <div className="hidden lg:flex items-center gap-2 text-center text-[11px] font-sans">
            <span className="font-semibold uppercase tracking-wider text-[#A0522D]">Discover</span>
            <span className="text-neutral-300">•</span>
            <span className="font-semibold uppercase tracking-wider text-neutral-800">Experience</span>
            <span className="text-neutral-300">•</span>
            <span className="font-semibold uppercase tracking-wider text-amber-700">Reward</span>
            <span className="text-neutral-300">•</span>
            <span className="font-semibold uppercase tracking-wider text-emerald-800">Preserve</span>
          </div>

          {/* Right side: Social Media Channels & Handles */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-[#555555]">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#555555] hidden sm:inline-block">
              Follow Official:
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* X / Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#555555] hover:text-[#A0522D] transition text-[11px] group"
                title="Follow on X (@IndianHeritage)"
              >
                <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-[10px] font-medium hidden md:inline group-hover:underline">@IndianHeritage</span>
              </a>
              <span className="text-[#e7e2d9] text-xs">•</span>
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#555555] hover:text-[#A0522D] transition text-[11px] group"
                title="Follow on Instagram (@IndianHeritage)"
              >
                <svg
                  className="w-3.5 h-3.5 fill-none stroke-current stroke-2 group-hover:scale-110 transition"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span className="text-[10px] font-medium hidden md:inline group-hover:underline">@IndianHeritage</span>
              </a>
              <span className="text-[#e7e2d9] text-xs">•</span>
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#555555] hover:text-[#A0522D] transition text-[11px] group"
                title="YouTube Channel (@MinOfCultureGoI)"
              >
                <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="text-[10px] font-medium hidden md:inline group-hover:underline">@MinOfCultureGoI</span>
              </a>
              <span className="text-[#e7e2d9] text-xs">•</span>
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#555555] hover:text-[#A0522D] transition text-[11px] group"
                title="Facebook Page"
              >
                <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bottom Footer */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-10 sm:py-12 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-serif text-2xl font-bold text-[#A0522D]">
            Indian Heritage
          </span>
          <p className="text-xs text-[#555555]">
            Curated in collaboration with the Archaeological Survey of India (ASI) & Madhya Pradesh Tourism.
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
          <a href="#" className="hover:text-[#A0522D] transition-colors cursor-pointer">
            Heritage Conservation By-laws
          </a>
          <a href="#" className="hover:text-[#A0522D] transition-colors cursor-pointer">
            Visitor Accessibility
          </a>
          <a href="#" className="hover:text-[#A0522D] transition-colors cursor-pointer">
            Privacy Policy
          </a>
        </div>

        <div className="text-xs text-[#555555] text-center md:text-right">
          © 2024 Indian Heritage. Preserving the timeless narrative.
        </div>
      </div>
    </footer>
  );
};
