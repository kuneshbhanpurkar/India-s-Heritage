import React, { useState } from 'react';
import { VideoRecord, PdfDocument, HeritagePlace } from '../types';
import { CATEGORY_DEFINITIONS } from '../config/categoryDefinitions';

// ==========================================
// 1. IMAGE PREVIEW MODAL
// ==========================================
interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-surface-container flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-on-surface truncate">
            {title || 'Cover Image Preview'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="p-4 bg-stone-900 flex items-center justify-center max-h-[70vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[60vh] max-w-full object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </div>
        <div className="p-3 bg-surface-container flex items-center justify-between text-xs text-secondary">
          <span className="truncate max-w-sm font-mono text-[0.7rem]">{imageUrl}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-primary text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. VIDEO PREVIEW MODAL
// ==========================================
interface VideoPreviewModalProps {
  video: VideoRecord | null;
  onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ video, onClose }) => {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-xl max-w-3xl w-full overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-lg">play_circle</span>
            <div>
              <h3 className="font-display font-bold text-sm text-on-surface">{video.title}</h3>
              {video.subtitle && <span className="text-[0.68rem] text-secondary">{video.subtitle}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Video Canvas */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
          <img
            src={video.thumbnail || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80'}
            alt={video.title}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-6">
            <div className="flex justify-between items-center text-xs text-white">
              <span className="px-2 py-0.5 rounded bg-red-600 font-bold uppercase tracking-wider text-[0.65rem]">
                Video Stream
              </span>
            </div>
            <div className="flex items-center justify-center">
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 hover:bg-red-600 transition-all cursor-pointer ring-4 ring-white/30"
              >
                <span className="material-symbols-outlined text-3xl">play_arrow</span>
              </a>
            </div>
            <div className="text-white text-xs space-y-1">
              <p className="font-bold text-sm drop-shadow">{video.title}</p>
              <p className="text-stone-300 text-[0.72rem] drop-shadow">
                Our_Dharohar Heritage Audio-Visual Resource
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-surface-container flex items-center justify-between text-xs">
          <a
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-mono text-xs flex items-center gap-1"
          >
            <span>Open Stream URL</span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. PDF PREVIEW MODAL
// ==========================================
interface PdfPreviewModalProps {
  pdf: PdfDocument | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ pdf, onClose }) => {
  if (!pdf) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-tertiary flex items-center justify-center border border-red-200">
              <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-on-surface">{pdf.title}</h3>
              {pdf.subtitle && <span className="text-[0.68rem] text-secondary">{pdf.subtitle}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-surface-container-low rounded-xl border border-surface-container space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {pdf.fileSize && (
                <div>
                  <span className="text-secondary block text-[0.68rem] uppercase font-bold">
                    File Size
                  </span>
                  <span className="font-semibold text-on-surface text-sm">{pdf.fileSize}</span>
                </div>
              )}
              {pdf.publisher && (
                <div>
                  <span className="text-secondary block text-[0.68rem] uppercase font-bold">
                    Publisher / Source
                  </span>
                  <span className="font-semibold text-on-surface text-sm">{pdf.publisher}</span>
                </div>
              )}
              <div>
                <span className="text-secondary block text-[0.68rem] uppercase font-bold">
                  Document Type
                </span>
                <span className="font-semibold text-on-surface text-xs">PDF Document</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-secondary space-y-1">
            <span className="font-bold text-[0.7rem] uppercase text-on-surface block">
              Official Document URL
            </span>
            <div className="p-2.5 bg-surface-container rounded-lg font-mono text-[0.7rem] text-primary truncate">
              {pdf.url}
            </div>
          </div>
        </div>

        <div className="p-3 bg-surface-container flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              if (pdf.url) {
                window.open(pdf.url, '_blank', 'noopener,noreferrer');
              } else {
                alert(`No valid URL found for ${pdf.title}`);
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Open Document</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. PLACE DETAILS VIEW MODAL
// ==========================================
interface PlaceDetailsModalProps {
  place: HeritagePlace | null;
  onClose: () => void;
  onEdit: (place: HeritagePlace) => void;
}

export const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({
  place,
  onClose,
  onEdit,
}) => {
  if (!place) return null;

  const categoryDef = CATEGORY_DEFINITIONS[place.section] || Object.values(CATEGORY_DEFINITIONS).find(
    (c) => c.title === place.category || c.slug === place.section
  );

  const fields = place.fields || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header with image banner */}
        <div className="relative h-48 sm:h-56 bg-stone-900 shrink-0">
          <img
            src={place.imageUrl || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=1200'}
            alt={place.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-primary text-white">
                {categoryDef?.title || place.category}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                {place.name}
              </h2>
              {place.code && <p className="text-stone-300 font-mono text-xs">{place.code}</p>}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low rounded-lg border border-surface-container">
            <div>
              <span className="text-secondary block text-[0.65rem] uppercase font-bold">
                District / Jurisdiction
              </span>
              <span className="font-semibold text-on-surface text-xs">{place.city || 'National'}</span>
            </div>
            <div>
              <span className="text-secondary block text-[0.65rem] uppercase font-bold">
                Sub-Precinct
              </span>
              <span className="font-semibold text-on-surface text-xs">{place.subLocation || 'N/A'}</span>
            </div>
            <div>
              <span className="text-secondary block text-[0.65rem] uppercase font-bold">
                Status
              </span>
              <span className="font-semibold text-emerald-700 text-xs">{place.status}</span>
            </div>
          </div>

          {place.subTitle && (
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">
                Subtitle / Epithet
              </h4>
              <p className="text-on-surface font-medium italic">{place.subTitle}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">
              Description
            </h4>
            <p className="text-secondary leading-relaxed whitespace-pre-line">
              {place.fullDescription || place.description || 'Cataloged heritage record maintained in Our_Dharohar.'}
            </p>
          </div>

          {/* Dynamic Category Fields */}
          {categoryDef && categoryDef.fields && categoryDef.fields.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">
                {categoryDef.title} Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-surface-container-low rounded-lg border border-surface-container text-[0.72rem]">
                {categoryDef.fields.map((field) => {
                  const val = fields[field.name];
                  if (val === undefined || val === null || val === '') return null;

                  if (field.type === 'group' && typeof val === 'object') {
                    return (
                      <div key={field.name} className="col-span-full space-y-1 pt-1 border-t border-surface-container/60 first:border-0 first:pt-0">
                        <span className="text-secondary block font-bold uppercase text-[0.62rem]">{field.label}</span>
                        <div className="grid grid-cols-3 gap-2">
                          {field.fields?.map((subField) => (
                            <div key={subField.name} className="bg-surface-bright p-1.5 rounded border border-outline-variant/40">
                              <span className="text-[0.6rem] text-secondary uppercase font-semibold block">{subField.label || subField.name}</span>
                              <span className="font-semibold text-on-surface">₹{val[subField.name] ?? '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={field.name}>
                      <span className="text-secondary block font-bold uppercase text-[0.62rem]">{field.label}</span>
                      <span className="font-semibold text-on-surface">{String(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location details */}
          {place.latitude !== undefined && place.longitude !== undefined && (
            <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container flex items-center justify-between text-[0.72rem]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                <div>
                  <span className="text-secondary block font-bold uppercase text-[0.62rem]">Coordinates</span>
                  <span className="font-mono text-on-surface">{place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-surface-container border-t border-surface-container flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(place);
            }}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>Edit Heritage Record</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. INVITE / REGISTER ADMIN MODAL
// ==========================================
interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOfficer: (officer: {
    name: string;
    email: string;
    role: 'super_admin' | 'state_admin' | 'district_admin' | 'editor' | 'reviewer';
    password: string;
    stateId?: string;
    cityId?: string;
  }) => void;
  selectedState: string;
  selectedDistrict?: string;
  selectedStateId?: string;
  selectedDistrictId?: string;
}

export const InviteAdminModal: React.FC<InviteAdminModalProps> = ({
  isOpen,
  onClose,
  onAddOfficer,
  selectedState,
  selectedDistrict,
  selectedStateId,
  selectedDistrictId,
}) => {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Heritage Administrative Officer');
  const [role, setRole] = useState<'super_admin' | 'state_admin' | 'district_admin' | 'editor' | 'reviewer'>('editor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [circle, setCircle] = useState(`${selectedDistrict || selectedState || 'National'} Circle`);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      alert('Please provide a name, email, and password of at least 8 characters.');
      return;
    }
    onAddOfficer({
      name: name.trim(),
      email: email.trim(),
      role,
      password,
      stateId: (role === 'state_admin' || role === 'district_admin' || role === 'editor') ? selectedStateId : undefined,
      cityId: (role === 'district_admin' || role === 'editor') ? selectedDistrictId : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-base">person_add</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-on-surface">
                Register New Admin Officer
              </h3>
              <p className="text-[0.66rem] text-secondary">
                Grant national, state, or district administrative privileges with secure role isolation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="block text-[0.68rem] font-bold text-on-surface uppercase">
              Officer Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Chander"
              className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[0.68rem] font-bold text-on-surface uppercase">Initial Password *</label>
            <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[0.68rem] font-bold text-on-surface uppercase">
                Official Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. District Heritage Officer"
                className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[0.68rem] font-bold text-on-surface uppercase">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary font-medium"
              >
                <option value="super_admin">Super Admin (National)</option>
                <option value="state_admin">State Admin ({selectedState || 'Selected State'})</option>
                <option value="district_admin">District Admin ({selectedDistrict || 'Selected District'})</option>
                <option value="editor">District Editor</option>
                <option value="reviewer">Reviewer / Auditor</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[0.68rem] font-bold text-on-surface uppercase">
              Official Admin Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@dharohar.gov.in"
              className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary font-mono text-[0.72rem]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[0.68rem] font-bold text-on-surface uppercase">
              Assigned Jurisdiction / Circle
            </label>
            <input
              type="text"
              value={circle}
              onChange={(e) => setCircle(e.target.value)}
              placeholder="e.g. Indore Circle (Madhya Pradesh)"
              className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-container transition-colors shadow-sm"
            >
              Register Officer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 6. ADD JURISDICTION MODAL
// ==========================================
interface AddJurisdictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJurisdiction: (state: string, district: string) => void | Promise<void>;
}

export const AddJurisdictionModal: React.FC<AddJurisdictionModalProps> = ({
  isOpen,
  onClose,
  onAddJurisdiction,
}) => {
  const [newState, setNewState] = useState('');
  const [newDistrict, setNewDistrict] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newState.trim() || !newDistrict.trim()) {
      alert('Please provide State and District name.');
      return;
    }
    try {
      await onAddJurisdiction(newState.trim(), newDistrict.trim());
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not create jurisdiction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-xl max-w-md w-full overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">pin_drop</span>
            <h3 className="font-display font-bold text-sm text-on-surface">
              Add Monitored Jurisdiction
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="block text-[0.68rem] font-bold text-on-surface uppercase">
              State / Union Territory *
            </label>
            <input
              type="text"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              placeholder="e.g. Rajasthan, Madhya Pradesh"
              className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[0.68rem] font-bold text-on-surface uppercase">
              District / Division *
            </label>
            <input
              type="text"
              value={newDistrict}
              onChange={(e) => setNewDistrict(e.target.value)}
              placeholder="e.g. Jaipur, Indore"
              className="w-full bg-[#fbf9f5] border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-container transition-colors shadow-sm"
            >
              Add Jurisdiction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

