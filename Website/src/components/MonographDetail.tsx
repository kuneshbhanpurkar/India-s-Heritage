import React, { useState } from 'react';
import { HeritageSite, MediaItem } from '../types';
import { TicketPassModal } from './TicketPassModal';

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

  const mediaCategories = [
    'All Media',
    'Archival Photography',
    'Documentary Films',
    '360° Photogrammetry',
    'Vintage Lithographs',
  ];

  const filteredMedia = (site.mediaItems || []).filter((item) => {
    if (selectedMediaCategory === 'All Media') return true;
    if (selectedMediaCategory === 'Archival Photography' && item.category === 'Archival Photography') return true;
    if (selectedMediaCategory === 'Documentary Films' && (item.category === 'Documentary Films' || item.badge === 'Docuseries')) return true;
    if (selectedMediaCategory === '360° Photogrammetry' && (item.category === '360° Photogrammetry' || item.badge === '4K Video')) return true;
    if (selectedMediaCategory === 'Vintage Lithographs' && item.badge === 'Archival Footage') return true;
    return true;
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleDownloadMonograph = () => {
    const textContent = `ARCHAEOLOGICAL SURVEY OF INDIA (ASI)
NATIONAL DIGITAL HERITAGE REPOSITORY - MONOGRAPH REGISTER
============================================================
MONUMENT NAME: ${site.name.toUpperCase()}
CLASSIFICATION: Centrally Protected Monument (Grade I)
LOCATION: ${site.location}
ERA / BUILT YEAR: ${site.builtYear || '18th Century'}
DYNASTY / CUSTODIANS: ${site.dynasty}
COORDINATES: ${site.coordinates.lat}° N, ${site.coordinates.lng}° E
RATING: ${site.rating} / 5.0 (${site.reviewsCount} verified scholarly reviews)

ARCHITECTURAL MONOGRAPH:
${site.description}

ARCHITECTURAL SPECIFICATIONS:
- Structural Order: Hybridized Maratha-French Neoclassical
- Lower Storeys: 3 Tiers of Basalt Stone Fortification
- Upper Storeys: 4 Tiers of Interlocking Narmada Teak Framework
- Courtyard: Central Maratha Quadrangle Chowk with Gaddi Ghar

VISITOR GUIDELINES:
- Visiting Hours: ${site.openingHours}
- Entry Tariffs: ₹10 (Indian Citizens), ₹250 (Foreign Tourists)
- Night Sound & Light Show: 07:30 PM - 09:15 PM Daily
- Closed: Mondays for conservation maintenance

(C) 2026 Archaeological Survey of India & Indian Heritage Digital Archives.
Preserving 5,000 Years of Living Civilization.`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${site.name.replace(/\s+/g, '_')}_ASI_Official_Monograph.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* 1. Cover Page of Place with Overlay Title */}
      <div className="relative w-full h-[520px] md:h-[620px] overflow-hidden bg-[#000000]">
        <img
          alt={site.name}
          className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-700 hover:scale-105"
          src={site.image}
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
              Centrally Protected Monument
            </span>
            <span className="px-3 py-1 rounded-full bg-[#f9f9f9]/90 backdrop-blur-md text-[#1a1c1c] text-xs font-medium uppercase tracking-wider hidden sm:inline-flex">
              Holkar Royal Dynasty
            </span>
            <span className="px-3 py-1 rounded-full bg-[#f9f9f9]/80 backdrop-blur-md text-[#1a1c1c] text-xs font-medium uppercase tracking-wider hidden md:inline-flex">
              Grade I Heritage Structure
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f9f9f9]/90 backdrop-blur-md text-[#1a1c1c] text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#a14009] animate-pulse"></span>
              <span>Ultra-HD 4K Photogrammetry</span>
            </span>
          </div>
        </div>

        {/* Bottom Cover Title & Subtitle Overlay */}
        <div className="absolute bottom-8 left-0 right-0 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex flex-col md:flex-row md:items-end justify-between gap-6 text-white">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 text-[#ffdbcd] text-xs font-semibold uppercase tracking-widest">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{site.location.includes('MP') ? 'Indore, Madhya Pradesh, India' : site.location}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-bold tracking-tight drop-shadow-md">
              {site.name}
            </h1>
            <p className="font-serif text-lg sm:text-xl text-[#ffdbcd] italic drop-shadow">
              {site.subTitle || site.description}
            </p>
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
              <span>Details</span>
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
              <span>About</span>
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
              <span>Visual</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-[#444748] font-mono">
            <span className="material-symbols-outlined text-[16px] text-[#a14009]">wb_twilight</span>
            <span>Light & Sound: 19:30 IST</span>
          </div>
        </div>
      </div>

      {/* 3. TAB 1: DETAILS */}
      {activeTab === 'details' && (
        <section className="w-full bg-[#f9f9f9] py-12 lg:py-16">
          <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Rich Monograph Narrative */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#a14009] font-semibold">
                    Architectural Monograph
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-[#1a1c1c] mt-1">
                    A Marvel of Hybridized Maratha Civil Engineering
                  </h2>
                </div>

                <p className="text-lg text-[#1a1c1c] leading-relaxed">
                  Erected in the epicenter of old Indore near the confluence of the Saraswati and
                  Khan rivers, {site.name} stands as one of India's most idiosyncratic royal edifices.
                  Commissioned by Subhedar Malhar Rao Holkar and subsequently enriched under the
                  enlightened aegis of{' '}
                  <strong className="text-[#1a1c1c] font-semibold">Rani Ahilyabai Holkar</strong>, the
                  palace broke dramatically with typical regional fortification norms.
                </p>

                <p className="text-base text-[#444748] leading-relaxed">
                  The lower three floors are massive bastions of locally quarried dark grey basalt
                  stone, designed to resist siege and provide defensive stability. Above this solid
                  mineral base, master carpenters constructed four magnificent upper storeys entirely
                  out of interlocking teak timber framework sourced from the dense Narmada river
                  valley forests. This deliberate dual material choice lent earthquake-resilient
                  flexibility, natural interior cooling during intense Malwa summers, and permitted
                  dizzying verticality unmatched in Central India.
                </p>

                {/* Quote Callout */}
                <div className="p-5 rounded-xl bg-white border-l-4 border-[#a14009] shadow-sm my-2">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#a14009] text-[32px] shrink-0 leading-none select-none">
                      format_quote
                    </span>
                    <div className="flex flex-col gap-2">
                      <p className="font-serif text-[20px] text-[#1a1c1c] italic leading-snug">
                        "Rajwada is not merely a residence of princes; it is the civic temple from
                        which Devi Ahilyabai dispensed justice directly to merchants, farmers, and
                        scholars across India."
                      </p>
                      <span className="block text-xs text-[#5f5e5e] uppercase tracking-wider font-medium font-sans">
                        — Architectural Survey of India Field Survey Memoir, 1923
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-base text-[#444748] leading-relaxed">
                  The spatial layout is anchored by a classical Maratha-style internal quadrangular
                  courtyard (<em className="italic">Chowk</em>), ringed by delicately carved wooden
                  balconies, fluted stilted pillars, and ornamental cusped arches that borrow fluidly
                  from Mughal, Rajput, and French neoclassical repertoires. The royal court (
                  <em className="italic">Gaddi Ghar</em>) and sanctum sanctorum situated on the
                  mezzanine level offered deliberate visual vantage points over the public forecourt,
                  allowing the Holkar rulers to remain accessible while retaining defensive
                  seclusion.
                </p>

                <p className="text-base text-[#444748] leading-relaxed">
                  Despite surviving catastrophic conflagrations in 1801 during Sarjerao Ghatke's
                  sack, in 1957, and the severe communal riots of 1984, the monument underwent a
                  historic, award-winning conservation program by the ASI and INTACH. Utilizing
                  authentic lime-surkhi mortars, traditional joinery, and seasoned wood, the
                  monumental southern and eastern elevations were restored to their 18th-century glory.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <button
                    onClick={handleDownloadMonograph}
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-[#a14009] hover:bg-[#7d2d00] text-white font-semibold text-sm transition-all shadow-md active:scale-95 group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold leading-tight">Download Official Monograph</span>
                      <span className="text-xs font-mono opacity-90">Archival Edition • Instant Save</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] ml-1 group-hover:translate-y-0.5 transition-transform">
                      download
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('about')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-white border border-[#e2e2e2] text-[#1a1c1c] hover:bg-[#f3f3f3] font-semibold text-sm transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#a14009]">
                      schedule
                    </span>
                    <span>View Visitor Guide & Hours</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Key Archaeological Attributes */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-[#e2e2e2] p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="font-serif text-lg font-bold text-[#1a1c1c] border-b border-[#eeeeee] pb-3">
                    Fast Architectural Facts
                  </h3>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Era / Foundation</span>
                      <span className="font-semibold text-[#1a1c1c]">{site.builtYear || '1766 CE'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Architectural Order</span>
                      <span className="font-semibold text-[#1a1c1c]">Maratha-French Hybrid</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Number of Storeys</span>
                      <span className="font-semibold text-[#1a1c1c]">7 Tiers (3 Stone + 4 Wood)</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Primary Builder</span>
                      <span className="font-semibold text-[#1a1c1c]">Malhar Rao Holkar I</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f3f3f3]">
                      <span className="text-[#747878]">Historic Custodian</span>
                      <span className="font-semibold text-[#1a1c1c]">Ahilyabai Holkar Trust</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#747878]">Statutory Status</span>
                      <span className="font-semibold text-[#a14009]">Centrally Protected (ASI)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#fbf2eb] rounded-2xl border border-[#a14009]/20 p-5 flex items-start gap-3 text-xs text-[#6a2500]">
                  <span className="material-symbols-outlined text-[#a14009] text-[20px] shrink-0">
                    verified
                  </span>
                  <div>
                    <strong className="block font-semibold text-sm text-[#a14009] mb-1">
                      UNESCO Heritage Tentative List
                    </strong>
                    Nominated under "Historic Ensembles of the Holkars of Malwa" for exemplary timber
                    joinery and public darbar governance.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. TAB 2: ABOUT / PRACTICAL VISITOR INFORMATION */}
      {activeTab === 'about' && (
        <section className="w-full bg-[#f3f3f3] py-16" id="practical-guide">
          <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 flex flex-col gap-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#a14009] font-semibold">
                Field Guide & Operations
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1a1c1c] mt-1">
                Practical Visitor Information
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
                      Standard ASI Tariffs
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1c1c] font-semibold">
                    Entry Tariffs & Passes
                  </h3>
                  <ul className="flex flex-col divide-y divide-[#eeeeee] text-sm">
                    {(site.visitorTariffs || []).map((t, idx) => (
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
                      <span className="w-2 h-2 rounded-full bg-[#735c00]"></span> Moderate Footfall
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1c1c] font-semibold">
                    Visiting Hours
                  </h3>
                  <div className="flex flex-col gap-3.5 text-sm">
                    <div className="p-3 rounded-lg bg-[#eeeeee] flex flex-col gap-1">
                      <span className="text-[11px] text-[#5f5e5e] uppercase tracking-wider font-semibold">
                        Monument Public Gates
                      </span>
                      <span className="font-semibold text-[#1a1c1c]">
                        Tuesday to Sunday: 10:00 AM – 05:00 PM
                      </span>
                      <span className="text-xs text-[#444748]">
                        Last ticketing booth admission at 04:30 PM
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#eeeeee] flex flex-col gap-1">
                      <span className="text-[11px] text-[#5f5e5e] uppercase tracking-wider font-semibold">
                        Evening Sound & Light Show
                      </span>
                      <span className="font-semibold text-[#1a1c1c]">
                        07:30 PM – 09:15 PM Daily
                      </span>
                      <span className="text-xs text-[#444748]">
                        Gates reopen 30 mins prior to evening show
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#ffdad6]/40 text-[#93000a] flex items-center gap-2 text-xs font-medium">
                      <span className="material-symbols-outlined text-[18px]">event_busy</span>
                      <span>Closed on Mondays for weekly ASI conservation & maintenance.</span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1 text-xs text-[#444748]">
                      <div className="flex justify-between">
                        <span>Best Season:</span>
                        <span className="font-semibold text-[#1a1c1c]">October through March</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recommended Duration:</span>
                        <span className="font-semibold text-[#1a1c1c]">2.0 – 2.5 Hours</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#e8e8e8]/60 flex items-center gap-2.5 text-xs text-[#444748]">
                  <span className="material-symbols-outlined text-[18px] text-[#a14009]">info</span>
                  <span>Shoe covers provided free of charge at royal darbar threshold.</span>
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
                      Central Indore Zone
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1c1c] font-semibold">
                    Transit & Directions
                  </h3>
                  <div
                    className="relative w-full h-32 rounded-xl bg-cover bg-center overflow-hidden flex items-end p-2.5 cursor-pointer"
                    onClick={() => onOpenDirections(site)}
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAa0_C7-eLNri27EXqLp-wXGAsGT2RIhUzNCLNlmLZmqVjgSCXqbWDOKGm1o0fViS5nC7Lfk5RaX0awnvOuVTqpPlsZv3EANBCCfo4ZOpBp7IHEP9cSqVrz6AVnGrpR3ZnbhkpQCpJZu1gZ54pM1RKSupJBEgJuQgfcPdnjsbjUPyE2W0N9kmyQNsbwMsFpoCdcFsStx8xjVY9vjJM6tCulgX4-lf3IZDDwCmcfu15c-sD_MDHRKhXM')`,
                    }}
                  >
                    <div className="bg-[#f9f9f9]/95 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-medium text-[#1a1c1c] flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[14px] text-[#a14009]">
                        location_on
                      </span>
                      <span>Rajwada Chowk, MG Road (Click to Route)</span>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2.5 text-xs text-[#444748]">
                    {(site.transitOptions || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#a14009] shrink-0">
                          {item.icon}
                        </span>
                        <span>
                          <strong>{item.title}:</strong> {item.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
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
                  Visual & Media Archive
                </h2>
                <p className="text-xs text-[#444748] mt-1.5">
                  Curated photography, architectural documentation, and historical audio-visual
                  records.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredMedia.map((media) => (
                <div
                  key={media.id}
                  onClick={() => onOpenMediaModal(media)}
                  className="flex flex-col rounded-2xl bg-white border border-[#e2e2e2] overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                >
                  <div className="relative h-60 w-full overflow-hidden bg-black">
                    <img
                      alt={media.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      src={media.image}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#1a1c1c] group-hover:scale-110 shadow-md transition-transform">
                        <span className="material-symbols-outlined text-[20px] text-[#a14009]">
                          play_arrow
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold text-[#a14009] uppercase">
                      {media.badge}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] text-white font-mono">
                      {media.duration}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-2.5 flex-1 justify-between">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-serif text-[18px] text-[#1a1c1c] font-semibold leading-tight group-hover:text-[#a14009] transition-colors">
                        {media.title}
                      </h3>
                      <p className="text-xs text-[#444748] leading-relaxed line-clamp-2">
                        {media.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#eeeeee] text-xs">
                      <span className="text-[#444748] font-mono">{media.meta}</span>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a14009] text-white font-semibold hover:bg-black transition-colors shadow-2xs">
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        <span>Watch Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
