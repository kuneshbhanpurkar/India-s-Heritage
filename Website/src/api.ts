import { HeritageSite, MediaItem } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed with status ${response.status}`);
    return body as T;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(`Unable to connect to Dharohar backend at ${API_BASE}. Please ensure backend is running.`);
    }
    throw err;
  }
}

export interface PublicState {
  _id: string;
  name: string;
  code: string;
  slug?: string;
  active: boolean;
}

export interface PublicCity {
  _id: string;
  id?: string;
  stateId: string;
  name: string;
  slug?: string;
  active: boolean;
  coverImage?: string;
  description?: string;
  coordinates?: { lat: number; lng: number };
}

export type PublicDistrict = PublicCity;

export interface SectionSummary {
  slug: string;
  title: string;
  type: string;
  description: string;
  totalCount: number;
  items: HeritageSiteCard[];
}

export interface HeritageSiteCard {
  id: string;
  _id?: string;
  title: string;
  name?: string;
  slug: string;
  cityId?: string;
  section: string;
  image: string;
  subTitle?: string;
  category?: string;
  rating?: number;
  reviewsCount?: string;
  builtYear?: string;
  dynasty?: string;
  openingHours?: string;
  distanceKm?: number;
  distanceDisplay?: string;
  isFeatured?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CityOverviewResponse {
  city: {
    id: string;
    name: string;
    slug?: string;
    coordinates?: { lat: number; lng: number };
    description?: string;
  };
  sections: SectionSummary[];
}

export interface SectionContentResponse {
  city: {
    id: string;
    name: string;
    slug?: string;
  };
  section: {
    slug: string;
    title: string;
    type: string;
    description: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  items: HeritageSiteCard[];
}

export interface UserProfileResponse {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  stateId?: string;
  cityId?: string;
  state: string;
  district: string;
}

// 1. States & Cities
export const getStates = () => request<PublicState[]>('/api/public/states');
export const getCities = (stateId: string) => request<PublicCity[]>(`/api/public/states/${stateId}/cities`);
export const getDistricts = (stateId: string) => request<PublicCity[]>(`/api/public/states/${stateId}/districts`);
export const getCity = (cityId: string) => request<PublicCity>(`/api/public/cities/${cityId}`);

// 2. City 5-Section Architecture
export const getCitySections = (cityId: string) => request<CityOverviewResponse>(`/api/public/cities/${cityId}/sections`);
export const getCitySectionContent = (cityId: string, sectionSlug: string, page = 1, limit = 12) =>
  request<SectionContentResponse>(`/api/public/cities/${cityId}/sections/${sectionSlug}?page=${page}&limit=${limit}`);

// 3. Content Details & Around Me
export const getContentDetails = (idOrSlug: string) => request<HeritageSite>(`/api/public/content/${idOrSlug}`);
export const getNearby = (lat: number, lng: number, km = 25) => request<HeritageSiteCard[]>(`/api/public/nearby?lat=${lat}&lng=${lng}&km=${km}`);

// 4. Authentication & User Profile
export const loginUser = (email: string, password: string) =>
  request<{ token: string; user: UserProfileResponse }>('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const registerUser = (body: {
  name: string;
  email: string;
  password: string;
  state?: string;
  district?: string;
  stateId?: string;
  cityId?: string;
}) =>
  request<{ token: string; user: UserProfileResponse }>('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getUserProfile = (token: string) =>
  request<UserProfileResponse>('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });

export const updateUserProfile = (token: string, body: { name?: string; stateId?: string; cityId?: string }) =>
  request<UserProfileResponse>('/api/users/me', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });

// Backward compatibility helpers
export const getContent = (districtId?: string) =>
  request<HeritageSiteCard[]>(`/api/public/content${districtId ? `?cityId=${encodeURIComponent(districtId)}` : ''}`);

const sectionCategoryMap: Record<string, HeritageSite['categoryType']> = {
  'popular-places': 'popular',
  'hidden-places': 'hidden',
  'cultural-folk': 'cultural',
  'regional-festivals': 'festivals',
  'living-culture': 'living',
};

export const toHeritageSite = (card: HeritageSiteCard, district?: PublicCity): HeritageSite => {
  const mediaItems: MediaItem[] = card.image
    ? [
        {
          id: `${card.id}-m1`,
          title: card.title || card.name || 'Heritage Monument',
          category: 'Archival Photography',
          badge: 'Verified Image',
          duration: '',
          image: card.image,
          description: card.subTitle || '',
          meta: 'Official ASI Archive Record',
        },
      ]
    : [];

  return {
    id: card.id,
    name: card.title || card.name || '',
    subTitle: card.subTitle || '',
    category: card.category || 'Heritage',
    categoryType: sectionCategoryMap[card.section] || 'popular',
    dynasty: card.dynasty || 'Indian Heritage',
    location: district?.name || 'Madhya Pradesh',
    coordinates: {
      lat: card.latitude || district?.coordinates?.lat || 0,
      lng: card.longitude || district?.coordinates?.lng || 0,
      mapLeftPercent: '50%',
      mapTopPercent: '50%',
    },
    distanceKm: Number(card.distanceKm || 0),
    distanceDisplay: card.distanceDisplay || district?.name || '',
    rating: Number(card.rating || 4.5),
    reviewsCount: card.reviewsCount || '1,200 reviews',
    image: card.image,
    description: card.subTitle || '',
    openingHours: card.openingHours || '09:00 AM - 05:00 PM',
    statusBadge: 'Verified Monument',
    verifiedType: 'asi',
    directionTimeMinutes: 15,
    hasAudio: true,
    builtYear: card.builtYear || 'Historical',
    mediaItems,
    visitorTariffs: [{ category: 'General Entry', price: '₹25' }],
    transitOptions: [{ mode: 'Metro / Auto', detail: 'Convenient local transit available', etaMinutes: 10, fare: '₹20' }],
  };
};
