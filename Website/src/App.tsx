import React, { useState, useEffect } from 'react';
import { HeritageSite, PageRoute, MediaItem, UserProfile } from './types';
import { getContent, getDistricts, getStates, getUserProfile, toHeritageSite, updateUserProfile } from './api';
import { type StateInfo, type DistrictInfo, getStateRegion } from './data/statesAndDistricts';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeDashboard } from './components/HomeDashboard';
import { AroundMeMap } from './components/AroundMeMap';
import { MonographDetail } from './components/MonographDetail';
import { ExploreSearch } from './components/ExploreSearch';
import { PassportView } from './components/PassportView';
import { MediaModal } from './components/MediaModal';
import { DirectionsModal } from './components/DirectionsModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { StateDistrictModal } from './components/StateDistrictModal';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { CitySectionPage } from './components/CitySectionPage';

const toStateInfo = (state: { _id: string; name: string; code: string }, districts: Array<{ _id: string; name: string; coordinates?: { lat: number; lng: number }; description?: string; coverImage?: string }>): StateInfo => ({
  id: state._id,
  name: state.name,
  code: state.code,
  region: getStateRegion(state.code || state.name),
  isPublished: true,
  monumentCount: 0,
  districts: districts.map((district) => ({
    id: district._id,
    name: district.name,
    state: state.name,
    isPublished: true,
    monumentCount: 0,
    highlightMonuments: [],
    coordinates: district.coordinates || { lat: 0, lng: 0 },
    description: district.description,
    coverImage: district.coverImage,
  })),
});

