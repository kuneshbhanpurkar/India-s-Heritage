import React, { useEffect, useState } from 'react';
import { RecordStep, VideoRecord, PdfDocument, HeritagePlace } from '../types';
import { ToggleSwitch, TariffInput, DaySelector } from './common';

interface AddRecordWizardProps {
  onCancel: () => void;
  onPublish: (newPlace: Partial<HeritagePlace>) => void;
  editingPlace?: HeritagePlace | null;
  selectedState: string;
  selectedDistrict: string;
  videos: VideoRecord[];
  onAddVideo: (video: Omit<VideoRecord, 'id'>) => void;
  onDeleteVideo: (id: string) => void;
  onPreviewVideo: (video: VideoRecord) => void;
  pdfDocuments: PdfDocument[];
  onAddPdf: (pdf: Omit<PdfDocument, 'id'>) => void;
  onDeletePdf: (id: string) => void;
  onPreviewPdf: (pdf: PdfDocument) => void;
  onPreviewImage: (url: string, title: string) => void;
}

export const AddRecordWizard: React.FC<AddRecordWizardProps> = ({
  onCancel,
  onPublish,
  editingPlace,
  selectedState,
  selectedDistrict,
  videos,
  onAddVideo,
  onDeleteVideo,
  onPreviewVideo,
  pdfDocuments,
  onAddPdf,
  onDeletePdf,
  onPreviewPdf,
  onPreviewImage,
}) => {
  const [currentStep, setCurrentStep] = useState<RecordStep>(1);
  const [step2Enabled, setStep2Enabled] = useState(true);
  const [step3Enabled, setStep3Enabled] = useState(true);
  const [locationCoordinatesEnabled, setLocationCoordinatesEnabled] = useState(true);

  // Form Fields - Step 1
  const [coverImageUrl, setCoverImageUrl] = useState(editingPlace?.imageUrl || '');
  const [placeTitle, setPlaceTitle] = useState(editingPlace?.name || '');
  const [vernacularNames, setVernacularNames] = useState(editingPlace?.subTitle || '');
  const [badgeType, setBadgeType] = useState(editingPlace?.category || 'Heritage');
  const [description, setDescription] = useState(editingPlace?.description || '');

  // Visiting Hours & Tariffs
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('05:30 PM');
  const [cutoffTime, setCutoffTime] = useState('05:00 PM');
  const [domesticFee, setDomesticFee] = useState('25');
  const [saarcFee, setSaarcFee] = useState('50');
  const [foreignFee, setForeignFee] = useState('300');
  const [studentFee, setStudentFee] = useState('10');
  const [stillCameraFee, setStillCameraFee] = useState('0');
  const [videoFee, setVideoFee] = useState('0');
  const [nightSlotActive, setNightSlotActive] = useState(false);
  const [nightSlotTime, setNightSlotTime] = useState('07:00 PM - 10:00 PM');

  // Days Open
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ]);

  // Coordinates
  const [latitude, setLatitude] = useState(editingPlace?.latitude ? String(editingPlace.latitude) : '');
  const [longitude, setLongitude] = useState(editingPlace?.longitude ? String(editingPlace.longitude) : '');
  const [mapsUrl, setMapsUrl] = useState('');

  // Step 2 Form - Video Input
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Step 3 Form - PDF Input
  const [newPdfName, setNewPdfName] = useState('');
  const [newPdfUrl, setNewPdfUrl] = useState('');

  const handleLatitudeChange = (val: string) => {
    setLatitude(val);
    const cleanLat = val.replace(/[^0-9.-]/g, '');
    const cleanLng = longitude.replace(/[^0-9.-]/g, '');
    if (cleanLat && cleanLng) {
      setMapsUrl(`https://maps.google.com/?q=${cleanLat},${cleanLng}`);
    }
  };

  const handleLongitudeChange = (val: string) => {
    setLongitude(val);
    const cleanLat = latitude.replace(/[^0-9.-]/g, '');
    const cleanLng = val.replace(/[^0-9.-]/g, '');
    if (cleanLat && cleanLng) {
      setMapsUrl(`https://maps.google.com/?q=${cleanLat},${cleanLng}`);
    }
  };

  const handleDetectDeviceLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setLatitude(lat);
          setLongitude(lng);
          setMapsUrl(`https://maps.google.com/?q=${lat},${lng}`);
        },
        (err) => {
          alert('Could not retrieve current location: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  useEffect(() => {
    if (!editingPlace) return;
    setCoverImageUrl(editingPlace.imageUrl || '');
    setPlaceTitle(editingPlace.name);
    setBadgeType(editingPlace.category);
    setDescription(editingPlace.description || '');
    if (editingPlace.latitude) setLatitude(String(editingPlace.latitude));
    if (editingPlace.longitude) setLongitude(String(editingPlace.longitude));
    if (editingPlace.latitude && editingPlace.longitude) {
      setMapsUrl(`https://maps.google.com/?q=${editingPlace.latitude},${editingPlace.longitude}`);
    }
    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  }, [editingPlace]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddVideoSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      alert('Please provide both Video Title and YouTube Link.');
      return;
    }
    onAddVideo({
      title: newVideoTitle,
      subtitle: 'Newly Added Stream',
      url: newVideoUrl,
      duration: '07:30 min',
      quality: '4K UHD',
      status: 'Active / Live',
      thumbnail:
        'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80',
    });
    setNewVideoTitle('');
    setNewVideoUrl('');
  };

  const handleAddPdfSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPdfName.trim() || !newPdfUrl.trim()) {
      alert('Please provide both PDF Name and Document URL.');
      return;
    }
    onAddPdf({
      title: newPdfName,
      subtitle: `${selectedState} State Archaeology & Culture Series`,
      url: newPdfUrl,
      fileSize: '6.4 MB',
      pages: '24 Pgs • PDF',
      status: 'Active / Live',
    });
    setNewPdfName('');
    setNewPdfUrl('');
  };

  const handleFinalPublish = () => {
    const latNum = parseFloat(latitude.replace(/[^0-9.-]/g, '')) || 0;
    const lngNum = parseFloat(longitude.replace(/[^0-9.-]/g, '')) || 0;

    onPublish({
      name: placeTitle,
      category: badgeType as any,
      city: selectedDistrict,
      subLocation: `${selectedDistrict} Circle`,
      status: 'Published',
      imageUrl: coverImageUrl,
      description,
      openingHours: `${openingTime} - ${closingTime}`,
      latitude: latNum,
      longitude: lngNum,
      visitorTariffs: [
        { category: 'Indian Citizens', price: `₹${domesticFee}`, highlight: true },
        { category: 'SAARC Citizens', price: `₹${saarcFee}` },
        { category: 'Foreign Visitors', price: `₹${foreignFee}` },
        { category: 'Students', price: `₹${studentFee}` },
        { category: 'Still Camera', price: `₹${stillCameraFee}` },
        { category: 'Video Camera', price: `₹${videoFee}` },
      ],
      media: [
        { type: 'image', url: coverImageUrl, alt: placeTitle },
        ...(step2Enabled ? videos.map((video) => ({ type: 'video', url: video.url, alt: video.title })) : []),
        ...(step3Enabled ? pdfDocuments.map((pdf) => ({ type: 'pdf', url: pdf.url, alt: pdf.title })) : []),
      ],
    });
  };

  const handleSaveDraft = () => {
    const latNum = parseFloat(latitude.replace(/[^0-9.-]/g, '')) || 0;
    const lngNum = parseFloat(longitude.replace(/[^0-9.-]/g, '')) || 0;

    onPublish({
      name: placeTitle,
      category: badgeType as any,
      city: selectedDistrict,
      subLocation: `${selectedDistrict} Circle`,
      status: 'Draft (In Curation)',
      imageUrl: coverImageUrl,
      description,
      openingHours: `${openingTime} - ${closingTime}`,
      latitude: latNum,
      longitude: lngNum,
      visitorTariffs: [
        { category: 'Indian Citizens', price: `₹${domesticFee}`, highlight: true },
        { category: 'SAARC Citizens', price: `₹${saarcFee}` },
        { category: 'Foreign Visitors', price: `₹${foreignFee}` },
      ],
      media: [
        { type: 'image', url: coverImageUrl, alt: placeTitle },
        ...(step2Enabled ? videos.map((video) => ({ type: 'video', url: video.url, alt: video.title })) : []),
        ...(step3Enabled ? pdfDocuments.map((pdf) => ({ type: 'pdf', url: pdf.url, alt: pdf.title })) : []),
      ],
    });
  };

  return (
    <div
      id="add-record-wizard-container"
      className="flex-1 h-full overflow-y-auto bg-[#fbf9f5] p-4 sm:p-8 lg:p-10 select-text"
    >
      <div className="max-w-6xl mx-auto space-y-7 pb-16">
        {/* Header & Action Bar */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-surface-container">
          <div className="space-y-2">
            {/* Context Pill */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-secondary">
              <span className="text-[0.66rem] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                Heritage Surveillance &amp; Directory • Curation Desk
              </span>
              <span className="text-secondary/60">•</span>
              <span className="text-on-surface-variant font-medium">
                {selectedState} Circle
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {editingPlace ? 'Editing Registry Entry' : 'Drafting New Entry'}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-on-surface tracking-tight">
              {editingPlace ? 'Edit Heritage Record' : 'Add New Heritage Record'}
            </h1>
            <p className="text-xs lg:text-sm text-secondary">
              Catalog official architectural monuments, geographical sites, or intangible cultural
              assets into the National Registry.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="top-save-draft-btn"
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/60 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-base text-secondary">save</span>
              <span>Save as Draft</span>
            </button>
            <button
              id="top-publish-btn"
              type="button"
              onClick={handleFinalPublish}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-base">publish</span>
              <span>Publish</span>
            </button>
          </div>
        </header>

        {/* Step Stepper / Tab Bar (3 Steps) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1 Card */}
          <div
            id="stepper-step-1"
            onClick={() => setCurrentStep(1)}
            className={`rounded-xl p-4 shadow-sm flex items-start gap-3.5 cursor-pointer transition-all ${
              currentStep === 1
                ? 'bg-surface-container-lowest border-2 border-primary relative overflow-hidden ring-1 ring-amber-500/30'
                : 'bg-surface-container-lowest border border-outline-variant/50 hover:border-outline-variant'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                currentStep === 1
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {currentStep === 1 ? 'edit_document' : 'check_circle'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[0.68rem] font-bold uppercase tracking-wider ${
                    currentStep === 1 ? 'text-primary' : 'text-emerald-700'
                  }`}
                >
                  Step 1
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[0.62rem] font-bold border ${
                    currentStep === 1
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  }`}
                >
                  {currentStep === 1 ? 'Active' : 'Completed'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-on-surface mt-0.5">Basic Info</h3>
              <p className="text-[0.72rem] text-secondary truncate mt-0.5">
                Core identification &amp; governance
              </p>
            </div>
          </div>

          {/* Step 2 Card */}
          <div
            id="stepper-step-2"
            onClick={() => setCurrentStep(2)}
            className={`rounded-xl p-4 shadow-sm flex items-start gap-3.5 cursor-pointer transition-all ${
              currentStep === 2
                ? 'bg-surface-container-lowest border-2 border-primary relative overflow-hidden ring-1 ring-amber-500/30'
                : 'bg-surface-container-lowest border border-outline-variant/50 hover:border-outline-variant opacity-95'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                currentStep === 2
                  ? 'bg-primary text-white shadow-sm'
                  : currentStep > 2
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-surface-container text-secondary border border-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {currentStep > 2 ? 'check_circle' : 'photo_library'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[0.68rem] font-bold uppercase tracking-wider ${
                    currentStep === 2 ? 'text-primary' : currentStep > 2 ? 'text-emerald-700' : 'text-secondary'
                  }`}
                >
                  Step 2
                </span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={step2Enabled}
                    onChange={setStep2Enabled}
                    statusLabels={{ active: 'Enabled', inactive: 'Disabled' }}
                    color="amber"
                    size="sm"
                  />
                  <span
                    className={`px-2 py-0.5 rounded text-[0.62rem] font-bold border ${
                      currentStep === 2
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : currentStep > 2
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                        : 'bg-surface-container text-secondary border-outline-variant/50'
                    }`}
                  >
                    {currentStep === 2 ? 'Active' : currentStep > 2 ? 'Completed' : 'Ready'}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-on-surface mt-0.5">Visuals &amp; Media</h3>
              <p className="text-[0.72rem] text-secondary truncate mt-0.5">
                Photographs, 3D scans &amp; media
              </p>
            </div>
          </div>

          {/* Step 3 Card */}
          <div
            id="stepper-step-3"
            onClick={() => setCurrentStep(3)}
            className={`rounded-xl p-4 shadow-sm flex items-start gap-3.5 cursor-pointer transition-all ${
              currentStep === 3
                ? 'bg-surface-container-lowest border-2 border-primary relative overflow-hidden ring-1 ring-amber-500/30'
                : 'bg-surface-container-lowest border border-outline-variant/50 hover:border-outline-variant opacity-90'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                currentStep === 3
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-secondary border border-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-lg">menu_book</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[0.68rem] font-bold uppercase tracking-wider ${
                    currentStep === 3 ? 'text-primary' : 'text-secondary'
                  }`}
                >
                  Step 3
                </span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={step3Enabled}
                    onChange={setStep3Enabled}
                    statusLabels={{ active: 'Enabled', inactive: 'Disabled' }}
                    color="amber"
                    size="sm"
                  />
                  <span
                    className={`px-2 py-0.5 rounded text-[0.62rem] font-bold border ${
                      currentStep === 3
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : 'bg-surface-container text-secondary border-outline-variant/50'
                    }`}
                  >
                    {currentStep === 3 ? 'Active' : 'Ready'}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-on-surface mt-0.5">
                Book &amp; Documentation
              </h3>
              <p className="text-[0.72rem] text-secondary truncate mt-0.5">
                Archival monographs, research PDFs &amp; gazetteers
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: BASIC INFO                                                       */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Form Section 1: Monument & Place Identity */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container">
                <span className="material-symbols-outlined text-primary text-xl">foundation</span>
                <h2 className="font-display text-base lg:text-lg font-bold text-on-surface">
                  1. Monument Identity &amp; Cover Imagery
                </h2>
              </div>

              <div className="space-y-4">
                {/* Cover Image URL */}
                <div className="space-y-1.5">
                  <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                    Cover Image Link / URL <span className="text-primary">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-secondary text-base absolute left-3 pointer-events-none">
                      link
                    </span>
                    <input
                      id="cover-image-input"
                      className="w-full bg-[#fbf9f5] rounded-lg pl-9 pr-24 py-2.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-secondary/60"
                      placeholder="https://images.unsplash.com/... or official CDN asset URL"
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                    />
                    <button
                      id="preview-cover-btn"
                      type="button"
                      onClick={() => onPreviewImage(coverImageUrl, placeTitle)}
                      className="absolute right-2 px-2.5 py-1 text-[0.68rem] font-semibold bg-surface-container hover:bg-surface-container-high rounded text-secondary hover:text-on-surface border border-outline-variant/40 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">preview</span>
                      <span>Preview</span>
                    </button>
                  </div>
                  <p className="text-[0.66rem] text-secondary">
                    Direct CDN link or high-resolution public image URL for the primary cover banner.
                  </p>
                </div>

                {/* Place Name & Vernacular Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                      Title of Place / Monument Name <span className="text-primary">*</span>
                    </label>
                    <input
                      id="place-title-input"
                      className="w-full bg-[#fbf9f5] rounded-lg px-3.5 py-2.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-secondary/60"
                      placeholder="e.g. Nahargarh Fort, Jaipur"
                      type="text"
                      value={placeTitle}
                      onChange={(e) => setPlaceTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                      Alternative / Vernacular Names
                    </label>
                    <input
                      id="vernacular-names-input"
                      className="w-full bg-[#fbf9f5] rounded-lg px-3.5 py-2.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-secondary/60"
                      placeholder="e.g. Sudarshangarh, Tiger Fort"
                      type="text"
                      value={vernacularNames}
                      onChange={(e) => setVernacularNames(e.target.value)}
                    />
                  </div>
                </div>

                {/* Badge or Mark Radio Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                      Badge or Mark (Heritage Type) <span className="text-primary">*</span>
                    </label>
                    <span className="text-[0.66rem] text-secondary">
                      Select primary architectural badge
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Fort', icon: 'fort' },
                      { label: 'Temple', icon: 'temple_hindu' },
                      { label: 'Palace', icon: 'castle' },
                      { label: 'Stepwell', icon: 'water' },
                      { label: 'Museum', icon: 'museum' },
                      { label: 'Monument', icon: 'account_balance' },
                      { label: 'Haveli', icon: 'home_work' },
                      { label: 'Other', icon: 'more_horiz' },
                    ].map((badge) => {
                      const isChecked = badgeType === badge.label;
                      return (
                        <label
                          key={badge.label}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'border-primary bg-amber-50'
                              : 'border-outline-variant/60 bg-[#fbf9f5] hover:bg-surface-container'
                          }`}
                        >
                          <input
                            type="radio"
                            name="place_badge"
                            checked={isChecked}
                            onChange={() => setBadgeType(badge.label)}
                            className="text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              isChecked ? 'font-semibold text-amber-900' : 'font-medium text-on-surface'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-sm ${
                                isChecked ? 'text-primary' : 'text-secondary'
                              }`}
                            >
                              {badge.icon}
                            </span>
                            {badge.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Description & Cultural Brief */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                    Place Description &amp; Cultural Brief <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="place-description-input"
                    className="w-full bg-[#fbf9f5] rounded-lg p-3.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-secondary/60 resize-y"
                    placeholder="Detail chronological lineage, founding monarch/guild, century of construction, and conservation mandate..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-[0.66rem] text-secondary">
                    Include architectural style highlights, historical chronology, and key conservation notes.
                  </p>
                </div>
              </div>
            </section>

            {/* Form Section 2: Visiting Hours & Entry Tariff */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                  <div>
                    <h2 className="font-display text-base lg:text-lg font-bold text-on-surface">
                      2. Visiting Hours &amp; Entry Tariff
                    </h2>
                    <p className="text-[0.68rem] text-secondary">
                      Public access schedule, ticket tariff slabs, exemptions, and ticketing protocols.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-bold text-emerald-800 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online E-Ticketing Active
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Visiting Hours Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.7rem] font-bold text-on-surface uppercase tracking-wider block">
                      Schedule &amp; Visiting Hours Grid
                    </span>
                    <span className="text-[0.66rem] text-secondary">
                      Official ASI &amp; State Archaeology Timetable
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[0.68rem] font-semibold text-secondary uppercase">
                        General Opening Time
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-secondary text-sm absolute left-2.5 pointer-events-none">
                          schedule
                        </span>
                        <input
                          type="text"
                          value={openingTime}
                          onChange={(e) => setOpeningTime(e.target.value)}
                          className="w-full bg-[#fbf9f5] rounded-lg pl-8 pr-2.5 py-2 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[0.68rem] font-semibold text-secondary uppercase">
                        General Closing Time
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-secondary text-sm absolute left-2.5 pointer-events-none">
                          alarm_off
                        </span>
                        <input
                          type="text"
                          value={closingTime}
                          onChange={(e) => setClosingTime(e.target.value)}
                          className="w-full bg-[#fbf9f5] rounded-lg pl-8 pr-2.5 py-2 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[0.68rem] font-semibold text-secondary uppercase">
                        Last Entry / Cutoff Time
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-primary text-sm absolute left-2.5 pointer-events-none">
                          timer
                        </span>
                        <input
                          type="text"
                          value={cutoffTime}
                          onChange={(e) => setCutoffTime(e.target.value)}
                          className="w-full bg-[#fbf9f5] rounded-lg pl-8 pr-2.5 py-2 text-xs text-primary font-bold border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Days Open */}
                  <div className="pt-1">
                    <DaySelector
                      selectedDays={selectedDays}
                      onChange={setSelectedDays}
                      label="Days Open & Operating Schedule"
                    />
                  </div>

                  {/* Night Viewing Slot */}
                  <div className="p-3.5 bg-surface-container-low rounded-lg border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-lg">nightlight</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface">
                          Night Viewing Slot (07:00 PM – 10:00 PM)
                        </p>
                        <p className="text-[0.66rem] text-secondary">
                          Enable architectural night illumination &amp; rooftop twilight walk session
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-secondary text-xs absolute left-2 pointer-events-none">
                          schedule
                        </span>
                        <input
                          type="text"
                          value={nightSlotTime}
                          onChange={(e) => setNightSlotTime(e.target.value)}
                          className="bg-[#fbf9f5] rounded-md pl-6 pr-2.5 py-1 text-[0.72rem] text-on-surface border border-outline-variant/60 font-medium w-40"
                        />
                      </div>
                      <span
                        onClick={() => setNightSlotActive(!nightSlotActive)}
                        className={`px-2.5 py-0.5 rounded text-[0.65rem] font-bold cursor-pointer transition-colors border ${
                          nightSlotActive
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : 'bg-stone-200 text-stone-600 border-stone-300'
                        }`}
                      >
                        {nightSlotActive ? 'Active +₹100' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Entry Tariff Slabs */}
                <div className="space-y-3 pt-3 border-t border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.7rem] font-bold text-on-surface uppercase tracking-wider block">
                      Entry Tariff &amp; Fee Slabs (in INR ₹)
                    </span>
                    <span className="text-[0.66rem] text-secondary">
                      Statutory fee structure prescribed under AMASR Act
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <TariffInput
                      label="Domestic Citizens"
                      icon="person"
                      value={domesticFee}
                      onChange={setDomesticFee}
                      subtitle="Valid Govt Photo ID required"
                    />
                    <TariffInput
                      label="SAARC / BIMSTEC"
                      icon="public"
                      value={saarcFee}
                      onChange={setSaarcFee}
                      subtitle="Regional treaty passport holders"
                    />
                    <TariffInput
                      label="Foreign Tourists"
                      icon="flight"
                      value={foreignFee}
                      onChange={setForeignFee}
                      subtitle="International tourist visitors"
                    />
                    <TariffInput
                      label="Student Concession"
                      icon="school"
                      value={studentFee}
                      onChange={setStudentFee}
                      subtitle="Valid Institutional Student ID"
                    />
                  </div>

                  {/* Free Entry Statutory Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg border border-outline-variant/40 bg-surface-container-low flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-800 shrink-0">
                          <span className="material-symbols-outlined text-sm">child_care</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-on-surface">
                            Children Under 15 Years
                          </p>
                          <p className="text-[0.65rem] text-secondary">
                            Free statutory entry under national heritage norms
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[0.66rem] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                        100% Free Entry
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-outline-variant/40 bg-surface-container-low flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-800 shrink-0">
                          <span className="material-symbols-outlined text-sm">accessible</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-on-surface">
                            Divyangjan (Differently Abled)
                          </p>
                          <p className="text-[0.65rem] text-secondary">
                            Free statutory access + 1 verified escort allowed
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[0.66rem] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                        Free + 1 Escort
                      </span>
                    </div>
                  </div>

                  {/* Camera & Video Permits */}
                  <div className="space-y-2 pt-2 border-t border-surface-container">
                    <span className="text-[0.68rem] font-semibold text-secondary uppercase block">
                      Photography &amp; Commercial Permits
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TariffInput
                        label="Still Camera Permit"
                        icon="photo_camera"
                        value={stillCameraFee}
                        onChange={setStillCameraFee}
                        subtitle="DSLR / Mirrorless Non-commercial photography"
                        layout="horizontal"
                      />
                      <TariffInput
                        label="Video / Drone Permit"
                        icon="videocam"
                        value={videoFee}
                        onChange={setVideoFee}
                        subtitle="Video recording & clearance permit"
                        layout="horizontal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Form Section 3: Physical & Architectural Overview */}
            <section className={`bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-6 shadow-sm space-y-5 transition-all ${
              !locationCoordinatesEnabled ? 'opacity-75' : ''
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-xl">my_location</span>
                  <div>
                    <h2 className="font-display text-base lg:text-lg font-bold text-on-surface">
                      3. Location Coordinates &amp; Direction Link
                    </h2>
                    <p className="text-[0.68rem] text-secondary">
                      Geographical positioning for automated spatial mapping and visitor routing.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={locationCoordinatesEnabled}
                    onChange={setLocationCoordinatesEnabled}
                    statusLabels={{ active: 'Enabled', inactive: 'Disabled' }}
                    color="amber"
                    size="sm"
                  />
                  <span className="text-[0.66rem] font-semibold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Verified Survey Marker
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                      Latitude (GPS Coordinate) <span className="text-primary">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectDeviceLocation}
                      className="text-[0.65rem] text-primary hover:underline flex items-center gap-0.5 font-semibold"
                      title="Use device GPS location"
                    >
                      <span className="material-symbols-outlined text-[13px]">my_location</span>
                      <span>Use GPS</span>
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined text-secondary text-sm absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      explore
                    </span>
                    <input
                      className="w-full bg-[#fbf9f5] rounded-lg pl-8 pr-3 py-2.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-secondary/60 font-mono font-medium"
                      placeholder="26.9374"
                      type="text"
                      value={latitude}
                      onChange={(e) => handleLatitudeChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                      Longitude (GPS Coordinate) <span className="text-primary">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined text-secondary text-sm absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      explore
                    </span>
                    <input
                      className="w-full bg-[#fbf9f5] rounded-lg pl-8 pr-3 py-2.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-secondary/60 font-mono font-medium"
                      placeholder="75.8155"
                      type="text"
                      value={longitude}
                      onChange={(e) => handleLongitudeChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
                    Google Maps / Navigation URL
                  </label>
                  <div className="relative flex items-center">
                    <input
                      className="w-full bg-[#fbf9f5] rounded-lg pl-3 pr-20 py-2.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder:text-secondary/60 truncate"
                      placeholder="https://maps.google.com/?q=..."
                      type="url"
                      value={mapsUrl}
                      onChange={(e) => setMapsUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => window.open(mapsUrl, '_blank')}
                      className="absolute right-1.5 px-2.5 py-1 text-[0.68rem] font-bold bg-primary text-white rounded hover:bg-primary-container transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">map</span>
                      <span>Locate</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-primary text-base">pin_drop</span>
                    <span>
                      Jurisdiction:{' '}
                      <strong className="text-on-surface">
                        {selectedDistrict} Circle, {selectedState}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[0.68rem] text-secondary font-mono">Grid #ASI-RJ-048</span>
                </div>

                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-secondary text-base">near_me</span>
                    <span className="truncate">
                      Closest Transit:{' '}
                      <strong className="text-on-surface">Chandpole Metro (6.2 km) / NH-52</strong>
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-xs">
                    arrow_outward
                  </span>
                </div>
              </div>
            </section>

            {/* Bottom Controls - Step 1 */}
            <footer className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                id="cancel-step-1-btn"
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              >
                Cancel Entry
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/40 transition-colors shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base text-secondary">
                    bookmark_border
                  </span>
                  <span>Save Draft</span>
                </button>
                <button
                  id="next-to-step-2-btn"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <span>Next: Visuals</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </footer>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: VISUALS & MEDIA                                                  */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-6 shadow-sm space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">play_circle</span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-on-surface">
                      YouTube Videos &amp; Streams
                    </h3>
                    <p className="text-[0.68rem] text-secondary">
                      Add and manage monument walkthroughs, drone footage, and documentary links.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.68rem] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {videos.length} Videos Configured
                  </span>
                </div>
              </div>

              {/* Add Video Form Row */}
              <form
                onSubmit={handleAddVideoSubmit}
                className="bg-surface-container-low/60 rounded-xl p-4 border border-outline-variant/40 space-y-3"
              >
                <div className="text-[0.7rem] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">add_link</span>
                  Add New Video Entry
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[0.65rem] font-semibold text-secondary uppercase tracking-wider">
                      Title of Video <span className="text-primary">*</span>
                    </label>
                    <input
                      id="new-video-title-input"
                      type="text"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      placeholder="e.g. Nahargarh Fort 4K Drone Tour"
                      className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-secondary/50 font-medium transition-all"
                    />
                  </div>
                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[0.65rem] font-semibold text-secondary uppercase tracking-wider">
                      Link of YouTube Video <span className="text-primary">*</span>
                    </label>
                    <input
                      id="new-video-url-input"
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-secondary/50 font-mono tracking-tight transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      id="add-video-btn"
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg shadow-sm transition-all h-[34px]"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Add Video</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Feed of Added Videos in a Clean Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-on-surface text-[0.72rem] uppercase tracking-wider">
                    Configured YouTube Records
                  </span>
                  <span className="text-[0.68rem] text-secondary">
                    Order dictates display sequence on the citizen portal
                  </span>
                </div>
                <div className="border border-outline-variant/60 rounded-xl overflow-hidden bg-surface-container-lowest">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-container text-secondary text-[0.65rem] uppercase tracking-wider border-b border-outline-variant/40">
                          <th className="py-2.5 px-3.5 font-bold w-24">Video</th>
                          <th className="py-2.5 px-3 font-bold">Video Title</th>
                          <th className="py-2.5 px-3 font-bold">YouTube URL</th>
                          <th className="py-2.5 px-3 font-bold">Duration / Quality</th>
                          <th className="py-2.5 px-3 font-bold">Status</th>
                          <th className="py-2.5 px-3.5 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                        {videos.map((vid) => (
                          <tr
                            key={vid.id}
                            className="hover:bg-surface-container-low/50 transition-colors group"
                          >
                            <td className="py-2.5 px-3.5">
                              <div
                                onClick={() => onPreviewVideo(vid)}
                                className="w-20 h-11 rounded-md overflow-hidden relative border border-outline-variant/40 bg-black/10 shrink-0 cursor-pointer group-hover:ring-1 group-hover:ring-primary"
                              >
                                <img
                                  src={vid.thumbnail}
                                  alt={vid.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-white text-sm drop-shadow">
                                    play_circle
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div
                                onClick={() => onPreviewVideo(vid)}
                                className="font-semibold text-on-surface text-[0.75rem] hover:text-primary cursor-pointer"
                              >
                                {vid.title}
                              </div>
                              <div className="text-[0.65rem] text-secondary">{vid.subtitle}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[0.68rem] text-primary truncate max-w-[180px]">
                              <a
                                href={vid.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline flex items-center gap-1"
                              >
                                <span className="truncate">{vid.url}</span>
                                <span className="material-symbols-outlined text-xs shrink-0">
                                  open_in_new
                                </span>
                              </a>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-[0.65rem] font-mono font-medium text-secondary">
                                  {vid.duration}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[0.6rem] font-bold border ${
                                    vid.quality === '4K UHD'
                                      ? 'bg-amber-500/10 text-amber-800 border-amber-500/30'
                                      : 'bg-surface-container text-secondary border-outline-variant/50'
                                  }`}
                                >
                                  {vid.quality}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.62rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {vid.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onPreviewVideo(vid)}
                                  className="p-1 text-secondary hover:text-primary hover:bg-surface-container rounded transition-colors"
                                  title="Preview Video"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    visibility
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteVideo(vid.id)}
                                  className="p-1 text-secondary hover:text-red-600 hover:bg-red-600/10 rounded transition-colors"
                                  title="Remove Video"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Controls - Step 2 */}
            <footer className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>← Previous: Basic Info</span>
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/40 transition-colors shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base text-secondary">
                    bookmark_border
                  </span>
                  <span>Save Draft</span>
                </button>
                <button
                  id="proceed-to-step-3-btn"
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <span>Proceed to Step 3: Book &amp; Documentation →</span>
                </button>
              </div>
            </footer>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: BOOK & DOCUMENTATION                                             */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
              {/* Section Header */}
              <div className="p-5 sm:p-6 border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-bright/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-primary shadow-xs shrink-0">
                    <span className="material-symbols-outlined text-2xl">menu_book</span>
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
                      PDF Books &amp; Archival Documentation
                    </h2>
                    <p className="text-xs text-secondary mt-0.5">
                      Add and manage official heritage monographs, research PDFs, guidebooks, and
                      gazetteer documents.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {pdfDocuments.length} Documents Configured
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* Add New PDF Document Input Form */}
                <form
                  onSubmit={handleAddPdfSubmit}
                  className="bg-surface-container-low rounded-lg border border-outline-variant/50 p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[0.68rem] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">
                        add_circle
                      </span>
                      ADD NEW PDF DOCUMENT
                    </span>
                    <span className="text-[0.68rem] text-secondary">
                      Direct PDF download / HTTPS storage URL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                    <div className="lg:col-span-5 space-y-1">
                      <label className="block text-[0.68rem] font-semibold text-on-surface uppercase tracking-wider">
                        PDF NAME *
                      </label>
                      <input
                        id="new-pdf-name-input"
                        type="text"
                        value={newPdfName}
                        onChange={(e) => setNewPdfName(e.target.value)}
                        placeholder="e.g. Nahargarh Fort - Historical Survey & Monograph (ASI 1982)"
                        className="w-full bg-surface-container-lowest text-xs rounded-lg border border-outline-variant/60 px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="lg:col-span-5 space-y-1">
                      <label className="block text-[0.68rem] font-semibold text-on-surface uppercase tracking-wider">
                        SUBMIT LINK / PDF URL *
                      </label>
                      <input
                        id="new-pdf-url-input"
                        type="url"
                        value={newPdfUrl}
                        onChange={(e) => setNewPdfUrl(e.target.value)}
                        placeholder="https://archival-library.gov.in/docs/nahargarh-monograph-vol1.pdf"
                        className="w-full bg-surface-container-lowest text-xs rounded-lg border border-outline-variant/60 px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors font-mono text-[0.7rem]"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <button
                        id="submit-pdf-btn"
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg shadow-sm transition-all h-[34px]"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        <span>Submit Document</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Configured PDF Documents Table */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                    <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        folder_special
                      </span>
                      CONFIGURED PDF DOCUMENTS
                    </h3>
                    <span className="text-[0.68rem] text-secondary">
                      Order dictates display sequence on citizen portal
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-outline-variant/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-container text-on-surface-variant text-[0.68rem] uppercase tracking-wider font-semibold border-b border-outline-variant/40">
                        <tr>
                          <th className="py-2.5 px-3.5 w-12 text-center">DOC</th>
                          <th className="py-2.5 px-3.5">PDF NAME</th>
                          <th className="py-2.5 px-3.5">DOCUMENT LINK / URL</th>
                          <th className="py-2.5 px-3.5">FILE SIZE / PAGES</th>
                          <th className="py-2.5 px-3.5 text-center">STATUS</th>
                          <th className="py-2.5 px-3.5 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30 bg-surface-container-lowest">
                        {pdfDocuments.map((doc) => (
                          <tr
                            key={doc.id}
                            className="hover:bg-surface-bright/80 transition-colors group"
                          >
                            <td className="py-3 px-3.5 text-center">
                              <div
                                onClick={() => onPreviewPdf(doc)}
                                className="w-8 h-8 rounded bg-red-50 text-tertiary border border-red-200/80 flex items-center justify-center mx-auto shadow-2xs cursor-pointer group-hover:scale-105 transition-transform"
                              >
                                <span className="material-symbols-outlined text-base">
                                  picture_as_pdf
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3.5">
                              <div
                                onClick={() => onPreviewPdf(doc)}
                                className="font-semibold text-on-surface hover:text-primary cursor-pointer"
                              >
                                {doc.title}
                              </div>
                              <div className="text-[0.68rem] text-secondary mt-0.5">
                                {doc.subtitle}
                              </div>
                            </td>
                            <td className="py-3 px-3.5">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[0.7rem] text-primary hover:underline"
                              >
                                <span className="truncate max-w-xs">{doc.url}</span>
                                <span className="material-symbols-outlined text-[13px]">
                                  open_in_new
                                </span>
                              </a>
                            </td>
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-on-surface">{doc.fileSize}</span>
                                <span className="text-[0.62rem] bg-surface-container text-secondary px-1.5 py-0.5 rounded font-medium">
                                  {doc.pages}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {doc.status}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() => onPreviewPdf(doc)}
                                  className="p-1.5 text-secondary hover:text-primary rounded hover:bg-surface-container transition-colors"
                                  title="Preview Document"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    visibility
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeletePdf(doc.id)}
                                  className="p-1.5 text-secondary hover:text-error rounded hover:bg-red-50 transition-colors"
                                  title="Delete Document"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Controls - Step 3 */}
            <footer className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-secondary hover:text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Previous: Visuals &amp; Media</span>
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/40 transition-colors shadow-2xs"
                >
                  <span className="material-symbols-outlined text-base text-secondary">
                    bookmark_border
                  </span>
                  <span>Save as Draft</span>
                </button>
                <button
                  id="final-publish-btn"
                  type="button"
                  onClick={handleFinalPublish}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Submit &amp; Publish to National Registry</span>
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
