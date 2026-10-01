import React, { useEffect, useState, useCallback } from 'react';
import { ViewType, HeritagePlace, VideoRecord, PdfDocument, AdminOfficer } from './types';
import { Sidebar, MobileHeader } from './components';
import {
  DashboardPage as DashboardView,
  SectionContentPage as SectionContentManager,
  AddRecordPage as AddRecordWizard,
  ManageAdminsPage as ManageAdminsView,
  AdminSignInPage as AdminSignInView,
} from './pages';
import {
  createAdminDistrict,
  createAdminOfficer,
  createAdminState,
  createContent,
  deleteContent,
  getAdminContent,
  getAdminDistrictCategories,
  getAdminDistricts,
  getAdminOfficers,
  getAdminStates,
  getAdminSummary,
  patchContentStatus,
  toContentPayload,
  toHeritagePlace,
  updateAdminDistrict,
  updateAdminDistrictCategory,
  updateAdminOfficer,
  updateContent,
  AdminSummary,
} from './api';
import {
  CITY_SECTIONS,
  CitySectionConfig,
  getSectionBySlug,
  getSectionTitle,
  resolveCategorySlug,
} from './config/categoryDefinitions';
import {
  ImagePreviewModal,
  VideoPreviewModal,
  PdfPreviewModal,
  PlaceDetailsModal,
  InviteAdminModal,
  AddJurisdictionModal,
} from './components/Modals';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedSection, setSelectedSection] = useState<string>('heritage-places');
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
  const [editingPlace, setEditingPlace] = useState<HeritagePlace | null>(null);
  const [categoryConfigs, setCategoryConfigs] = useState<Array<CitySectionConfig & { enabled: boolean }>>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [officers, setOfficers] = useState<AdminOfficer[]>([]);
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem('dharohar_admin_token'));
  const [statesAndDistricts, setStatesAndDistricts] = useState<Record<string, string[]>>({});
  const [stateRecordMap, setStateRecordMap] = useState<Record<string, { _id: string; name: string; code: string }>>({});
  const [districtRecordMap, setDistrictRecordMap] = useState<Record<string, { _id: string; name: string; stateId: string; coverImage?: string }>>({});

  // Initial Boot & Authentication Validation
  useEffect(() => {
    if (!adminToken) return;
    Promise.all([getAdminOfficers(adminToken), getAdminStates(adminToken)])
      .then(async ([adminList, states]) => {
        const stateMap: Record<string, { _id: string; name: string; code: string }> = {};
        states.forEach((st) => {
          stateMap[st.name] = st;
        });
        setStateRecordMap(stateMap);

        const districtRecords = await Promise.all(
          states.map(async (state) => [state, await getAdminDistricts(adminToken, state._id)] as const)
        );

        const distMap: Record<string, { _id: string; name: string; stateId: string; coverImage?: string }> = {};
        const entries = districtRecords.map(([state, districts]) => {
          districts.forEach((d) => {
            distMap[`${state.name}:${d.name}`] = d;
          });
          return [state.name, districts.map((d) => d.name)] as const;
        });

        setOfficers(adminList);
        setStatesAndDistricts(Object.fromEntries(entries));
        setDistrictRecordMap(distMap);

        const firstState = states[0]?.name || 'Madhya Pradesh';
        const firstDistricts = districtRecords.find(([st]) => st.name === firstState)?.[1] || districtRecords[0]?.[1] || [];
        const firstDistrict = firstDistricts[0];

        if (states[0]) setSelectedState(firstState);
        if (firstDistrict) {
          setSelectedDistrict(firstDistrict.name);
          setSelectedDistrictId(firstDistrict._id);
          setCityBannerUrl(firstDistrict.coverImage || '');

          // Load District Scoped Data
          const [scopedContent, catConfigs, summaryMetrics] = await Promise.all([
            getAdminContent(adminToken, firstDistrict._id),
            getAdminDistrictCategories(adminToken, firstDistrict._id).catch(() =>
              CITY_SECTIONS.map((s) => ({ ...s, enabled: true }))
            ),
            getAdminSummary(adminToken, firstDistrict._id).catch(() => null),
          ]);
          setPlaces(scopedContent.map(toHeritagePlace));
          setCategoryConfigs(catConfigs);
          setSummary(summaryMetrics);
        } else {
          setPlaces([]);
        }

        setIsAuthenticated(true);
        setCurrentOfficer(adminList[0]);
      })
      .catch((err) => {
        console.error('Session validation error:', err);
        sessionStorage.removeItem('dharohar_admin_token');
        setAdminToken(null);
      });
  }, [adminToken]);

  // Load Content, Categories & Summary on Workspace Scope Changes
  const loadScopedData = useCallback(async (districtId: string, sectionSlug?: string, view?: ViewType) => {
    if (!adminToken || !districtId) return;
    try {
      const activeView = view || currentView;
      const targetSection = activeView === 'dashboard' ? undefined : (sectionSlug || selectedSection);

      const [contentData, catConfigs, summaryData] = await Promise.all([
        getAdminContent(adminToken, districtId, targetSection),
        getAdminDistrictCategories(adminToken, districtId).catch(() =>
          CITY_SECTIONS.map((s) => ({ ...s, enabled: true }))
        ),
        getAdminSummary(adminToken, districtId).catch(() => null),
      ]);

      setPlaces(contentData.map(toHeritagePlace));
      setCategoryConfigs(catConfigs);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load district scoped data:', err);
      setPlaces([]);
    }
  }, [adminToken, currentView, selectedSection]);

  useEffect(() => {
    if (selectedDistrictId) {
      loadScopedData(selectedDistrictId, selectedSection, currentView);
    }
  }, [selectedDistrictId, selectedSection, currentView, loadScopedData]);

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

  // State Change Handler
  const handleStateChange = async (state: string) => {
    setSelectedState(state);
    const newDistricts = statesAndDistricts[state] || [];
    const firstDistrict = newDistricts[0] || '';
    setSelectedDistrict(firstDistrict);

    if (!adminToken) return;
    try {
      const stateObj = stateRecordMap[state] || (await getAdminStates(adminToken)).find((s) => s.name === state);
      if (!stateObj) return;
      const districts = await getAdminDistricts(adminToken, stateObj._id);
      const target = districts.find((d) => d.name === firstDistrict) || districts[0];
      if (target) {
        setSelectedDistrict(target.name);
        setSelectedDistrictId(target._id);
        setCityBannerUrl(target.coverImage || '');
      }
    } catch (err) {
      console.error('Error changing state:', err);
    }
  };

  // District Change Handler
  const handleDistrictChange = async (district: string) => {
    setSelectedDistrict(district);
    if (!adminToken) return;
    try {
      const key = `${selectedState}:${district}`;
      const cachedDistrict = districtRecordMap[key];
      if (cachedDistrict) {
        setSelectedDistrictId(cachedDistrict._id);
        setCityBannerUrl(cachedDistrict.coverImage || '');
        return;
      }
      const stateObj = stateRecordMap[selectedState] || (await getAdminStates(adminToken)).find((s) => s.name === selectedState);
      if (!stateObj) return;
      const districts = await getAdminDistricts(adminToken, stateObj._id);
      const target = districts.find((d) => d.name === district) || districts[0];
      if (target) {
        setSelectedDistrictId(target._id);
        setCityBannerUrl(target.coverImage || '');
      }
    } catch (err) {
      console.error('Error changing district:', err);
    }
  };

  const handleSaveCityBanner = async (url: string) => {
    setCityBannerUrl(url);
    if (!adminToken || !selectedDistrictId) return;
    try {
      await updateAdminDistrict(adminToken, selectedDistrictId, { coverImage: url });
      setAuthToast('District cover image updated successfully in database!');
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err) {
      console.error('Failed to update district cover image:', err);
      alert('Failed to update district cover image in database');
    }
  };

  // Add Jurisdiction (State + District)
  const handleAddJurisdiction = async (stateName: string, districtName: string) => {
    if (!adminToken) return;
    try {
      // 1. Get or Create State
      let stateRecord: { _id: string; name: string; code: string } | undefined = stateRecordMap[stateName];
      if (!stateRecord) {
        const allStates = await getAdminStates(adminToken);
        stateRecord = allStates.find((s) => s.name.toLowerCase() === stateName.toLowerCase());
        if (!stateRecord) {
          const words = stateName.trim().split(/\s+/);
          let baseCode = words.length > 1
            ? words.map((w) => w[0]).join('').slice(0, 4).toUpperCase()
            : stateName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
          if (baseCode.length < 2) baseCode = (stateName.toUpperCase() + 'ST').slice(0, 3);
          
          let code = baseCode;
          let counter = 1;
          while (allStates.some((s) => s.code.toUpperCase() === code.toUpperCase())) {
            code = `${baseCode.slice(0, 2)}${counter++}`;
          }
          stateRecord = await createAdminState(adminToken, { name: stateName, code, active: true });
        }
      }

      if (!stateRecord) {
        throw new Error('Could not resolve or create state');
      }

      // 2. Create District
      const createdDistrict = await createAdminDistrict(adminToken, {
        stateId: stateRecord._id,
        name: districtName,
        active: true,
      });

      // 3. Update local caches
      setStatesAndDistricts((current) => ({
        ...current,
        [stateName]: Array.from(new Set([...(current[stateName] || []), districtName])),
      }));
      setDistrictRecordMap((current) => ({
        ...current,
        [`${stateName}:${districtName}`]: createdDistrict,
      }));

      setSelectedState(stateName);
      setSelectedDistrict(districtName);
      setSelectedDistrictId(createdDistrict._id);
      setCityBannerUrl('');

      setAuthToast(`Registered ${districtName} District under ${stateName} successfully!`);
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err) {
      console.error('Failed to create jurisdiction:', err);
      alert('Failed to create jurisdiction in database: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Category Status Toggle Handler (District-Scoped)
  const handleToggleCategoryStatus = async (categorySlug: string, enabled: boolean) => {
    if (!adminToken || !selectedDistrictId) return;
    try {
      const canonical = resolveCategorySlug(categorySlug) || categorySlug;
      await updateAdminDistrictCategory(adminToken, selectedDistrictId, canonical, enabled);
      setCategoryConfigs((prev) =>
        prev.map((c) => (c.slug === canonical ? { ...c, enabled } : c))
      );
      setAuthToast(
        `"${getSectionTitle(canonical)}" is now ${enabled ? 'Enabled' : 'Disabled'} for ${selectedDistrict}`
      );
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err) {
      console.error('Failed to update category status:', err);
      alert('Failed to update category status in database');
    }
  };

  // Place operations (Create or Update Existing Record in Place)
  const handleSavePlaceRecord = async (placeData: Partial<HeritagePlace>, existingId?: string) => {
    if (!adminToken || !selectedDistrictId) {
      alert('Please select a valid district workspace before saving records.');
      return;
    }

    try {
      const targetCategory = resolveCategorySlug(placeData.section || selectedSection) || 'heritage-places';

      if (existingId) {
        // UPDATE EXISTING RECORD (Never duplicates document)
        const updated = await updateContent(
          adminToken,
          existingId,
          toContentPayload(placeData, selectedDistrictId, targetCategory)
        );
        const mapped = toHeritagePlace(updated);
        setPlaces((prev) => prev.map((p) => (p.id === existingId ? mapped : p)));
        setAuthToast(`Updated "${placeData.name || 'Heritage Record'}" in database`);
      } else {
        // CREATE NEW RECORD
        const created = await createContent(
          adminToken,
          toContentPayload(placeData, selectedDistrictId, targetCategory)
        );
        const mapped = toHeritagePlace(created);
        setPlaces((prev) => [mapped, ...prev]);
        setAuthToast(`Created "${placeData.name || 'New Record'}" under ${selectedDistrict}`);
      }

      setEditingPlace(null);
      setCurrentView('section');
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err: unknown) {
      console.error('Failed to save record:', err);
      alert('Error saving record: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (!adminToken) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this heritage record? It will be safely soft-deleted from active registry.'
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
      await patchContentStatus(adminToken, place.id, newStatus);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === place.id
            ? { ...p, status: newStatus === 'published' ? 'Published' : 'Draft (In Curation)' }
            : p
        )
      );
      setAuthToast(`Record status updated to "${newStatus}" in database.`);
      setTimeout(() => setAuthToast(null), 2500);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update record status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Admin Officer Operations
  const handleInviteAdmin = async (officer: {
    name: string;
    email: string;
    role: 'super_admin' | 'state_admin' | 'district_admin' | 'editor' | 'reviewer';
    password?: string;
    stateId?: string;
    cityId?: string;
  }) => {
    if (!adminToken) return;
    try {
      const created = await createAdminOfficer(adminToken, {
        name: officer.name,
        email: officer.email,
        password: officer.password || 'OurDharohar@2026',
        role: officer.role || 'editor',
        stateId: officer.stateId,
        cityId: officer.cityId,
      });
      setOfficers((prev) => [created, ...prev]);
      setAuthToast(`Admin Officer created successfully for ${officer.email}`);
      setTimeout(() => setAuthToast(null), 3000);
    } catch (err: unknown) {
      alert('Failed to create admin officer: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleEditOfficer = async (officer: AdminOfficer) => {
    if (!adminToken) return;
    try {
      const updated = await updateAdminOfficer(adminToken, officer.id, {
        name: officer.name,
        role: officer.role,
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
      const canonical = resolveCategorySlug(sectionSlug) || 'heritage-places';
      setSelectedSection(canonical);
      setEditingPlace(null);
      setCurrentView('section');
    } else if (view === 'add-record') {
      setEditingPlace(null);
      setCurrentView('add-record');
    } else {
      setEditingPlace(null);
      setCurrentView(view);
    }
  };

  const handleAdminSignInSuccess = (token: string, officerName: string) => {
    sessionStorage.setItem('dharohar_admin_token', token);
    setAdminToken(token);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    setAuthToast(`Welcome back, ${officerName}. Our_Dharohar session active.`);
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

  // Active Category Config for Current Section
  const currentCategoryConfig = categoryConfigs.find((c) => c.slug === selectedSection);
  const isCurrentCategoryActive = currentCategoryConfig ? currentCategoryConfig.enabled !== false : true;

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
          onNavigateAddRecord={() => {
            setEditingPlace(null);
            setCurrentView('add-record');
          }}
          currentOfficer={currentOfficer}
        />

        {/* Scrollable View Viewport */}
        <div className="flex-1 overflow-y-auto bg-surface">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              selectedDistrictId={selectedDistrictId}
              onSelectJurisdiction={(state, district) => {
                setSelectedState(state);
                setSelectedDistrict(district);
                handleDistrictChange(district);
              }}
              cityBannerUrl={cityBannerUrl}
              onSaveCityBanner={handleSaveCityBanner}
              summary={summary}
              places={places}
              categoryConfigs={categoryConfigs}
              onToggleCategoryStatus={(slug, enabled) => handleToggleCategoryStatus(slug, enabled)}
              onEditPlace={(p) => {
                setEditingPlace(p);
                setCurrentView('add-record');
              }}
              onViewPlace={(p) => setViewPlace(p)}
              onDeletePlace={handleDeletePlace}
              onQuickPublishPlace={handleTogglePublishPlace}
              onNavigateAddRecord={() => {
                setEditingPlace(null);
                setCurrentView('add-record');
              }}
            />
          )}

          {currentView === 'section' && (
            <SectionContentManager
              sectionSlug={selectedSection}
              sectionTitle={getSectionTitle(selectedSection)}
              sectionDescription={getSectionBySlug(selectedSection)?.description}
              places={places}
              isCategoryActive={isCurrentCategoryActive}
              onToggleCategoryStatus={(enabled) => handleToggleCategoryStatus(selectedSection, enabled)}
              onNavigateAddRecord={() => {
                setEditingPlace(null);
                setCurrentView('add-record');
              }}
              onEditPlace={(p) => {
                setEditingPlace(p);
                setCurrentView('add-record');
              }}
              onViewPlace={(p) => setViewPlace(p)}
              onDeletePlace={handleDeletePlace}
              onQuickPublishPlace={handleTogglePublishPlace}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
            />
          )}

          {currentView === 'add-record' && (
            <AddRecordWizard
              editingPlace={editingPlace}
              onCancel={() => {
                setEditingPlace(null);
                setCurrentView('section');
              }}
              onPublish={handleSavePlaceRecord}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              selectedDistrictId={selectedDistrictId}
              selectedCategory={selectedSection}
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
          if (viewPlace) setEditingPlace(viewPlace);
          setViewPlace(null);
          setCurrentView('add-record');
        }}
      />

      <InviteAdminModal
        isOpen={isInviteAdminOpen}
        onClose={() => setIsInviteAdminOpen(false)}
        onAddOfficer={handleInviteAdmin}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        selectedStateId={stateRecordMap[selectedState]?._id}
        selectedDistrictId={selectedDistrictId}
      />

      <AddJurisdictionModal
        isOpen={isAddJurisdictionOpen}
        onClose={() => setIsAddJurisdictionOpen(false)}
        onAddJurisdiction={handleAddJurisdiction}
      />
    </div>
  );
}