export default function App() {
  // Authentication state
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('indian_heritage_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [userToken, setUserToken] = useState<string | null>(() => localStorage.getItem('indian_heritage_token'));

  // Non-authenticated users default exclusively to 'landing'
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(() => {
    try {
      const stored = localStorage.getItem('indian_heritage_user');
      return stored ? 'home' : 'landing';
    } catch {
      return 'landing';
    }
  });

  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [authTargetState, setAuthTargetState] = useState<string | undefined>(undefined);
  const [authTargetDistrict, setAuthTargetDistrict] = useState<string | undefined>(undefined);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);

  const [sites, setSites] = useState<HeritageSite[]>([]);
  const [publishedStatesList, setPublishedStatesList] = useState<StateInfo[]>([]);
  const [selectedSite, setSelectedSite] = useState<HeritageSite>({} as HeritageSite);
  const [selectedState, setSelectedState] = useState<StateInfo>({} as StateInfo);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo>({} as DistrictInfo);
  const [isStateDistrictModalOpen, setIsStateDistrictModalOpen] = useState<boolean>(false);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Active section view state
  const [activeSectionSlug, setActiveSectionSlug] = useState<string>('popular-places');
  const [activeSectionTitle, setActiveSectionTitle] = useState<string>('Popular Places');

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('indian_heritage_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeMediaModal, setActiveMediaModal] = useState<MediaItem | null>(null);
  const [directionsSite, setDirectionsSite] = useState<HeritageSite | null>(null);
  const [isFavoritesDrawerOpen, setIsFavoritesDrawerOpen] = useState<boolean>(false);

  const refreshPublishedDirectory = async () => {
    const states = await getStates();
    const liveStates = await Promise.all(states.map(async (state) => toStateInfo(state, await getDistricts(state._id))));
    setPublishedStatesList(liveStates);
    return liveStates;
  };

  useEffect(() => {
    const loadDirectory = async () => {
      const liveStates = await refreshPublishedDirectory();
      const profileState = user && liveStates.find((state) => state.name.toLowerCase() === user.state.toLowerCase());
      const activeState = profileState || (!user ? liveStates[0] : undefined);
      const profileDistrict = activeState?.districts.find((district) => district.name.toLowerCase() === user?.district.toLowerCase());
      const activeDistrict = profileDistrict || (!user ? activeState?.districts[0] : undefined);
      if (activeState) setSelectedState(activeState);
      if (activeState && activeDistrict) {
        setSelectedDistrict(activeDistrict);
        const districtSites = (await getContent(activeDistrict.id)).map((item) => toHeritageSite(item, { _id: activeDistrict.id, stateId: activeState.id, name: activeDistrict.name, active: true, coordinates: activeDistrict.coordinates }));
        setSites(districtSites);
        if (districtSites[0]) setSelectedSite(districtSites[0]);
      } else setSites([]);
    };
    loadDirectory().catch(() => {
      setPublishedStatesList([]);
      setSites([]);
    });
  }, [user]);

  useEffect(() => {
    if (!isStateDistrictModalOpen) return;
    refreshPublishedDirectory().catch(() => undefined);
  }, [isStateDistrictModalOpen]);

  useEffect(() => {
    if (!userToken) return;
    getUserProfile(userToken).then((profile) => setUser(profile)).catch(() => {
      localStorage.removeItem('indian_heritage_token');
      localStorage.removeItem('indian_heritage_user');
      setUserToken(null);
      setUser(null);
    });
  }, [userToken]);

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('indian_heritage_favorites', JSON.stringify(favorites));
    } catch {
      // Ignore
    }
  }, [favorites]);

  // Enforce single-page constraint for non-authenticated users
  useEffect(() => {
    if (!user && currentRoute !== 'landing' && currentRoute !== 'auth') {
      setCurrentRoute('landing');
    }
  }, [user, currentRoute]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute]);

  const openAuthPage = (mode: 'signin' | 'signup' = 'signin', targetState?: string, targetDistrict?: string) => {
    setAuthInitialMode(mode);
    setAuthTargetState(targetState);
    setAuthTargetDistrict(targetDistrict);
    setCurrentRoute('auth');
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('indian_heritage_user');
    localStorage.removeItem('indian_heritage_token');
    setUserToken(null);
    setCurrentRoute('landing');
    setWelcomeBanner(null);
  };

  const handleAuthSuccess = (profile: UserProfile, token: string) => {
    setUser(profile);
    setUserToken(token);
    localStorage.setItem('indian_heritage_token', token);
    try {
      localStorage.setItem('indian_heritage_user', JSON.stringify(profile));
    } catch {
      // Ignore
    }

    // Match and configure selected state & district from user profile
    const matchedState = publishedStatesList.find((s) => s.name.toLowerCase() === profile.state.toLowerCase());
    if (!matchedState) return;
    setSelectedState(matchedState);

    const matchedDistrict =
      matchedState.districts.find((d) => d.name.toLowerCase() === profile.district.toLowerCase());
    if (!matchedDistrict) return;
    setSelectedDistrict(matchedDistrict);
    getContent(matchedDistrict.id).then((items) => {
      const districtSites = items.map((item) => toHeritageSite(item, { _id: matchedDistrict.id, stateId: matchedState.id, name: matchedDistrict.name, active: true, coordinates: matchedDistrict.coordinates }));
      setSites(districtSites);
      if (districtSites[0]) setSelectedSite(districtSites[0]);
    });
    setMapCenterCoords({ lat: matchedDistrict.coordinates.lat, lng: matchedDistrict.coordinates.lng });

    // Show welcoming toast
    setWelcomeBanner(`Welcome, ${profile.name}! Exploring heritage in ${matchedDistrict.name}, ${matchedState.code}.`);
    setTimeout(() => {
      setWelcomeBanner(null);
    }, 5000);

    // Redirect to HOME page on selected city as requested
    setCurrentRoute('home');
  };

  const toggleFavorite = (siteId: string) => {
    setFavorites((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const handleViewMonograph = async (site: HeritageSite) => {
    if (!user) {
      openAuthPage('signup');
      return;
    }
    setSelectedSite(site);
    setCurrentRoute('monograph');
    try {
      if (site.id) {
        const full = await getContentDetails(site.id);
        if (full) {
          const raw = full as any;
          setSelectedSite((prev) => ({
            ...prev,
            ...full,
            description: raw.fullDescription || full.description || raw.shortDescription || raw.fields?.description || prev.description,
            subTitle: raw.subtitle || full.subTitle || raw.fields?.subTitle || prev.subTitle,
            location: raw.districtName || raw.cityName || raw.location || prev.location,
            builtYear: raw.builtYear || raw.fields?.builtYear || prev.builtYear,
            dynasty: raw.dynasty || raw.fields?.dynasty || prev.dynasty,
            category: raw.category || raw.fields?.category || prev.category,
            openingHours: raw.openingHours || raw.fields?.openingHours || prev.openingHours,
            visitorTariffs: raw.visitorTariffs || raw.fields?.visitorTariffs || prev.visitorTariffs,
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch extra monograph details:', err);
    }
  };

  const handleGetDirections = (site: HeritageSite) => {
    if (!user) {
      openAuthPage('signup');
      return;
    }
    setDirectionsSite(site);
  };

  const handleSelectDistrict = async (
    state: StateInfo,
    district: DistrictInfo,
    action: 'map' | 'explore' | 'apply'
  ) => {
    setSelectedState(state);
    setSelectedDistrict(district);
    setMapCenterCoords({ lat: district.coordinates.lat, lng: district.coordinates.lng });
    const districtSites = (await getContent(district.id)).map((item) => toHeritageSite(item, {
      _id: district.id,
      stateId: state.id,
      name: district.name,
      active: true,
      coordinates: district.coordinates,
    }));
    setSites(districtSites);
    if (districtSites[0]) setSelectedSite(districtSites[0]);

    if (action === 'map') {
      setCurrentRoute('around-me');
    } else if (action === 'explore') {
      setCurrentRoute('explore');
    } else {
      setCurrentRoute('home');
    }
  };

  const savedSitesList = sites.filter((s) => favorites.includes(s.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3EE] text-[#1a1c1c] font-sans antialiased selection:bg-[#a14009] selection:text-white">
      {/* 1. Global Navigation Bar */}
      <Header
        currentRoute={currentRoute}
        onRouteChange={(route) => {
          if (!user && route !== 'landing' && route !== 'auth') {
            openAuthPage('signin');
          } else {
            setCurrentRoute(route);
          }
        }}
        user={user}
        onOpenAuth={(mode) => openAuthPage(mode || 'signin')}
        onSignOut={handleSignOut}
        savedCount={favorites.length}
        onOpenMap={() => setIsStateDistrictModalOpen(true)}
        onOpenFavorites={() => setIsFavoritesDrawerOpen(true)}
        onOpenStateDistrictModal={() => setIsStateDistrictModalOpen(true)}
        selectedStateCode={selectedState.code}
        selectedDistrictName={selectedDistrict.name}
      />

      {/* Floating Welcome Notification after Profile Completion */}
      {welcomeBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#a14009] text-white px-6 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-fadeIn border border-amber-300/40">
          <span className="material-symbols-outlined text-amber-300 text-[18px]">verified</span>
          <span>{welcomeBanner}</span>
        </div>
      )}

      {/* 2. Primary Page Router View */}
      <div className={`flex-1 flex flex-col ${currentRoute === 'around-me' ? 'pt-[104px] md:pt-20' : 'pt-[104px] md:pt-20'}`}>
        {/* NON-AUTHENTICATED ROUTE GATING: Only landing or auth are accessible to non-users */}
        {!user ? (
          currentRoute === 'auth' ? (
            <AuthPage
              initialMode={authInitialMode}
              initialState={authTargetState}
              initialDistrict={authTargetDistrict}
              onSuccess={handleAuthSuccess}
              onCancel={() => setCurrentRoute('landing')}
            />
          ) : (
            <LandingPage
              onStartExploring={() => openAuthPage('signup')}
              onNavigateToMap={() => openAuthPage('signup')}
              onNavigateToAuth={() => openAuthPage('signin')}
              onNavigateToPassport={() => openAuthPage('signup')}
              onSelectSite={(_site) => openAuthPage('signup')}
              onSelectCityForAuth={(state, district) => openAuthPage('signup', state, district)}
              featuredSites={sites}
              publishedStates={publishedStatesList}
            />
          )
        ) : (
          /* AUTHENTICATED ROUTES */
          <>
            {currentRoute === 'home' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
                <HomeDashboard
                  cityId={selectedDistrict.id}
                  cityName={selectedDistrict.name}
                  userName={user.name}
                  coverImage={selectedDistrict.coverImage}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onViewMonograph={handleViewMonograph}
                  onNavigateToMap={() => setCurrentRoute('around-me')}
                  onNavigateToExplore={() => setCurrentRoute('explore')}
                  onOpenSection={(slug, title) => {
                    setActiveSectionSlug(slug);
                    setActiveSectionTitle(title);
                    setCurrentRoute('section');
                  }}
                />
              </div>
            )}

            {currentRoute === 'section' && (
              <CitySectionPage
                cityId={selectedDistrict.id}
                cityName={selectedDistrict.name}
                sectionSlug={activeSectionSlug}
                sectionTitle={activeSectionTitle}
                onBack={() => setCurrentRoute('home')}
                onSelectSite={handleViewMonograph}
                favorites={favorites}
                onToggleFavorite={(id) => toggleFavorite(id)}
                onGetDirections={handleGetDirections}
              />
            )}

            {currentRoute === 'around-me' && (
              <AroundMeMap
                sites={sites}
                selectedSite={selectedSite}
                onSelectSite={(site) => setSelectedSite(site)}
                onViewMonograph={handleViewMonograph}
                onGetDirections={handleGetDirections}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onExploreCategory={(_category) => {
                  setCurrentRoute('explore');
                }}
                onOpenStateDistrictModal={() => setIsStateDistrictModalOpen(true)}
                selectedDistrictName={selectedDistrict.name}
                selectedStateCode={selectedState.code}
                customMapCenter={mapCenterCoords}
              />
            )}

            {currentRoute === 'monograph' && (
              <MonographDetail
                site={selectedSite}
                onBack={() => setCurrentRoute('home')}
                isSavedToPassport={favorites.includes(selectedSite.id)}
                onToggleSavePassport={toggleFavorite}
                onOpenMediaModal={(media) => setActiveMediaModal(media)}
                onOpenDirections={handleGetDirections}
                onNavigatePassport={() => setCurrentRoute('passport')}
              />
            )}

            {currentRoute === 'explore' && (
              <ExploreSearch
                sites={sites}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onViewMonograph={handleViewMonograph}
              />
            )}

            {currentRoute === 'passport' && (
              <PassportView
                user={user}
                onUpdateUser={async (name) => {
                  if (!userToken) return;
                  const updated = await updateUserProfile(userToken, { name });
                  setUser(updated);
                  localStorage.setItem('indian_heritage_user', JSON.stringify(updated));
                }}
                savedSites={savedSitesList}
                onToggleFavorite={toggleFavorite}
                onViewMonograph={handleViewMonograph}
                onExploreMore={() => setCurrentRoute('explore')}
                onNavigateToMap={() => setCurrentRoute('around-me')}
                onOpenStateDistrictModal={() => setIsStateDistrictModalOpen(true)}
                selectedStateCode={selectedState.code}
                selectedDistrictName={selectedDistrict.name}
              />
            )}

            {currentRoute === 'landing' && (
              <LandingPage
                onStartExploring={() => setCurrentRoute('home')}
                onNavigateToMap={() => setCurrentRoute('around-me')}
                onNavigateToAuth={() => setCurrentRoute('passport')}
                onNavigateToPassport={() => setCurrentRoute('passport')}
                onSelectSite={handleViewMonograph}
                featuredSites={sites}
                publishedStates={publishedStatesList}
              />
            )}

            {currentRoute === 'auth' && (
              <AuthPage
                initialMode={authInitialMode}
                onSuccess={handleAuthSuccess}
                onCancel={() => setCurrentRoute('home')}
              />
            )}
          </>
        )}
      </div>

      {/* 3. Global Footer (Hidden in full-screen Around Me GIS map mode to preserve viewport) */}
      {currentRoute !== 'around-me' && currentRoute !== 'auth' && (
        <Footer onNavigate={(route) => {
          if (!user && route !== 'landing' && route !== 'auth') {
            openAuthPage('signin');
          } else {
            setCurrentRoute(route);
          }
        }} />
      )}

      {/* 4. Interactive Video / Media Player Modal */}
      {activeMediaModal && (
        <MediaModal
          media={activeMediaModal}
          onClose={() => setActiveMediaModal(null)}
        />
      )}

      {/* 5. Navigation & Directions Modal */}
      {directionsSite && (
        <DirectionsModal
          site={directionsSite}
          onClose={() => setDirectionsSite(null)}
        />
      )}

      {/* 6. Saved Heritage Sites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesDrawerOpen}
        onClose={() => setIsFavoritesDrawerOpen(false)}
        savedSites={savedSitesList}
        onRemoveFavorite={toggleFavorite}
        onViewMonograph={handleViewMonograph}
        onOpenDirections={handleGetDirections}
      />

      {/* 7. State & District Select Directory Modal */}
      <StateDistrictModal
        isOpen={isStateDistrictModalOpen}
        onClose={() => setIsStateDistrictModalOpen(false)}
        selectedStateId={selectedState.id}
        selectedDistrictId={selectedDistrict.id}
        publishedStates={publishedStatesList}
        onSelectDistrict={handleSelectDistrict}
      />
    </div>
  );
}
