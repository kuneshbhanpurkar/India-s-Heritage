import React, { useEffect, useState } from 'react';
import { HeritagePlace, MediaItemData, DocumentItemData, SourceItemData } from '../types';
import { ToggleSwitch, DynamicCategoryFields } from '../components/common';
import { CATEGORY_DEFINITIONS, VALID_CATEGORY_SLUGS, resolveCategorySlug } from '../config/categoryDefinitions';
import { MapPin, Info, Image, BookOpen, Link, ArrowLeft, CheckCircle } from 'lucide-react';

export interface AddRecordPageProps {
  onCancel: () => void;
  onPublish: (newPlace: Partial<HeritagePlace>, existingId?: string) => void;
  editingPlace?: HeritagePlace | null;
  selectedState: string;
  selectedDistrict: string;
  selectedDistrictId?: string;
  selectedCategory?: string;
  onPreviewImage: (url: string, title: string) => void;
}

export const AddRecordPage: React.FC<AddRecordPageProps> = ({
  onCancel,
  onPublish,
  editingPlace,
  selectedState,
  selectedDistrict,
  selectedCategory = 'heritage-places',
  onPreviewImage,
}) => {
  const isEditing = Boolean(editingPlace && (editingPlace.id || editingPlace._id));

  // Determine initial category
  const initialCategory = isEditing
    ? resolveCategorySlug(editingPlace?.section) || 'heritage-places'
    : resolveCategorySlug(selectedCategory) || 'heritage-places';

  const [categorySlug, setCategorySlug] = useState<string>(initialCategory);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Module toggles
  const [visualsMediaEnabled, setVisualsMediaEnabled] = useState<boolean>(
    editingPlace?.visualsMediaEnabled !== false
  );
  const [bookEnabled, setBookEnabled] = useState<boolean>(
    editingPlace?.bookEnabled !== false
  );

  // Common fields
  const [title, setTitle] = useState<string>(editingPlace?.name || editingPlace?.title || '');
  const [subtitle, setSubtitle] = useState<string>(editingPlace?.subTitle || '');
  const [shortDescription, setShortDescription] = useState<string>(
    editingPlace?.shortDescription || editingPlace?.description || ''
  );
  const [fullDescription, setFullDescription] = useState<string>(
    editingPlace?.fullDescription || editingPlace?.description || ''
  );
  const [status, setStatus] = useState<string>(editingPlace?.status || 'Draft (In Curation)');
  const [coverImageUrl, setCoverImageUrl] = useState<string>(editingPlace?.imageUrl || '');

  // Category-specific dynamic fields
  const [categoryFields, setCategoryFields] = useState<Record<string, any>>(
    editingPlace?.fields || {}
  );

  // Coordinates & Location
  const [latitude, setLatitude] = useState<string>(
    editingPlace?.latitude !== undefined && editingPlace?.latitude !== null ? String(editingPlace.latitude) : ''
  );
  const [longitude, setLongitude] = useState<string>(
    editingPlace?.longitude !== undefined && editingPlace?.longitude !== null ? String(editingPlace.longitude) : ''
  );

  // Media items
  const [mediaList, setMediaList] = useState<MediaItemData[]>(editingPlace?.media || []);
  const [newMediaUrl, setNewMediaUrl] = useState<string>('');
  const [newMediaTitle, setNewMediaTitle] = useState<string>('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');

  // Documents / Book items
  const [documentList, setDocumentList] = useState<DocumentItemData[]>(editingPlace?.documents || []);
  const [newDocTitle, setNewDocTitle] = useState<string>('');
  const [newDocUrl, setNewDocUrl] = useState<string>('');
  const [newDocPublisher, setNewDocPublisher] = useState<string>('');

  // Sources
  const [sourceList, setSourceList] = useState<SourceItemData[]>(editingPlace?.sources || []);
  const [newSourceTitle, setNewSourceTitle] = useState<string>('');
  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newSourcePublisher, setNewSourcePublisher] = useState<string>('');

  // Form Validation & Feedback
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize or update fields when editingPlace changes
  useEffect(() => {
    if (editingPlace) {
      const resolvedCat = resolveCategorySlug(editingPlace.section) || 'heritage-places';
      setCategorySlug(resolvedCat);
      setTitle(editingPlace.name || editingPlace.title || '');
      setSubtitle(editingPlace.subTitle || '');
      setShortDescription(editingPlace.shortDescription || editingPlace.description || '');
      setFullDescription(editingPlace.fullDescription || editingPlace.description || '');
      setStatus(editingPlace.status || 'Draft (In Curation)');
      setCoverImageUrl(editingPlace.imageUrl || '');
      setCategoryFields(editingPlace.fields || {});
      setLatitude(editingPlace.latitude !== undefined && editingPlace.latitude !== null ? String(editingPlace.latitude) : '');
      setLongitude(editingPlace.longitude !== undefined && editingPlace.longitude !== null ? String(editingPlace.longitude) : '');
      setMediaList(editingPlace.media || []);
      setDocumentList(editingPlace.documents || []);
      setSourceList(editingPlace.sources || []);
      setVisualsMediaEnabled(editingPlace.visualsMediaEnabled !== false);
      setBookEnabled(editingPlace.bookEnabled !== false);
    }
  }, [editingPlace]);

  // Handle dynamic field modification
  const handleCategoryFieldChange = (fieldName: string, value: any) => {
    setCategoryFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Detect GPS location from device
  const handleDetectDeviceLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          setValidationError(null);
        },
        (err) => {
          setValidationError(`Location detection failed: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setValidationError('Geolocation is not supported by your browser.');
    }
  };

  // Helper to extract YouTube video ID and thumbnail
  const getYouTubeInfo = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (match && match[1]) {
      return {
        videoId: match[1],
        thumbnailUrl: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`,
      };
    }
    return null;
  };

  // Add media item
  const handleAddMedia = () => {
    if (!newMediaUrl.trim()) return;

    let mediaUrl = newMediaUrl.trim();
    let alt = newMediaTitle.trim() || 'Media Item';

    if (newMediaType === 'video') {
      const yt = getYouTubeInfo(mediaUrl);
      if (yt) {
        alt = `YouTube: ${yt.videoId}`;
      }
    }

    const newItem: MediaItemData = {
      type: newMediaType,
      url: mediaUrl,
      title: newMediaTitle.trim() || undefined,
      alt,
      active: true,
      displayOrder: mediaList.length + 1,
    };

    setMediaList((prev) => [...prev, newItem]);
    setNewMediaUrl('');
    setNewMediaTitle('');
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add document item
  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;

    const newDoc: DocumentItemData = {
      title: newDocTitle.trim(),
      url: newDocUrl.trim(),
      publisher: newDocPublisher.trim() || undefined,
      type: 'pdf',
      active: true,
      displayOrder: documentList.length + 1,
    };

    setDocumentList((prev) => [...prev, newDoc]);
    setNewDocTitle('');
    setNewDocUrl('');
    setNewDocPublisher('');
  };

  const handleRemoveDocument = (index: number) => {
    setDocumentList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add source item
  const handleAddSource = () => {
    if (!newSourceTitle.trim()) return;

    const newSource: SourceItemData = {
      sourceTitle: newSourceTitle.trim(),
      sourceUrl: newSourceUrl.trim() || undefined,
      publisher: newSourcePublisher.trim() || undefined,
    };

    setSourceList((prev) => [...prev, newSource]);
    setNewSourceTitle('');
    setNewSourceUrl('');
    setNewSourcePublisher('');
  };

  const handleRemoveSource = (index: number) => {
    setSourceList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit and validate form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Common required validation
    if (!title.trim() || title.trim().length < 2) {
      setValidationError('Record title is required (minimum 2 characters).');
      setCurrentStep(1);
      return;
    }

    // 2. Coordinate validation (if provided)
    let latNum: number | undefined = undefined;
    let lngNum: number | undefined = undefined;

    if (latitude.trim() || longitude.trim()) {
      const parsedLat = Number(latitude);
      const parsedLng = Number(longitude);

      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        setValidationError('Invalid Latitude: must be a number between -90 and 90.');
        setCurrentStep(1);
        return;
      }

      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        setValidationError('Invalid Longitude: must be a number between -180 and 180.');
        setCurrentStep(1);
        return;
      }

      latNum = parsedLat;
      lngNum = parsedLng;
    }

    // 3. Assemble media array (include cover image if set)
    const finalMedia: MediaItemData[] = [...mediaList];
    if (coverImageUrl.trim() && !finalMedia.some((m) => m.url === coverImageUrl.trim())) {
      finalMedia.unshift({
        type: 'image',
        url: coverImageUrl.trim(),
        title: title.trim(),
        alt: title.trim(),
        displayOrder: 0,
        active: true,
      });
    }

    const payload: Partial<HeritagePlace> = {
      name: title.trim(),
      title: title.trim(),
      subTitle: subtitle.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      description: shortDescription.trim() || fullDescription.trim(),
      section: categorySlug,
      category: CATEGORY_DEFINITIONS[categorySlug]?.title || 'Heritage & Places',
      imageUrl: coverImageUrl.trim() || (finalMedia.find((m) => m.type === 'image')?.url || ''),
      status,
      fields: {
        ...categoryFields,
        imageUrl: coverImageUrl.trim(),
        visualsMediaEnabled,
        bookEnabled,
      },
      media: finalMedia,
      documents: documentList,
      sources: sourceList,
      latitude: latNum,
      longitude: lngNum,
      visualsMediaEnabled,
      bookEnabled,
    };

    const targetExistingId = editingPlace?._id || editingPlace?.id;
    onPublish(payload, targetExistingId);
  };

  const activeCategoryDef = CATEGORY_DEFINITIONS[categorySlug] || CATEGORY_DEFINITIONS['heritage-places'];

  return (
    <div className="w-full flex-1 px-4 md:px-8 py-6 max-w-[1440px] mx-auto select-text animate-fade-in space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-secondary flex-wrap">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{selectedState}</span>
            </span>
            <span className="text-secondary font-bold">→</span>
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {selectedDistrict}
            </span>
            <span className="text-secondary font-bold">→</span>
            <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">{activeCategoryDef.icon}</span>
              <span>{activeCategoryDef.title}</span>
            </span>
          </div>

          <h1 className="font-display text-xl md:text-2xl font-bold text-on-surface">
            {isEditing ? `Edit Record: ${editingPlace?.name || title}` : `Create New ${activeCategoryDef.title} Record`}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-lg border border-surface-container hover:bg-surface-container text-xs font-semibold text-secondary flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Update Document' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-red-600 text-base shrink-0">error</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Form Steps Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-container pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            currentStep === 1
              ? 'bg-primary text-white shadow-sm'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>1. Core Details &amp; Category</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            currentStep === 2
              ? 'bg-primary text-white shadow-sm'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>2. Visuals &amp; Media ({mediaList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            currentStep === 3
              ? 'bg-primary text-white shadow-sm'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>3. Books &amp; Documents ({documentList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(4)}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            currentStep === 4
              ? 'bg-primary text-white shadow-sm'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          <span>4. Sources &amp; Citations ({sourceList.length})</span>
        </button>
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Core Details, Dynamic Fields, Location */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Category Selector Card */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Category Selection (Fixed Phase-1 Categories)
                  </h2>
                  <p className="text-[0.68rem] text-secondary">
                    {isEditing
                      ? 'Category is permanently bound to this record and cannot be changed during edit.'
                      : 'Select the canonical category that defines this record’s form structure.'}
                  </p>
                </div>
                {isEditing && (
                  <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Category Locked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
                {VALID_CATEGORY_SLUGS.map((slug) => {
                  const def = CATEGORY_DEFINITIONS[slug];
                  const isSelected = categorySlug === slug;

                  return (
                    <button
                      key={slug}
                      type="button"
                      disabled={isEditing}
                      onClick={() => setCategorySlug(slug)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-surface-container bg-surface-container-lowest hover:bg-surface-container-low/50 opacity-80 hover:opacity-100'
                      } ${isEditing && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`material-symbols-outlined text-lg ${
                            isSelected ? 'text-primary' : 'text-secondary'
                          }`}
                        >
                          {def.icon}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-xs font-bold text-on-surface leading-tight truncate">
                        {def.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Information */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-surface-container pb-2">
                Common Record Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="record-title" className="block text-xs font-semibold text-on-surface">
                    Record Title / Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="record-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Rajwada Palace / Chanderi Silk Weaving"
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="record-subtitle" className="block text-xs font-semibold text-on-surface">
                    Subtitle / Vernacular Name
                  </label>
                  <input
                    id="record-subtitle"
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g., राजवाड़ा महल"
                    className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="record-status" className="block text-xs font-semibold text-on-surface">
                    Curation Status
                  </label>
                  <select
                    id="record-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Draft (In Curation)">Draft (In Curation)</option>
                    <option value="Verification Pending">Verification Pending (Review)</option>
                    <option value="Published">Published &amp; Live</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="record-cover-image" className="block text-xs font-semibold text-on-surface">
                    Primary Cover Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="record-cover-image"
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {coverImageUrl && (
                      <button
                        type="button"
                        onClick={() => onPreviewImage(coverImageUrl, title || 'Cover Image')}
                        className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="record-short-desc" className="block text-xs font-semibold text-on-surface">
                    Short Summary (Displays in search &amp; cards)
                  </label>
                  <textarea
                    id="record-short-desc"
                    rows={2}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence overview..."
                    className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="record-full-desc" className="block text-xs font-semibold text-on-surface">
                    Full Description &amp; Historical Context
                  </label>
                  <textarea
                    id="record-full-desc"
                    rows={4}
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    placeholder="Detailed history, architecture, cultural significance..."
                    className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC CATEGORY FIELDS COMPONENT */}
            <DynamicCategoryFields
              categorySlug={categorySlug}
              values={categoryFields}
              onChange={handleCategoryFieldChange}
            />

            {/* Geographic Coordinates & Location */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-surface-container pb-2">
                <div>
                  <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Geographic Coordinates (Around Me Integration)
                  </h2>
                  <p className="text-[0.68rem] text-secondary">
                    Provide real coordinates for map plotting and location radius features.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDetectDeviceLocation}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">my_location</span>
                  <span>Detect Location</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="record-latitude" className="block text-xs font-semibold text-on-surface">
                    Latitude (-90 to 90)
                  </label>
                  <input
                    id="record-latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 22.7196"
                    className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="record-longitude" className="block text-xs font-semibold text-on-surface">
                    Longitude (-180 to 180)
                  </label>
                  <input
                    id="record-longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., 75.8577"
                    className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Visuals & Media */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div>
                  <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Visuals &amp; Media Module Toggle
                  </h2>
                  <p className="text-[0.68rem] text-secondary">
                    Control public visibility of gallery and videos for this record.
                  </p>
                </div>
                <ToggleSwitch
                  enabled={visualsMediaEnabled}
                  onChange={setVisualsMediaEnabled}
                  label={visualsMediaEnabled ? 'Enabled' : 'Disabled'}
                />
              </div>

              {/* Add New Media Form */}
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-surface-container space-y-3">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Add Photo or Video
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">Type</label>
                    <select
                      value={newMediaType}
                      onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                    >
                      <option value="image">Image / Photo</option>
                      <option value="video">Video (YouTube URL)</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[0.7rem] font-medium text-secondary">URL</label>
                    <input
                      type="url"
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMedia();
                        }
                      }}
                      placeholder={newMediaType === 'image' ? 'https://images.unsplash...' : 'https://www.youtube.com/watch?v=...'}
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">Title / Caption</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newMediaTitle}
                        onChange={(e) => setNewMediaTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMedia();
                          }
                        }}
                        placeholder="Front Facade..."
                        className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={handleAddMedia}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-secondary">
                  Uploaded Media Items ({mediaList.length})
                </span>

                {mediaList.length === 0 ? (
                  <p className="text-xs text-outline py-4 text-center">No media attached to this record yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mediaList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-primary text-base">
                            {item.type === 'video' ? 'videocam' : 'image'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-on-surface truncate">{item.title || item.alt || 'Media'}</p>
                            <p className="text-[0.65rem] text-secondary truncate">{item.url}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.type === 'image' && (
                            <button
                              type="button"
                              onClick={() => onPreviewImage(item.url, item.title || 'Preview')}
                              className="p-1 rounded text-secondary hover:text-on-surface"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(idx)}
                            className="p-1 rounded text-red-500 hover:text-red-700"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Books & Documents */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div>
                  <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Book &amp; Detailed Resource Module Toggle
                  </h2>
                  <p className="text-[0.68rem] text-secondary">
                    Control public display of archival monographs and research PDFs.
                  </p>
                </div>
                <ToggleSwitch
                  enabled={bookEnabled}
                  onChange={setBookEnabled}
                  label={bookEnabled ? 'Enabled' : 'Disabled'}
                />
              </div>

              {/* Add New Document Form */}
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-surface-container space-y-3">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Add Monograph / PDF Resource
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">Document Title</label>
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDocument();
                        }
                      }}
                      placeholder="Archaeological Monograph Vol. 1"
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">PDF File URL</label>
                    <input
                      type="url"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDocument();
                        }
                      }}
                      placeholder="https://.../monograph.pdf"
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">Publisher / Author</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newDocPublisher}
                        onChange={(e) => setNewDocPublisher(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDocument();
                          }
                        }}
                        placeholder="State Archives..."
                        className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-secondary">
                  Attached Documents ({documentList.length})
                </span>

                {documentList.length === 0 ? (
                  <p className="text-xs text-outline py-4 text-center">No documents attached.</p>
                ) : (
                  <div className="space-y-2">
                    {documentList.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-primary text-base">picture_as_pdf</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-on-surface truncate">{doc.title}</p>
                            <p className="text-[0.65rem] text-secondary truncate">
                              {doc.publisher ? `${doc.publisher} • ` : ''}
                              {doc.url}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(idx)}
                          className="p-1 rounded text-red-500 hover:text-red-700"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Sources & Citations */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
              <div className="border-b border-surface-container pb-2">
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Archival Sources &amp; Scholarly References
                </h2>
                <p className="text-[0.68rem] text-secondary">
                  Add verified sources, publications, gazetteers, and academic attribution.
                </p>
              </div>

              {/* Add Source Form */}
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-surface-container space-y-3">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Add Source
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">Source Title</label>
                    <input
                      type="text"
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSource();
                        }
                      }}
                      placeholder="Malwa Gazetteer 1908"
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">Reference URL</label>
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSource();
                        }
                      }}
                      placeholder="https://archives..."
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[0.7rem] font-medium text-secondary">Publisher / Organization</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newSourcePublisher}
                        onChange={(e) => setNewSourcePublisher(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSource();
                          }
                        }}
                        placeholder="State Archaeology Dept."
                        className="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-surface-container rounded-lg text-xs text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={handleAddSource}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sources List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-secondary">
                  Attributed Sources ({sourceList.length})
                </span>

                {sourceList.length === 0 ? (
                  <p className="text-xs text-outline py-4 text-center">No references added.</p>
                ) : (
                  <div className="space-y-2">
                    {sourceList.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">{src.sourceTitle}</p>
                          <p className="text-[0.65rem] text-secondary truncate">
                            {src.publisher ? `${src.publisher} • ` : ''}
                            {src.sourceUrl}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSource(idx)}
                          className="p-1 rounded text-red-500 hover:text-red-700"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-container">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-surface-container hover:bg-surface-container text-xs font-semibold text-secondary transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
              >
                Previous Step
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-sm transition-all"
              >
                {isEditing ? 'Update Record' : 'Save & Publish'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
