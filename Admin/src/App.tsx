import React, { useEffect, useState } from 'react';
import { ViewType, HeritagePlace, VideoRecord, PdfDocument, AdminOfficer } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { DashboardView } from './components/DashboardView';
import { SectionContentManager } from './components/SectionContentManager';
import { AddRecordWizard } from './components/AddRecordWizard';
import { ManageAdminsView } from './components/ManageAdminsView';
import { AdminSignInView } from './components/AdminSignInView';
import {
  createAdminOfficer,
  createContent,
  deleteContent,
  getAdminContent,
  getAdminDistricts,
  getAdminOfficers,
  getAdminStates,
  loginAdmin,
  toContentPayload,
  toHeritagePlace,
  updateAdminDistrict,
  updateAdminOfficer,
  updateContent,
} from './api';
import { getSectionBySlug, getSectionTitle } from './config/sections';
import {
  ImagePreviewModal,
  VideoPreviewModal,
  PdfPreviewModal,
  PlaceDetailsModal,
  InviteAdminModal,
  AddJurisdictionModal,
} from './components/Modals';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('section');
  const [selectedSection, setSelectedSection] = useState<string>('popular-places');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentOfficer, setCurrentOfficer] = useState<AdminOfficer | undefined>(undefined);
  const [authToast, setAuthToast] = useState<string | null>(null);

  // Jurisdictions State
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [cityBannerUrl, setCityBannerUrl] = useState<string>('');

  // Core Data State
  const [places, setPlaces] = useState<HeritagePlace[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocument[]>([]);
  const [officers, setOfficers] = useState<AdminOfficer[]>([]);
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem('dharohar_admin_token'));
  const [statesAndDistricts, setStatesAndDistricts] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!adminToken) return;
    Promise.all([getAdminOfficers(adminToken), getAdminStates(adminToken)])
      .then(async ([adminList, states]) => {
        const districtRecords = await Promise.all(
          states.map(async (state) => [state, await getAdminDistricts(adminToken, state._id)] as const)
        );
        const entries = districtRecords.map(([state, districts]) => [state.name, districts.map((d) => d.name)] as const);
        const firstDistrict = districtRecords[0]?.[1]?.[0];
        setOfficers(adminList);
        setStatesAndDistricts(Object.fromEntries(entries));
        if (states[0]) setSelectedState(states[0].name);
        if (firstDistrict) {
          setSelectedDistrict(firstDistrict.name);
          setSelectedDistrictId(firstDistrict._id);
          setCityBannerUrl(firstDistrict.coverImage || '');
          const scopedContent = await getAdminContent(adminToken, firstDistrict._id, selectedSection);
          setPlaces(scopedContent.map(toHeritagePlace));
        } else {
          setPlaces([]);
        }
        setIsAuthenticated(true);
        setCurrentOfficer(adminList[0]);
      })
      .catch(() => {
        sessionStorage.removeItem('dharohar_admin_token');
        setAdminToken(null);
      });
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken || !selectedDistrictId) return;
    getAdminContent(adminToken, selectedDistrictId, selectedSection)
      .then((content) => setPlaces(content.map(toHeritagePlace)))
      .catch((err) => {
        console.error('Failed to load section content:', err);
        setPlaces([]);
      });
  }, [adminToken, selectedDistrictId, selectedSection]);

  // Modals State
  const [previewImage, setPreviewImage] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });
  const [previewVideo, setPreviewVideo] = useState<VideoRecord | null>(null);
  const [previewPdf, setPreviewPdf] = useState<PdfDocument | null>(null);
  const [viewPlace, setViewPlace] = useState<HeritagePlace | null>(null);
  const [isInviteAdminOpen, setIsInviteAdminOpen] = useState(false);
  const [isAddJurisdictionOpen, setIsAddJurisdictionOpen] = useState(false);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const newDistricts = statesAndDistricts[state] || [];
    setSelectedDistrict(newDistricts[0] || '');
    if (!adminToken) return;
    getAdminStates(adminToken).then(async (states) => {
      const stateRecord = states.find((item) => item.name === state);
      if (!stateRecord) return;
      const districts = await getAdminDistricts(adminToken, stateRecord._id);
      const target = districts[0];
      setSelectedDistrictId(target?._id || '');
      setCityBannerUrl(target?.coverImage || '');
    });
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    if (!adminToken) return;
    getAdminStates(adminToken).then(async (states) => {
      const stateRecord = states.find((item) => item.name === selectedState);
      if (!stateRecord) return;
      const districts = await getAdminDistricts(adminToken, stateRecord._id);
      const target = districts.find((item) => item.name === district);
      setSelectedDistrictId(target?._id || '');
      setCityBannerUrl(target?.coverImage || '');
    });
  };

  const handleSaveCityBanner = async (url: string) => {
    setCityBannerUrl(url);
    if (!adminToken || !selectedDistrictId) return;
    try {
      await updateAdminDistrict(adminToken, selectedDistrictId, { coverImage: url });
      setAuthToast('City cover image updated successfully in database!');
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err) {
      console.error('Failed to update city cover image:', err);
      alert('Failed to update city cover image in database');
    }
  };

  const handleAddJurisdiction = (state: string, district: string) => {
    setStatesAndDistricts((current) => ({ ...current, [state]: [...(current[state] || []), district] }));
    setSelectedState(state);
    setSelectedDistrict(district);
  };

  // Place operations
  const handlePublishNewPlace = async (newPlaceData: Partial<HeritagePlace>) => {
    if (!adminToken) return;
    try {
      let targetDistrictId = selectedDistrictId;
      if (!targetDistrictId) {
        const states = await getAdminStates(adminToken);
        const stateRecord = states.find((item) => item.name === selectedState);
        if (stateRecord) {
          const districts = await getAdminDistricts(adminToken, stateRecord._id);
          targetDistrictId = districts.find((item) => item.name === selectedDistrict)?._id || '';
        }
      }
      if (!targetDistrictId) {
        alert('Please select a valid district before creating content.');
        return;
      }
      const created = await createContent(
        adminToken,
        toContentPayload(newPlaceData, targetDistrictId, selectedSection)
      );
      setPlaces((current) => [toHeritagePlace(created), ...current]);
      setAuthToast(`Published "${newPlaceData.name || 'New Record'}" to ${getSectionTitle(selectedSection)}`);
      setCurrentView('section');
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to publish record:', err);
      alert('Error publishing record: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (!adminToken) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this heritage record from the National Database?'
    );
    if (!confirmDelete) return;
    try {
      await deleteContent(adminToken, id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setAuthToast('Record deleted successfully from database.');
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to delete record:', err);
      alert('Failed to delete record from database: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleTogglePublishPlace = async (place: HeritagePlace) => {
    if (!adminToken) return;
    const newStatus = place.status === 'Published' ? 'draft' : 'published';
    try {
      await updateContent(adminToken, place.id, { status: newStatus });
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === place.id
            ? { ...p, status: newStatus === 'published' ? 'Published' : 'Draft (In Curation)' }
            : p
        )
      );
      setAuthToast(`Record status updated to ${newStatus}`);
      setTimeout(() => setAuthToast(null), 2500);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update record status');
    }
  };

  // Video operations
  const handleAddVideo = (video: Omit<VideoRecord, 'id'>) => {
    const newVideo: VideoRecord = { ...video, id: `vid-${Date.now()}` };
    setVideos((prev) => [newVideo, ...prev]);
  };

  const handleDeleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  // PDF operations
  const handleAddPdf = (pdf: Omit<PdfDocument, 'id'>) => {
    const newPdf: PdfDocument = { ...pdf, id: `pdf-${Date.now()}` };
    setPdfDocuments((prev) => [newPdf, ...prev]);
  };

  const handleDeletePdf = (id: string) => {
    setPdfDocuments((prev) => prev.filter((p) => p.id !== id));
  };

  // Admin Officer Operations
  const handleInviteAdmin = async (officer: { name: string; email: string; role: 'super_admin' | 'editor'; password?: string }) => {
    if (!adminToken) return;
    try {
      const created = await createAdminOfficer(adminToken, {
        name: officer.name,
        email: officer.email,
        password: officer.password || 'Dharohar@2026',
        role: officer.role || 'editor',
      });
      setOfficers((prev) => [created, ...prev]);
      setAuthToast(`Admin Invitation sent to ${officer.email}`);
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err: unknown) {
      alert('Failed to create admin officer: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditOfficer = async (officer: AdminOfficer) => {
    if (!adminToken) return;
    const roleMapping: Record<string, 'super_admin' | 'editor' | 'reviewer'> = {
      'Super Admin': 'super_admin',
      'Circle Admin': 'editor',
      'Archival Auditor': 'reviewer',
    };
    try {
      const updated = await updateAdminOfficer(adminToken, officer.id, {
        name: officer.name,
        role: roleMapping[officer.role] || 'editor',
        active: officer.status === 'Active',
      });
      setOfficers((prev) => prev.map((o) => (o.id === officer.id ? updated : o)));
    } catch (err: unknown) {
      alert('Failed to update admin officer: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleRevokeOfficer = async (id: string) => {
    if (!adminToken) return;
    try {
      await updateAdminOfficer(adminToken, id, { active: false });
      setOfficers((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'Suspended' } : o)));
    } catch (err: unknown) {
      alert('Failed to revoke admin officer: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleNavigate = (view: ViewType, sectionSlug?: string) => {
    if (view === 'section' && sectionSlug) {
      setSelectedSection(sectionSlug);
      setCurrentView('section');
    } else if (view === 'popular-places') {
      setSelectedSection('popular-places');
      setCurrentView('section');
    } else {
      setCurrentView(view);
    }
  };

  const handleAdminSignInSuccess = (token: string, officerName: string) => {
    sessionStorage.setItem('dharohar_admin_token', token);
    setAdminToken(token);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    setAuthToast(`Welcome back, ${officerName}. National Heritage Registry session active.`);
    setTimeout(() => setAuthToast(null), 4000);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('dharohar_admin_token');
    setAdminToken(null);
    setIsAuthenticated(false);
    setCurrentView('signin');
  };

  // Sign In Screen
  if (currentView === 'signin' || !isAuthenticated) {
    return (
      <>
        {authToast && (
          <div className="fixed top-4 right-4 z-50 bg-primary text-on-primary px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-slide-in">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{authToast}</span>
          </div>
        )}
        <AdminSignInView onSignIn={(officer, token) => handleAdminSignInSuccess(token, officer.name)} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden font-sans antialiased">
      {/* Toast Notification Banner */}
      {authToast && (
        <div
          id="admin-toast-banner"
          className="fixed top-4 right-4 z-50 bg-primary text-on-primary px-4 py-3 rounded-xl shadow-lg border border-primary-hover flex items-center gap-2 text-xs font-semibold animate-slide-in"
        >
          <span className="material-symbols-outlined text-sm">verified</span>
          <span>{authToast}</span>
        </div>
      )}

      {/* Main Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        selectedCategory={selectedSection}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        onStateChange={handleStateChange}
        onDistrictChange={handleDistrictChange}
        onOpenAddJurisdiction={() => setIsAddJurisdictionOpen(true)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        adminCount={officers.length}
        currentOfficer={currentOfficer}
        onSignOut={handleSignOut}
        statesAndDistricts={statesAndDistricts}
      />

      {/* Center Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Toolbar */}
        <MobileHeader
          onToggleMobileSidebar={() => setIsMobileOpen(true)}
          currentView={currentView}
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onNavigateAddRecord={() => setCurrentView('add-record')}
          currentOfficer={currentOfficer}
        />

        {/* Scrollable View Viewport */}
        <div className="flex-1 overflow-y-auto bg-surface">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              onSelectJurisdiction={(state, district) => {
                setSelectedState(state);
                setSelectedDistrict(district);
                setSelectedSection('popular-places');
                setCurrentView('section');
              }}
              cityBannerUrl={cityBannerUrl}
              onSaveCityBanner={handleSaveCityBanner}
            />
          )}

          {(currentView === 'section' || currentView === 'popular-places') && (
            <SectionContentManager
              sectionSlug={selectedSection}
              sectionTitle={getSectionTitle(selectedSection)}
              sectionDescription={getSectionBySlug(selectedSection)?.description}
              places={places}
              onNavigateAddRecord={() => setCurrentView('add-record')}
              onEditPlace={() => setCurrentView('add-record')}
              onViewPlace={(p) => setViewPlace(p)}
              onDeletePlace={handleDeletePlace}
              onQuickPublishPlace={handleTogglePublishPlace}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
            />
          )}

          {currentView === 'add-record' && (
            <AddRecordWizard
              onCancel={() => setCurrentView('section')}
              onPublish={handlePublishNewPlace}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              videos={videos}
              onAddVideo={handleAddVideo}
              onDeleteVideo={handleDeleteVideo}
              onPreviewVideo={(v) => setPreviewVideo(v)}
              pdfDocuments={pdfDocuments}
              onAddPdf={handleAddPdf}
              onDeletePdf={handleDeletePdf}
              onPreviewPdf={(p) => setPreviewPdf(p)}
              onPreviewImage={(url, title) => setPreviewImage({ isOpen: true, url, title })}
            />
          )}

          {currentView === 'manage-admins' && (
            <ManageAdminsView
              officers={officers}
              onInviteNewAdmin={() => setIsInviteAdminOpen(true)}
              onEditOfficer={handleEditOfficer}
              onRevokeOfficer={handleRevokeOfficer}
              onReactivateOfficer={handleRevokeOfficer}
            />
          )}
        </div>
      </div>

      {/* Global Interactive Modals */}
      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        onClose={() => setPreviewImage({ isOpen: false, url: '', title: '' })}
        imageUrl={previewImage.url}
        title={previewImage.title}
      />

      <VideoPreviewModal
        onClose={() => setPreviewVideo(null)}
        video={previewVideo}
      />

      <PdfPreviewModal
        onClose={() => setPreviewPdf(null)}
        pdf={previewPdf}
      />

      <PlaceDetailsModal
        onClose={() => setViewPlace(null)}
        place={viewPlace}
        onEdit={() => {
          setViewPlace(null);
          setCurrentView('add-record');
        }}
      />

      <InviteAdminModal
        isOpen={isInviteAdminOpen}
        onClose={() => setIsInviteAdminOpen(false)}
        onAddOfficer={handleInviteAdmin}
        selectedState={selectedState}
      />

      <AddJurisdictionModal
        isOpen={isAddJurisdictionOpen}
        onClose={() => setIsAddJurisdictionOpen(false)}
        onAddJurisdiction={handleAddJurisdiction}
      />
    </div>
  );
}
