import React, { useState } from 'react';
import { HeritageSite, UserProfile } from '../types';
import { MonumentCard } from './MonumentCard';
import { ComingSoonNotice } from './ComingSoonNotice';

interface PassportViewProps {
  savedSites?: HeritageSite[];
  onToggleFavorite?: (siteId: string) => void;
  onViewMonograph?: (site: HeritageSite) => void;
  onExploreMore?: () => void;
  onNavigateToMap?: () => void;
  onOpenStateDistrictModal?: () => void;
  selectedStateCode?: string;
  selectedDistrictName?: string;
  user: UserProfile;
  onUpdateUser?: (name: string) => Promise<void>;
}

export const PassportView: React.FC<PassportViewProps> = ({
  savedSites = [],
  onToggleFavorite,
  onViewMonograph,
  onExploreMore,
  onOpenStateDistrictModal,
  selectedStateCode = 'MP',
  selectedDistrictName = 'Indore',
  user,
  onUpdateUser,
}) => {
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(user.name);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast('Heritage Passport link copied to clipboard!');
      setTimeout(() => setShareToast(null), 3000);
    } else {
      setShareToast('Passport link ready for sharing!');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'EX';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <main className="w-full min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pb-24 select-none animate-fadeIn">
      {/* Container: Full fluid responsive layout */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-8 md:py-12 flex flex-col gap-12 sm:gap-16">
        {/* Top Section: User Profile Editorial Card */}
        <section className="w-full bg-white rounded-2xl shadow-sm border border-[#e2e2e2] p-6 sm:p-8 md:p-12 relative overflow-hidden">
          {/* Decorative faint watermark graphic */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5 pointer-events-none text-[#a14009]">
            <span className="material-symbols-outlined text-[320px]">shield</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 lg:items-start justify-between relative z-10">
            {/* Left: Explorer Bio and Identification */}
            <div className="flex flex-col sm:flex-row gap-6 sm:items-start max-w-3xl">
              {/* Initials Avatar with Crest */}
              <div className="relative shrink-0 self-start">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#a14009] to-[#592300] text-white overflow-hidden shadow-md flex items-center justify-center ring-4 ring-white">
                  <span className="font-serif text-2xl md:text-3xl font-bold tracking-wider">
                    {getInitials(user.name || userName)}
                  </span>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-[#a14009] text-white rounded-full p-1.5 shadow-md flex items-center justify-center"
                  title="Verified Heritage Member"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </div>
              </div>

              {/* Explorer Text Details */}
              <div className="flex flex-col gap-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#a14009] bg-[#f3f3f3] px-3 py-1 rounded">
                    Registered Heritage Explorer
                  </span>
                </div>

                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1c1c] tracking-tight leading-none mb-1.5">
                    {user.name || userName}
                  </h1>

                  {/* Location Pill */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenStateDistrictModal}
                      title="Click to change active State & District"
                      className="group inline-flex items-center gap-1.5 text-sm sm:text-base text-[#444748] font-medium hover:text-[#a14009] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#a14009]">location_on</span>
                      <span>
                        {selectedDistrictName}, {selectedStateCode}, India
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#a14009] bg-[#a14009]/10 px-2 py-0.5 rounded-full group-hover:bg-[#a14009]/20 transition-colors ml-1">
                        Change
                      </span>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#444748] leading-relaxed max-w-xl font-mono">
                  {user.email}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#444748] pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">home_pin</span>
                    Registered: {user.district || selectedDistrictName}, {user.state || selectedStateCode}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-3">
                  <button
                    onClick={handleShare}
                    className="bg-[#a14009] text-white hover:bg-[#853407] transition-all px-5 sm:px-6 py-2.5 rounded text-xs uppercase tracking-wider font-semibold shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    <span>Share Passport</span>
                  </button>

                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="bg-[#f3f3f3] text-[#a14009] hover:bg-[#eeeeee] transition-colors px-5 sm:px-6 py-2.5 rounded text-xs uppercase tracking-wider font-semibold shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Real Explorer Metrics Strip */}
            <div className="w-full lg:w-80 bg-[#f3f3f3] rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-xs self-stretch justify-between border border-[#e8e8e8]">
              <div className="flex items-center justify-between pb-3 border-b border-[#c4c7c7]/30">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#444748]">
                  Explorer Record
                </span>
                <span className="material-symbols-outlined text-[#a14009] text-[20px]">
                  auto_stories
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="font-serif text-[28px] sm:text-[32px] font-bold text-[#a14009] leading-tight">
                    {savedSites.length}
                  </span>
                  <span className="text-xs text-[#444748] font-medium">Saved Monuments</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-[28px] sm:text-[32px] font-bold text-[#1a1c1c] leading-tight">
                    1
                  </span>
                  <span className="text-xs text-[#444748] font-medium">Active District</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#c4c7c7]/30 flex items-center justify-between text-xs">
                <span className="text-[#444748]">Verified Passport ID:</span>
                <span className="font-mono text-[#1a1c1c] font-semibold truncate max-w-[150px]">
                  {user.patronId || (user as any).id || (user as any)._id || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Saved Monuments & Passport Bookmarks */}
        <section className="flex flex-col gap-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#a14009] mb-1 block">
                Personal Heritage Collection
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1a1c1c] font-bold">
                Saved Monuments &amp; Records ({savedSites.length})
              </h2>
            </div>

            {onExploreMore && (
              <button
                onClick={onExploreMore}
                className="text-xs font-semibold text-[#a14009] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>Explore More Monuments</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>

          {savedSites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedSites.map((site) => (
                <MonumentCard
                  key={site.id}
                  site={site}
                  variant="grid"
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onViewMonograph={onViewMonograph}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-[#e2e2e2] text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-[#a14009]">bookmark_border</span>
              <h3 className="font-serif text-lg font-bold text-[#1a1c1c]">No Saved Monuments Yet</h3>
              <p className="text-xs text-[#5f5e5e] max-w-md leading-relaxed">
                Bookmark heritage places and archaeological monuments across your journey to keep them documented in your Heritage Passport.
              </p>
              {onExploreMore && (
                <button
                  onClick={onExploreMore}
                  className="mt-2 px-5 py-2.5 rounded-lg bg-[#a14009] text-white text-xs font-semibold hover:bg-[#853407] transition cursor-pointer"
                >
                  Discover Monuments
                </button>
              )}
            </div>
          )}
        </section>

        {/* Section 2: Heritage Badges & Accreditations (Professional Coming Soon State) */}
        <section className="flex flex-col gap-6 w-full">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#a14009] mb-1 block">
              Official Accreditations &amp; Milestones
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1a1c1c] font-bold">
              Heritage Badges &amp; Honors
            </h2>
            <p className="text-sm text-[#444748] mt-1">
              Official field exploration honors authenticated through verified GPS check-ins at protected monuments.
            </p>
          </div>

          <ComingSoonNotice
            title="Digital Heritage Badges — System Integration in Progress"
            message="The verified check-in and heritage badge accreditation engine is currently being integrated with regional archaeological circles. Once active, your visits to protected monuments will be digitally authenticated and minted here."
            icon="military_tech"
            variant="card"
            badgeText="Coming Soon"
          />
        </section>
      </div>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1a1c1c] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl border border-[#e2e2e2]">
            <div className="flex items-center justify-between pb-4 border-b border-[#e8e8e8] mb-5">
              <h3 className="font-serif text-xl font-bold text-[#1a1c1c]">
                Edit Explorer Profile
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#747878] hover:text-[#1a1c1c] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#e2e2e2] bg-[#f9f9f9] text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase mb-1">
                  Active Region
                </label>
                <div className="flex items-center justify-between px-3 py-2 text-sm rounded-lg border border-[#e2e2e2] bg-[#f3f3f3] text-[#555]">
                  <span>{selectedDistrictName}, {selectedStateCode}, India</span>
                  {onOpenStateDistrictModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditProfileOpen(false);
                        onOpenStateDistrictModal();
                      }}
                      className="text-xs font-semibold text-[#a14009] hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#e8e8e8]">
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#555] hover:bg-[#f3f3f3] rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSavingUser}
                onClick={async () => {
                  if (onUpdateUser) {
                    setIsSavingUser(true);
                    try {
                      await onUpdateUser(userName);
                      setIsEditProfileOpen(false);
                      setShareToast('Profile updated successfully!');
                      setTimeout(() => setShareToast(null), 3000);
                    } finally {
                      setIsSavingUser(false);
                    }
                  } else {
                    setIsEditProfileOpen(false);
                  }
                }}
                className="px-5 py-2 text-xs font-semibold bg-[#a14009] text-white hover:bg-[#853407] rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSavingUser ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
