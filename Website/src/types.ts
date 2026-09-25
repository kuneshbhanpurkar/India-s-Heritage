export type PageRoute = 'landing' | 'home' | 'explore' | 'around-me' | 'passport' | 'monograph' | 'auth' | 'section';

export interface UserProfile {
  name: string;
  email: string;
  state: string;
  district: string;
  stateId?: string;
  cityId?: string;
  role?: string;
  patronId?: string;
  joinedDate?: string;
}

export interface HeritageSite {
  id: string;
  name: string;
  subTitle?: string;
  category: string;
  categoryType: 'popular' | 'hidden' | 'cultural' | 'festivals' | 'living';
  dynasty: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
    mapLeftPercent: string;
    mapTopPercent: string;
  };
  distanceKm: number;
  distanceDisplay: string;
  rating: number;
  reviewsCount: string;
  image: string;
  description: string;
  openingHours: string;
  statusBadge?: string;
  verifiedType?: 'ASI Verified' | 'State Heritage' | 'UNESCO' | 'Night Bazaar' | 'asi';
  directionTimeMinutes: number;
  hasAudio?: boolean;
  builtYear?: string;
  mediaItems?: MediaItem[];
  visitorTariffs?: VisitorTariff[];
  transitOptions?: TransitOption[];
}

export interface MediaItem {
  id: string;
  title: string;
  category: 'Archival Photography' | 'Documentary Films' | '360° Photogrammetry' | 'Sound & Light' | 'Artisan Short' | 'Drone Tour' | string;
  badge: string;
  duration: string;
  image: string;
  description: string;
  meta: string;
  videoUrl?: string;
}

export interface VisitorTariff {
  category: string;
  price: string;
  note?: string;
  highlight?: boolean;
}

export interface TransitOption {
  type?: string;
  mode?: string;
  icon?: string;
  title?: string;
  detail: string;
  etaMinutes?: number;
  fare?: string;
}
