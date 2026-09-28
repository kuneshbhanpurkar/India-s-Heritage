import React from 'react';
import { ViewType, AdminOfficer } from '../types';
import { CITY_SECTIONS, CitySectionConfig } from '../config/sections';

export interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType, sectionSlug?: string) => void;
  selectedCategory: string;
  selectedState: string;
  selectedDistrict: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  onOpenAddJurisdiction: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  adminCount: number;
  currentOfficer?: AdminOfficer;
  onSignOut?: () => void;
  sections?: CitySectionConfig[];
  statesAndDistricts?: Record<string, string[]>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  selectedCategory,
  selectedState,
  selectedDistrict,
  onStateChange,
  onDistrictChange,
  onOpenAddJurisdiction,
  isMobileOpen = false,
  onCloseMobile,
  adminCount,
  currentOfficer,
  onSignOut,
  sections = CITY_SECTIONS,
  statesAndDistricts = {},
}) => {
  const [categoriesOpen, setCategoriesOpen] = React.useState(true);

  const availableDistricts = statesAndDistricts[selectedState] || [];

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    onStateChange(newState);
    const firstDistrict = statesAndDistricts[newState]?.[0] || '';
    onDistrictChange(firstDistrict);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 lg:w-80 shrink-0 bg-sidebar-dark border-r border-sidebar-border text-sidebar-text flex flex-col justify-between h-full select-none transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Navigation Area */}
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1 pb-4 border-b border-sidebar-border">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onNavigate('dashboard')}
            >
              <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-primary/20 border border-amber-500/30 shadow-md group-hover:border-amber-500/60 transition-colors">
                <img
                  alt="Dharohar Emblem"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1U2jpMyI0tcImM6pB9u__givfD26xwyD_V7TXjsMcs6McMh6e5XdslL9nqtnuaOO4gaX6uKcRfT8IEJW6uUlFEx5EMHdtGOBrgPjlXqQcNYw-CK6I_D7Ugx7fpAbId_2HzUcF1KDIB_633aHuU1UzACdd20sI0-4lIE3Oc79BXy2_X3aShTSEgSC4OHgPGBddXBK3EdaIpeAhGfkK2tKV3p0LrlC77lAI2QblY663Jqzapd_yVOPUCisig"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display text-xl font-bold text-white tracking-tight leading-tight truncate">
                  Dharohar
                </span>
                <span className="text-[0.68rem] text-sidebar-muted uppercase tracking-wider truncate mt-0.5 font-medium">
                  National Heritage Portal
                </span>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              id="sidebar-close-mobile-btn"
              type="button"
              className="lg:hidden p-1.5 rounded-md text-sidebar-muted hover:text-white hover:bg-white/10"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Select State and District Section */}
          <div className="bg-sidebar-card/90 rounded-xl p-3 border border-sidebar-border/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-amber-500 text-xs">pin_drop</span>
                <span className="text-[0.68rem] uppercase tracking-wider text-sidebar-text font-bold truncate">
                  Select State and District
                </span>
              </div>
              <button
                id="add-jurisdiction-btn"
                type="button"
                onClick={onOpenAddJurisdiction}
                className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-sidebar-muted hover:text-amber-400 border border-sidebar-border transition-colors"
                title="Add Jurisdiction"
              >
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* State Selector */}
              <div className="bg-sidebar-dark/80 rounded-lg p-2 border border-sidebar-border space-y-1">
                <label
                  htmlFor="sidebar-state-select"
                  className="block text-[0.62rem] font-bold text-sidebar-muted uppercase tracking-wider"
                >
                  State
                </label>
                <div className="relative flex items-center">
                  <select
                    id="sidebar-state-select"
                    value={selectedState}
                    onChange={handleStateSelect}
                    className="w-full bg-sidebar-card border border-sidebar-border rounded px-1.5 py-1 text-[0.72rem] font-medium text-white appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-5 truncate"
                  >
                    {Object.keys(statesAndDistricts).map((st) => (
                      <option key={st} value={st} className="bg-sidebar-dark text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-1 text-sidebar-muted pointer-events-none text-xs">
                    expand_more
                  </span>
                </div>
              </div>

              {/* District Selector */}
              <div className="bg-sidebar-dark/80 rounded-lg p-2 border border-sidebar-border space-y-1">
                <label
                  htmlFor="sidebar-district-select"
                  className="block text-[0.62rem] font-bold text-sidebar-muted uppercase tracking-wider"
                >
                  District
                </label>
                <div className="relative flex items-center">
                  <select
                    id="sidebar-district-select"
                    value={selectedDistrict}
                    onChange={(e) => onDistrictChange(e.target.value)}
                    className="w-full bg-sidebar-card border border-sidebar-border rounded px-1.5 py-1 text-[0.72rem] font-medium text-white appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-5 truncate"
                  >
                    {availableDistricts.map((dst) => (
                      <option key={dst} value={dst} className="bg-sidebar-dark text-white">
                        {dst}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-1 text-sidebar-muted pointer-events-none text-xs">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Hierarchy */}
          <nav aria-label="Main Governance Navigation" className="space-y-1 pt-1">
            <span className="px-2 text-[0.65rem] font-bold text-sidebar-muted uppercase tracking-widest block mb-1">
              Core Governance
            </span>

            {/* Dashboard Link */}
            <button
              id="nav-dashboard-btn"
              type="button"
              onClick={() => {
                onNavigate('dashboard');
                onCloseMobile?.();
              }}
              className={`w-full relative flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                currentView === 'dashboard'
                  ? 'bg-gradient-to-r from-amber-700/25 to-transparent text-white font-medium border-l-[3px] border-amber-500 shadow-sm'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-card/80'
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${
                  currentView === 'dashboard' ? 'text-amber-400' : 'text-sidebar-muted'
                }`}
              >
                dashboard
              </span>
              <span className="font-semibold text-[0.82rem]">Dashboard</span>
              {currentView === 'dashboard' && (
                <span className="ml-auto text-[0.62rem] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Live
                </span>
              )}
            </button>

            {/* Heritage Sections Expandable Navigation */}
            <div className="pt-0.5">
              <button
                id="nav-categories-toggle"
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  currentView === 'section' || currentView === 'popular-places' || currentView === 'add-record'
                    ? 'bg-gradient-to-r from-amber-700/25 to-transparent text-white font-medium border-l-[3px] border-primary shadow-sm'
                    : 'text-sidebar-text hover:text-white hover:bg-sidebar-card/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      currentView === 'section' || currentView === 'popular-places' || currentView === 'add-record'
                        ? 'text-amber-400 material-symbols-fill'
                        : 'text-sidebar-muted'
                    }`}
                  >
                    category
                  </span>
                  <span className="font-semibold text-[0.82rem]">Heritage Categories</span>
                </div>
                <span className="material-symbols-outlined text-amber-400 text-sm transition-transform duration-200">
                  {categoriesOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {categoriesOpen && (
                <div
                  id="heritage-subcategories-list"
                  className="pl-6 pr-1 py-1 space-y-0.5 flex flex-col border-l border-sidebar-border/80 ml-5 mt-0.5"
                >
                  {sections.map((section) => {
                    const isSelected =
                      (currentView === 'section' || currentView === 'popular-places' || currentView === 'add-record') &&
                      selectedCategory === section.slug;

                    return (
                      <button
                        key={section.slug}
                        id={`nav-section-${section.slug}`}
                        type="button"
                        onClick={() => {
                          onNavigate('section', section.slug);
                          onCloseMobile?.();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[0.75rem] text-left transition-colors group ${
                          isSelected
                            ? 'text-white bg-white/10 font-semibold border-l-2 border-primary'
                            : 'text-sidebar-muted hover:text-white hover:bg-sidebar-card'
                        }`}
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1.5 truncate">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                          <span className="truncate">{section.title}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Manage Admins with Count Badge */}
            <button
              id="nav-manage-admins-btn"
              type="button"
              onClick={() => {
                onNavigate('manage-admins');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === 'manage-admins'
                  ? 'bg-sidebar-card text-white font-medium border-l-[3px] border-primary shadow-sm'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-card/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${
                    currentView === 'manage-admins' ? 'text-white' : 'text-sidebar-muted'
                  }`}
                >
                  manage_accounts
                </span>
                <span className="font-medium text-[0.82rem]">Manage Admins</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-bold bg-white/10 text-sidebar-text border border-sidebar-border">
                {adminCount}
              </span>
            </button>
            {/* Direct Link to Sign In / Switch Account */}
            <button
              id="nav-signin-btn"
              type="button"
              onClick={() => {
                onNavigate('signin');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === 'signin'
                  ? 'bg-sidebar-card text-white font-medium border-l-[3px] border-primary shadow-sm'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-card/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${
                    currentView === 'signin' ? 'text-amber-400' : 'text-sidebar-muted'
                  }`}
                >
                  login
                </span>
                <span className="font-medium text-[0.82rem]">Admin Sign In Page</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Gateway
              </span>
            </button>
          </nav>
        </div>

        {/* Officer Profile Card at Bottom */}
        <div className="p-3.5 border-t border-sidebar-border bg-[#13110f]">
          <div className="flex items-center justify-between gap-2.5">
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
              onClick={() => onNavigate('signin')}
              title="Click to Switch Account or Re-authenticate"
            >
              <div className="relative shrink-0">
                <img
                  alt={currentOfficer?.name || 'Dr. Sunita Sharma'}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-amber-500/40 shadow-sm"
                  src={
                    currentOfficer?.avatar ||
                    'https://lh3.googleusercontent.com/aida/AEtjO1X9a7J9kj_xP_xPb-If2buc1NrcO1dpaXvOXO-R2wueHN1oHnqMJbxCu4G7xkejjoRyvN0zD5Xyo3UJjzdwJt4E3E7kk2ae6wkbmuzw_UvxQOYrGnnkCJjOGuW533u1bGrqkHMhWQZEreOD4lr-jrFc6vdWs8HQQwtn8DtPuw-vpnhjJVx8-rLWDK6lC22hOemBpNHRbc0nbetHWdR5PoU7aj8PCK13jt9TL5B7gVvYnXO_C1ya0qQLdXA'
                  }
                />
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar-dark"
                  title="Online • Active on GovNet"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[0.78rem] font-bold text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                  {currentOfficer?.name || 'Dr. Sunita Sharma'}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[0.64rem] font-medium text-sidebar-muted truncate">
                    {currentOfficer?.designation || 'Director General'}
                  </span>
                  <span className="text-sidebar-muted text-[0.6rem]">•</span>
                  <span className="text-[0.62rem] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    {currentOfficer?.role === 'Super Admin' ? 'HQ' : 'Admin'}
                  </span>
                </div>
              </div>
            </div>
            <button
              id="officer-logout-btn"
              type="button"
              className="p-1.5 rounded-md text-sidebar-muted hover:text-red-400 hover:bg-white/5 transition-colors shrink-0"
              title="Sign Out / Change Officer Session"
              onClick={() => {
                if (onSignOut) {
                  onSignOut();
                } else {
                  onNavigate('signin');
                }
              }}
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
