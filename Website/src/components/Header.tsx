import React, { useState } from 'react';
import { PageRoute, UserProfile } from '../types';

interface HeaderProps {
  currentRoute: PageRoute;
  onRouteChange: (route: PageRoute) => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
  savedCount: number;
  onOpenMap: () => void;
  onOpenFavorites: () => void;
  onOpenStateDistrictModal?: () => void;
  selectedStateCode?: string;
  selectedDistrictName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onRouteChange,
  user,
  onOpenAuth,
  onSignOut,
  savedCount,
  onOpenMap,
  onOpenFavorites,
  onOpenStateDistrictModal,
  selectedStateCode = 'MP',
  selectedDistrictName = 'Indore',
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Compute user initials (e.g. "Rahul Sharma" -> "RS")
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'RS';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#f9f9f9]/95 backdrop-blur-md border-b border-[#e2e2e2] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Main Top Bar */}
      <div className="h-16 md:h-20 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex items-center justify-between">
        {/* Left: Brand Identity & Location Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onRouteChange(user ? 'home' : 'landing')}
            className="flex items-center gap-1.5 sm:gap-2 group text-left focus:outline-none cursor-pointer"
            aria-label="Indian Heritage Homepage"
          >
            <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#a14009] group-hover:opacity-90 transition-opacity whitespace-nowrap">
              Indian Heritage
            </span>
          </button>

          {/* Location Badge (Shown only for authenticated users) */}
          {user ? (
            <button
              onClick={() => {
                if (onOpenStateDistrictModal) {
                  onOpenStateDistrictModal();
                } else {
                  onOpenMap();
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#a14009]/10 border border-[#a14009]/25 text-[#a14009] text-xs font-medium cursor-pointer transition hover:bg-[#a14009]/20"
              title="Click to switch Base City & District"
            >
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              <span className="whitespace-nowrap font-semibold">{selectedDistrictName}, {selectedStateCode}</span>
              <span className="material-symbols-outlined text-[13px] opacity-70">expand_more</span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold tracking-wider uppercase border-l border-neutral-300 pl-3.5 ml-2">
              <span className="text-[#a14009]">Discover</span>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-700">Experience</span>
              <span className="text-neutral-300">•</span>
              <span className="text-amber-700">Reward</span>
              <span className="text-neutral-300">•</span>
              <span className="text-emerald-700">Preserve</span>
            </div>
          )}
        </div>

        {/* Center: Primary Navigation Links (ONLY for Authenticated Users) */}
        {user && (
          <nav
            className="hidden md:flex items-center justify-center gap-6 lg:gap-8 h-20"
            aria-label="Main Navigation"
          >
            <button
              onClick={() => onRouteChange('home')}
              className={`h-full flex items-center text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === 'home'
                  ? 'text-[#a14009] border-b-2 border-[#a14009] font-semibold'
                  : 'text-[#444748] hover:text-[#1a1c1c]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onRouteChange('explore')}
              className={`h-full flex items-center text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === 'explore'
                  ? 'text-[#a14009] border-b-2 border-[#a14009] font-semibold'
                  : 'text-[#444748] hover:text-[#1a1c1c]'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => onRouteChange('around-me')}
              className={`h-full flex items-center text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === 'around-me'
                  ? 'text-[#a14009] border-b-2 border-[#a14009] font-semibold'
                  : 'text-[#444748] hover:text-[#1a1c1c]'
              }`}
            >
              Around Me
            </button>
            <button
              onClick={() => onRouteChange('passport')}
              className={`h-full flex items-center text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === 'passport'
                  ? 'text-[#a14009] border-b-2 border-[#a14009] font-semibold'
                  : 'text-[#444748] hover:text-[#1a1c1c]'
              }`}
            >
              Passport
            </button>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!user ? (
            /* NON-AUTHENTICATED STATE: No other tabs, just professional Sign In / Up buttons */
            currentRoute === 'auth' ? (
              <button
                onClick={() => onRouteChange('landing')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-[#c4c7c7] text-[#444748] hover:text-[#a14009] hover:border-[#a14009] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Overview</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold px-3 sm:px-4 py-2 rounded-xl border border-[#c4c7c7] text-[#444748] hover:text-[#a14009] hover:border-[#a14009] hover:bg-[#a14009]/5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => onOpenAuth('signup')}
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold px-3.5 sm:px-5 py-2 rounded-xl bg-[#a14009] hover:bg-[#853407] text-white shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>Sign Up</span>
                </button>
              </div>
            )
          ) : (
            /* AUTHENTICATED STATE: Map Switcher, Favorites, Profile Dropdown */
            <>
              <button
                onClick={() => {
                  if (onOpenStateDistrictModal) {
                    onOpenStateDistrictModal();
                  } else {
                    onOpenMap();
                  }
                }}
                aria-label="Select State & District Directory"
                title="Select State & District Directory"
                className="p-2 text-[#444748] hover:text-[#a14009] hover:bg-[#eeeeee] rounded-lg transition-colors flex items-center justify-center cursor-pointer relative"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">map</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#a14009] ring-1.5 ring-white"></span>
              </button>

              <button
                onClick={onOpenFavorites}
                aria-label="Saved Heritage Sites"
                title="Saved Heritage Sites"
                className="relative p-2 text-[#444748] hover:text-[#a14009] hover:bg-[#eeeeee] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">favorite</span>
                {savedCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#a14009] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {savedCount}
                  </span>
                )}
              </button>

              {/* Profile Avatar & Interactive Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 pl-1 cursor-pointer group focus:outline-none"
                  title="User Profile Menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1c1b1b] flex items-center justify-center text-white text-xs font-semibold group-hover:bg-[#a14009] transition-colors shadow-xs">
                    {userInitials}
                  </div>
                  <span className="hidden lg:inline text-xs uppercase tracking-wider font-semibold text-[#1a1c1c]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#747878] hidden sm:inline">
                    {isProfileMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#e2e2e2] py-2 z-50 animate-fadeIn"
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-[#e2e2e2]">
                      <p className="text-sm font-bold text-[#1a1c1c] truncate">{user.name}</p>
                      <p className="text-xs text-[#747878] truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-[#a14009] bg-[#a14009]/10 px-2 py-0.5 rounded-md font-medium w-fit">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        <span>{selectedDistrictName}, {selectedStateCode}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onRouteChange('passport');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#444748] hover:bg-[#f2f2f2] hover:text-[#a14009] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>My Heritage Passport</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onOpenStateDistrictModal) onOpenStateDistrictModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#444748] hover:bg-[#f2f2f2] hover:text-[#a14009] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                        <span>Change Base City / District</span>
                      </button>
                    </div>

                    <div className="border-t border-[#e2e2e2] pt-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-700 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sub Navigation Bar (ONLY shown for Authenticated Users) */}
      {user && (
        <div className="md:hidden flex items-center justify-around border-t border-[#e2e2e2] bg-[#f9f9f9] h-11 px-2 text-xs font-medium">
          <button
            onClick={() => onRouteChange('home')}
            className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
              currentRoute === 'home' ? 'text-[#a14009] font-bold border-b-2 border-[#a14009]' : 'text-[#444748]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onRouteChange('explore')}
            className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
              currentRoute === 'explore' ? 'text-[#a14009] font-bold border-b-2 border-[#a14009]' : 'text-[#444748]'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => onRouteChange('around-me')}
            className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
              currentRoute === 'around-me' ? 'text-[#a14009] font-bold border-b-2 border-[#a14009]' : 'text-[#444748]'
            }`}
          >
            Around Me
          </button>
          <button
            onClick={() => onRouteChange('passport')}
            className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
              currentRoute === 'passport' ? 'text-[#a14009] font-bold border-b-2 border-[#a14009]' : 'text-[#444748]'
            }`}
          >
            Passport
          </button>
        </div>
      )}
    </header>
  );
};

