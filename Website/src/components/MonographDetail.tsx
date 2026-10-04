import React, { useState } from 'react';
import { HeritageSite, MediaItem } from '../types';
import { TicketPassModal } from './TicketPassModal';
import { ComingSoonNotice } from './ComingSoonNotice';

interface MonographDetailProps {
  site: HeritageSite;
  onBack: () => void;
  isSavedToPassport: boolean;
  onToggleSavePassport: (siteId: string) => void;
  onOpenMediaModal: (media: MediaItem) => void;
  onOpenDirections: (site: HeritageSite) => void;
  onNavigatePassport?: () => void;
}

export const MonographDetail: React.FC<MonographDetailProps> = ({
  site,
  onBack,
  isSavedToPassport,
  onToggleSavePassport,
  onOpenMediaModal,
  onOpenDirections,
  onNavigatePassport,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'about' | 'visual'>('details');
  const [selectedMediaCategory, setSelectedMediaCategory] = useState<string>('All Media');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [monographNotice, setMonographNotice] = useState<string | null>(null);

  const mediaCategories = [
    'All Media',
    'Archival Photography',
    'Documentary Films',
    '360° Photogrammetry',
  ];

  const filteredMedia = (site.mediaItems || []).filter((item) => {
    if (selectedMediaCategory === 'All Media') return true;
    if (selectedMediaCategory === 'Archival Photography' && item.category === 'Archival Photography') return true;
    if (selectedMediaCategory === 'Documentary Films' && (item.category === 'Documentary Films' || item.badge?.includes('Video') || item.videoUrl)) return true;
    if (selectedMediaCategory === '360° Photogrammetry' && item.category === '360° Photogrammetry') return true;
    return item.category === selectedMediaCategory;
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleDownloadMonograph = () => {
    // If an official admin-uploaded document exists, open/download it
    if (site.documents && site.documents.length > 0 && site.documents[0]?.url) {
      const doc = site.documents[0];
      const link = document.createElement('a');
      link.href = doc.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `${site.name.replace(/\s+/g, '_')}_Official_Monograph`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Otherwise show professional upcoming publication notice (NO dummy text files)
    setMonographNotice(
      `The official verified archival monograph for ${site.name} is currently being cataloged by heritage curators. It will be made available for download shortly.`
    );
    setTimeout(() => setMonographNotice(null), 5000);
  };

  return (
    <div className="flex flex-col w-full pb-20 animate-fadeIn">
      {/* 1. Cover Page of Place with Overlay Title */}
      <div className="relative w-full h-[520px] md:h-[620px] overflow-hidden bg-[#000000]">
        <img
          alt={site.name}
          className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-700 hover:scale-105"
          src={site.image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1200&auto=format&fit=crop'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"></div>

        {/* Top Overlay Badges */}
        <div className="absolute top-6 left-0 right-0 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <button
              onClick={onBack}
              aria-label="Back to previous catalogue"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9f9f9]/90 hover:bg-[#f9f9f9] backdrop-blur-md text-[#1a1c1c] hover:text-[#a14009] text-xs font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer mr-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back</span>
            </button>
            <span className="px-3 py-1 rounded-full bg-[#a14009] text-white text-xs font-semibold uppercase tracking-wider shadow-md">
              {site.category || 'Heritage'}
            </span>
            {site.dynasty && (
              <span className="px-3 py-1 rounded-full bg-[#f9f9f9]/90 backdrop-blur-md text-[#1a1c1c] text-xs font-medium uppercase tracking-wider hidden sm:inline-flex">
                {site.dynasty}
              </span>
            )}
            {site.builtYear && (
              <span className="px-3 py-1 rounded-full bg-[#f9f9f9]/80 backdrop-blur-md text-[#1a1c1c] text-xs font-medium uppercase tracking-wider hidden md:inline-flex">
                Era: {site.builtYear}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f9f9f9]/90 backdrop-blur-md text-[#1a1c1c] text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#a14009] animate-pulse"></span>
              <span>Digital Heritage Record</span>
            </span>
          </div>
        </div>

        {/* Bottom Cover Title & Subtitle Overlay */}
        <div className="absolute bottom-8 left-0 right-0 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex flex-col md:flex-row md:items-end justify-between gap-6 text-white">
          <div className="flex flex-col gap-2 max-w-3xl">
            {site.location && (
              <div className="flex items-center gap-2 text-[#ffdbcd] text-xs font-semibold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>{site.location}</span>
              </div>
            )}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight drop-shadow-md">
              {site.name}
            </h1>
            {site.subTitle && (
              <p className="font-serif text-lg sm:text-xl text-[#ffdbcd] italic drop-shadow">
                {site.subTitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onToggleSavePassport(site.id)}
              className={`px-4 py-2.5 rounded-lg backdrop-blur-md text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                isSavedToPassport
                  ? 'bg-[#a14009] text-white'
                  : 'bg-[#f9f9f9]/90 hover:bg-[#f9f9f9] text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSavedToPassport ? 'bookmark_added' : 'bookmark_border'}
              </span>
              <span>{isSavedToPassport ? 'Saved to Passport' : 'Save to Passport'}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-lg bg-black/80 backdrop-blur-md hover:bg-black text-white border border-white/20 text-xs font-medium flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monograph Status Notice Banner (when user requests download) */}
      {monographNotice && (
        <div className="w-full bg-[#fcf5f1] border-b border-[#a14009]/30 p-4">
          <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex items-center justify-between gap-4 text-xs sm:text-sm text-[#6a2500]">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#a14009] text-[20px] shrink-0">
                pending_actions
              </span>
              <span>{monographNotice}</span>
            </div>
            <button
              onClick={() => setMonographNotice(null)}
              className="text-[#6a2500] hover:text-black font-semibold text-xs shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Heritage Editorial Sticky Navigation Tabs */}
      <div className="w-full bg-[#f9f9f9] border-b border-[#e2e2e2] sticky top-20 z-40 backdrop-blur-md bg-[#f9f9f9]/95 shadow-xs">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-2 text-sm tracking-wide flex items-center gap-2 transition-colors focus:outline-none cursor-pointer ${
                activeTab === 'details'
                  ? 'border-b-2 border-[#a14009] text-[#a14009] font-bold'
                  : 'border-b-2 border-transparent text-[#444748] hover:text-[#1a1c1c] font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              <span>Details & Monograph</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-2 text-sm tracking-wide flex items-center gap-2 transition-colors focus:outline-none cursor-pointer ${
                activeTab === 'about'
                  ? 'border-b-2 border-[#a14009] text-[#a14009] font-bold'
                  : 'border-b-2 border-transparent text-[#444748] hover:text-[#1a1c1c] font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
              <span>Visitor Information</span>
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              className={`py-4 px-2 text-sm tracking-wide flex items-center gap-2 transition-colors focus:outline-none cursor-pointer ${
                activeTab === 'visual'
                  ? 'border-b-2 border-[#a14009] text-[#a14009] font-bold'
                  : 'border-b-2 border-transparent text-[#444748] hover:text-[#1a1c1c] font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>Visual Archive</span>
            </button>
          </div>

          {/* Time display: ONLY show if verified timing exists */}
          {site.openingHours && (
            <div className="hidden md:flex items-center gap-2 text-xs text-[#444748] font-mono bg-white px-3 py-1.5 rounded-full border border-[#e2e2e2]">
              <span className="material-symbols-outlined text-[16px] text-[#a14009]">schedule</span>
              <span>{site.openingHours}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. TAB 1: DETAILS */}
      {activeTab === 'details' && (
        <section className="w-full bg-[#f9f9f9] py-12 lg:py-16">
          <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Monograph Narrative */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#a14009] font-semibold">
                    Architectural Monograph & Registry Record
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1a1c1c] mt-1">
                    {site.name} {site.subTitle ? `— ${site.subTitle}` : ''}
                  </h2>
                </div>

                <div className="prose prose-stone max-w-none text-base sm:text-lg text-[#1a1c1c] leading-relaxed space-y-4">
                  <p className="whitespace-pre-line">
                    {site.description || 'Verified archival descriptions and documentation for this heritage landmark are currently being cataloged by authorized curators.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <button
                    onClick={handleDownloadMonograph}
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white font-semibold text-sm transition-all shadow-md active:scale-95 group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold leading-tight">
                        {site.documents && site.documents.length > 0 ? 'Download Official Monograph' : 'Official Monograph (In Review)'}
                      </span>
                      <span className="text-xs font-mono opacity-90">
                        {site.documents && site.documents.length > 0 ? 'Verified Archival PDF' : 'Curated Documentation'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] ml-1 group-hover:translate-y-0.5 transition-transform">
                      {site.documents && site.documents.length > 0 ? 'download' : 'info'}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('about')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-white border border-[#e2e2e2] text-[#1a1c1c] hover:bg-[#f3f3f3] font-semibold text-sm transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#a14009]">
                      info
                    </span>
                    <span>View Visitor Guide</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Key Archaeological Attributes */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-[#e2e2e2] p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="font-serif text-lg font-bold text-[#1a1c1c] border-b border-[#eeeeee] pb-3">
                    Heritage Attributes
                  </h3>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Era / Foundation</span>
                      <span className="font-semibold text-[#1a1c1c]">{site.builtYear || 'To be updated'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Dynasty / Builder</span>
                      <span className="font-semibold text-[#1a1c1c]">{site.dynasty || 'To be updated'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Heritage Category</span>
                      <span className="font-semibold text-[#1a1c1c]">{site.category || 'Heritage'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Location</span>
                      <span className="font-semibold text-[#1a1c1c] truncate max-w-[180px]">{site.location || 'India'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#747878]">Visiting Schedule</span>
                      <span className="font-semibold text-[#1a1c1c]">{site.openingHours || 'To be updated'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#fbf2eb] rounded-2xl border border-[#a14009]/20 p-5 flex items-start gap-3 text-xs text-[#6a2500]">
                  <span className="material-symbols-outlined text-[#a14009] text-[20px] shrink-0">
                    verified
                  </span>
                  <div>
                    <strong className="block font-semibold text-sm text-[#a14009] mb-1">
                      Dharohar National Registry Entry
                    </strong>
                    Cataloged and maintained through official heritage archival channels.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. TAB 2: VISITOR INFORMATION */}
      {activeTab === 'about' && (
        <section className="w-full bg-[#f3f3f3] py-16" id="practical-guide">
          <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex flex-col gap-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#a14009] font-semibold">
                Field Guide & Operations
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1a1c1c] mt-1">
                Practical Visitor Information for {site.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CARD 1: ENTRY TARIFFS & PASSES */}
              <div className="flex flex-col rounded-2xl bg-white border border-[#e2e2e2] p-6 shadow-sm justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#a14009]/10 flex items-center justify-center text-[#a14009]">
                      <span className="material-symbols-outlined text-[24px]">payments</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-[#eeeeee] text-xs font-medium text-[#444748]">
                      Official Tariffs
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1c1c] font-semibold">
                    Entry Tariffs & Passes
                  </h3>

                  {site.visitorTariffs && site.visitorTariffs.length > 0 ? (
                    <ul className="flex flex-col divide-y divide-[#eeeeee] text-sm">
                      {site.visitorTariffs.map((t, idx) => (
                        <li key={idx} className="py-2.5 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[#444748] font-medium">{t.category}</span>
                            {t.note && <span className="text-[11px] text-[#5f5e5e]">{t.note}</span>}
                          </div>
                          <span
                            className={`font-bold ${
                              t.highlight ? 'text-[#a14009] font-semibold' : 'text-[#1a1c1c]'
                            }`}
                          >
                            {t.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ComingSoonNotice
                      title="Tariffs Under Verification"
                      message="Official admission tariffs are currently being updated. Please check on-site ticketing counters."
                      icon="payments"
                      variant="card"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => setIsTicketModalOpen(true)}
                    className="w-full py-3 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                    <span>Book Time-Slotted Pass</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigatePassport) {
                        onNavigatePassport();
                      } else {
                        onToggleSavePassport(site.id);
                      }
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#f9f9f9] hover:bg-[#eeeeee] text-[#1a1c1c] font-medium text-xs border border-[#e2e2e2] transition-colors cursor-pointer"
                  >
                    Verify with Heritage Passport
                  </button>
                </div>
              </div>

              {/* CARD 2: VISITING HOURS */}
              <div className="flex flex-col rounded-2xl bg-white border border-[#e2e2e2] p-6 shadow-sm justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#a14009]/10 flex items-center justify-center text-[#a14009]">
                      <span className="material-symbols-outlined text-[24px]">schedule</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffe088]/40 text-[#241a00] text-[11px] font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#735c00]"></span> Daily Hours
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1c1c] font-semibold">
                    Visiting Hours & Schedule
                  </h3>

                  {site.openingHours ? (
                    <div className="flex flex-col gap-3.5 text-sm">
                      <div className="p-3.5 rounded-lg bg-[#eeeeee] flex flex-col gap-1">
                        <span className="text-[11px] text-[#5f5e5e] uppercase tracking-wider font-semibold">
                          Public Monument Gates
                        </span>
                        <span className="font-semibold text-[#1a1c1c] text-base">
                          {site.openingHours}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <ComingSoonNotice
                      title="Visiting Hours Being Verified"
                      message="Official visiting hours and schedule will be updated as soon as verified with administrative circulars."
                      icon="schedule"
                      variant="card"
                    />
                  )}
                </div>
              </div>

              {/* CARD 3: TRANSIT & DIRECTIONS */}
              <div className="flex flex-col rounded-2xl bg-white border border-[#e2e2e2] p-6 shadow-sm justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#a14009]/10 flex items-center justify-center text-[#a14009]">
                      <span className="material-symbols-outlined text-[24px]">near_me</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-[#eeeeee] text-xs font-medium text-[#444748]">
                      {site.location || 'Local Circle'}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1c1c] font-semibold">
                    Transit & Directions
                  </h3>

                  <div
                    className="relative w-full h-32 rounded-xl bg-cover bg-center overflow-hidden flex items-end p-2.5 cursor-pointer bg-neutral-200"
                    onClick={() => onOpenDirections(site)}
                    style={{
                      backgroundImage: site.image ? `url('${site.image}')` : undefined,
                    }}
                  >
                    <div className="bg-[#f9f9f9]/95 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-medium text-[#1a1c1c] flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[14px] text-[#a14009]">
                        location_on
                      </span>
                      <span>{site.location || site.name} (Click to Route)</span>
                    </div>
                  </div>

                  {site.transitOptions && site.transitOptions.length > 0 ? (
                    <ul className="flex flex-col gap-2.5 text-xs text-[#444748]">
                      {site.transitOptions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#a14009] shrink-0">
                            directions
                          </span>
                          <span>
                            <strong>{item.title || item.mode || 'Transit'}:</strong> {item.detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ComingSoonNotice
                      variant="inline"
                      message="Detailed public transit corridor options will be updated soon."
                      icon="directions_bus"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => onOpenDirections(site)}
                    className="w-full py-2.5 rounded-lg bg-[#f9f9f9] hover:bg-[#eeeeee] text-[#1a1c1c] text-center font-medium text-xs border border-[#e2e2e2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#a14009]">map</span>
                    <span>Open in Navigation Apps</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. TAB 3: VISUAL ARCHIVE */}
      {activeTab === 'visual' && (
        <section className="w-full py-16 bg-[#f9f9f9] border-b border-[#e2e2e2]" id="visual-archives">
          <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#a14009] font-semibold">
                  Curated Heritage Repository
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#1a1c1c] mt-1">
                  Visual & Media Archive for {site.name}
                </h2>
                <p className="text-xs text-[#444748] mt-1.5">
                  Curated photography, architectural documentation, and historical audio-visual records.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {mediaCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedMediaCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      selectedMediaCategory === cat
                        ? 'bg-[#a14009] text-white font-semibold shadow-sm'
                        : 'bg-[#eeeeee] hover:bg-[#e8e8e8] text-[#444748]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Archive Grid */}
            {filteredMedia.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredMedia.map((media) => {
                  const isVideo = Boolean(media.videoUrl || media.category === 'Documentary Films' || media.badge?.includes('Video'));
                  return (
                    <div
                      key={media.id}
                      onClick={() => onOpenMediaModal(media)}
                      className="flex flex-col rounded-2xl bg-white border border-[#e2e2e2] overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                    >
                      <div className="relative h-60 w-full overflow-hidden bg-black">
                        <img
                          alt={media.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          src={media.image || site.image}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#1a1c1c] group-hover:scale-110 shadow-md transition-transform">
                            <span className="material-symbols-outlined text-[22px] text-[#a14009]">
                              {isVideo ? 'play_arrow' : 'photo_camera'}
                            </span>
                          </div>
                        </div>
                        {media.badge && (
                          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold text-[#a14009] uppercase flex items-center gap-1">
                            {isVideo && <span className="material-symbols-outlined text-[13px]">videocam</span>}
                            <span>{media.badge}</span>
                          </div>
                        )}
                        {media.duration && (
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] text-white font-mono">
                            {media.duration}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col gap-2.5 flex-1 justify-between">
                        <div className="flex flex-col gap-1.5">
                          <h3 className="font-serif text-[18px] text-[#1a1c1c] font-semibold leading-tight group-hover:text-[#a14009] transition-colors">
                            {media.title}
                          </h3>
                          {media.description && (
                            <p className="text-xs text-[#444748] leading-relaxed line-clamp-2">
                              {media.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-[#eeeeee] text-xs">
                          <span className="text-[#444748] font-mono">{media.meta || 'Official Archive'}</span>
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a14009] text-white font-semibold hover:bg-black transition-colors shadow-2xs cursor-pointer">
                            <span className="material-symbols-outlined text-[16px]">
                              {isVideo ? 'play_circle' : 'visibility'}
                            </span>
                            <span>{isVideo ? 'Play Video' : 'View Photo'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ComingSoonNotice
                title="Media Archive Being Digitized"
                message="High-resolution photography, photogrammetry, and documentary footage for this category are actively being curated."
                icon="photo_library"
                variant="card"
              />
            )}
          </div>
        </section>
      )}

      {/* 6. Time-Slotted Pass Modal */}
      {isTicketModalOpen && (
        <TicketPassModal
          site={site}
          onClose={() => setIsTicketModalOpen(false)}
        />
      )}
    </div>
  );
};
