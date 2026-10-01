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
  shortDescription?: string;
  fullDescription?: string;
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
  mediaItems?: Array<{
    id: string;
    title: string;
    category: string;
    badge: string;
    duration: string;
    image: string;
    videoUrl?: string;
    description: string;
    meta: string;
  }>;
  documents?: Array<{ title: string; type?: string; url: string; author?: string; publisher?: string }>;
  sources?: Array<{ sourceTitle: string; sourceUrl?: string; publisher?: string }>;
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
  'heritage-places': 'popular',
  'popular-places': 'popular',
  'hidden-places': 'hidden',
  'culture-traditions': 'cultural',
  'cultural-folk': 'cultural',
  'regional-festivals': 'festivals',
  'living-traditions': 'living',
  'living-culture': 'living',
  'arts-folk': 'cultural',
  'dance-traditions': 'cultural',
  'arts-crafts': 'cultural',
  'food-markets': 'living',
  'culinary-heritage': 'living',
};

export const toHeritageSite = (card: HeritageSiteCard, district?: PublicCity): HeritageSite => {
  // Use real mediaItems from DB; fall back to cover image only if no media
  const dbMediaItems = card.mediaItems && card.mediaItems.length > 0 ? card.mediaItems : null;
  const fallbackMedia: MediaItem[] = card.image
    ? [{
        id: `${card.id}-m1`,
        title: card.title || card.name || 'Heritage Monument',
        category: 'Archival Photography',
        badge: 'Verified Image',
        duration: '',
        image: card.image,
        description: card.subTitle || '',
        meta: 'Official ASI Archive Record',
      }]
    : [];

  const mediaItems: MediaItem[] = dbMediaItems
    ? dbMediaItems.map((m) => ({
        id: m.id,
        title: m.title,
        category: m.category as MediaItem['category'],
        badge: m.badge,
        duration: m.duration,
        image: m.image,
        videoUrl: m.videoUrl,
        description: m.description,
        meta: m.meta,
      }))
    : fallbackMedia;

  // Derive dynamic visitor tariffs
  let visitorTariffs = (card as any).visitorTariffs;
  if (!visitorTariffs || visitorTariffs.length === 0) {
    const fee = (card as any).fields?.entryFee;
    if (fee && typeof fee === 'object') {
      visitorTariffs = [];
      if (fee.domestic) visitorTariffs.push({ category: 'Indian Citizens', price: `₹${fee.domestic}`, highlight: true });
      if (fee.student) visitorTariffs.push({ category: 'Students', price: `₹${fee.student}` });
      if (fee.foreign) visitorTariffs.push({ category: 'Foreign Visitors', price: `₹${fee.foreign}` });
    } else if (typeof fee === 'string' && fee.trim()) {
      visitorTariffs = [{ category: 'General Entry', price: fee.startsWith('₹') ? fee : `₹${fee}`, highlight: true }];
    } else {
      visitorTariffs = [{ category: 'General Entry', price: '₹25', highlight: true }];
    }
  }

  return {
    id: card.id,
    name: card.title || card.name || '',
    subTitle: card.subTitle || '',
    category: card.category || 'Heritage',
    categoryType: sectionCategoryMap[card.section] || 'popular',
    dynasty: card.dynasty || (card as any).fields?.builtBy || 'Indian Heritage',
    location: district?.name || (card as any).districtName || (card as any).cityName || 'Madhya Pradesh',
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
    description: card.fullDescription || card.shortDescription || card.subTitle || '',
    openingHours: card.openingHours || (card as any).fields?.timings || '09:00 AM - 05:00 PM',
    statusBadge: 'Verified Monument',
    verifiedType: 'asi',
    directionTimeMinutes: 15,
    hasAudio: mediaItems.some((m) => m.category === 'Sound & Light'),
    builtYear: card.builtYear || (card as any).fields?.era || 'Historical',
    mediaItems,
    visitorTariffs,
    transitOptions: [{ mode: 'Metro / Auto', detail: 'Convenient local transit available', etaMinutes: 10, fare: '₹20' }],
  };
};
