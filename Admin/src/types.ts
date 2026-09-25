export type ViewType = 'dashboard' | 'section' | 'popular-places' | 'add-record' | 'manage-admins' | 'category' | 'signin';

export type RecordStep = 1 | 2 | 3;

export interface HeritagePlace {
  id: string;
  name: string;
  code: string;
  category: 'Fort' | 'Temple' | 'Palace' | 'Stepwell' | 'Museum' | 'Monument' | 'Haveli' | 'Water Fort' | 'Cultural Heritage' | 'Other';
  city: string;
  subLocation: string;
  status: 'Published' | 'Draft (In Curation)' | 'Draft (Missing GIS)' | 'Verification Pending';
  imageUrl: string;
  description?: string;
  openingHours?: string;
  builtYear?: string;
  dynasty?: string;
  subTitle?: string;
  visitorTariffs?: Array<{ category: string; price: string; note?: string; highlight?: boolean }>;
  media?: Array<{ type: string; url: string; alt?: string }>;
  latitude?: number;
  longitude?: number;
}

export interface VideoRecord {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  duration: string;
  quality: '4K UHD' | '1080p' | '720p';
  status: 'Active / Live' | 'Processing';
  thumbnail: string;
}

export interface PdfDocument {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  fileSize: string;
  pages: string;
  status: 'Active / Live' | 'Draft';
}

export interface AdminOfficer {
  id: string;
  name: string;
  code: string;
  designation: string;
  role: 'Super Admin' | 'Circle Admin' | 'Archival Auditor';
  status: 'Active' | 'Pending Review' | 'Suspended';
  avatar?: string;
  initials?: string;
  circle: string;
  email: string;
  active?: boolean;
}

export interface StateDistrict {
  state: string;
  districts: string[];
}

export interface MetricItem {
  id?: string;
  title: string;
  value: string | number;
  subValue?: string;
  icon: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'emerald' | 'amber' | 'tertiary' | 'primary' | 'neutral';
    pulse?: boolean;
  };
  actionLabel?: string;
  onClick?: () => void;
  hoverBorderClass?: string;
  valueColorClass?: string;
  iconContainerClass?: string;
}

export interface FilterTabItem<T = string> {
  id: T;
  label: string;
  count?: number | string;
  dotColor?: string;
  badgeClass?: string;
}

export interface JurisdictionLedgerItem {
  code: string;
  state: string;
  district: string;
  activeCategories: string;
  published: number;
  draft: number;
  isHighlighted?: boolean;
}

