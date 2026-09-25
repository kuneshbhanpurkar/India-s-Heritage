import React from 'react';
import { ViewType, AdminOfficer } from '../types';

interface MobileHeaderProps {
  onToggleMobileSidebar: () => void;
  currentView: ViewType;
  selectedState: string;
  selectedDistrict: string;
  onNavigateAddRecord: () => void;
  onNavigateSignIn?: () => void;
  currentOfficer?: AdminOfficer;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onToggleMobileSidebar,
  currentView,
  selectedState,
  selectedDistrict,
  onNavigateAddRecord,
  onNavigateSignIn,
  currentOfficer,
}) => {
  return (
    <header className="lg:hidden shrink-0 bg-sidebar-dark border-b border-sidebar-border text-white px-4 py-3 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle-btn"
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-lg bg-sidebar-card text-sidebar-text hover:text-white border border-sidebar-border"
          aria-label="Open sidebar menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md overflow-hidden bg-primary/20 border border-amber-500/30 flex items-center justify-center">
            <img
              alt="Dharohar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AEtjO1U2jpMyI0tcImM6pB9u__givfD26xwyD_V7TXjsMcs6McMh6e5XdslL9nqtnuaOO4gaX6uKcRfT8IEJW6uUlFEx5EMHdtGOBrgPjlXqQcNYw-CK6I_D7Ugx7fpAbId_2HzUcF1KDIB_633aHuU1UzACdd20sI0-4lIE3Oc79BXy2_X3aShTSEgSC4OHgPGBddXBK3EdaIpeAhGfkK2tKV3p0LrlC77lAI2QblY663Jqzapd_yVOPUCisig"
            />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-tight leading-none">Dharohar</div>
            <div className="text-[0.62rem] text-sidebar-muted uppercase tracking-wider">
              {selectedDistrict}, {selectedState}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentView === 'popular-places' && (
          <button
            id="mobile-add-place-quick-btn"
            type="button"
            onClick={onNavigateAddRecord}
            className="p-1.5 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
            title="Add New Place"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span className="hidden sm:inline text-[0.7rem]">Add Record</span>
          </button>
        )}

        {onNavigateSignIn && (
          <button
            id="mobile-signin-btn"
            type="button"
            onClick={onNavigateSignIn}
            className="p-1.5 rounded-lg bg-sidebar-card border border-sidebar-border hover:border-amber-500/50 text-stone-300 hover:text-white flex items-center gap-1.5"
            title="Admin Sign In / Profile"
          >
            {currentOfficer?.avatar ? (
              <img
                src={currentOfficer.avatar}
                alt={currentOfficer.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-sm text-amber-400">lock</span>
            )}
            <span className="text-[0.68rem] font-medium hidden sm:inline">Officer</span>
          </button>
        )}
      </div>
    </header>
  );
};
