export type ViewType = 'dashboard' | 'section' | 'add-record' | 'manage-admins' | 'signin';

export type RecordStep = 1 | 2 | 3 | 4;

export interface MediaItemData {
  _id?: string;
  id?: string;
  type: 'image' | 'video' | 'pdf' | 'audio';
  url: string;
  title?: string;
  caption?: string;
  alt?: string;
  source?: string;
  license?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface DocumentItemData {
  _id?: string;
  id?: string;
  title: string;
  type?: string;
  url: string;
  author?: string;
  publisher?: string;
  source?: string;
  license?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface SourceItemData {
  _id?: string;
  id?: string;
  sourceTitle: string;
  sourceUrl?: string;
  publisher?: string;
  attribution?: string;
  license?: string;
  verificationNotes?: string;
}

export interface HeritagePlace {
  id: string;
  _id?: string;
  name: string;
  title?: string;
  code: string;
  category: string;
  section: string;
  city: string;
  cityName?: string;
  subLocation?: string;
  status: 'Published' | 'Draft (In Curation)' | 'Verification Pending' | 'Hidden' | 'Archived' | string;
  imageUrl?: string;
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  subTitle?: string;
  fields?: Record<string, any>;
  media?: MediaItemData[];
  documents?: DocumentItemData[];
  sources?: SourceItemData[];
  latitude?: number;
  longitude?: number;
  districtId?: string;
  stateId?: string;
  visualsMediaEnabled?: boolean;
  bookEnabled?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  thumbnail?: string;
}

export interface PdfDocument {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  fileSize?: string;
  publisher?: string;
}

export interface AdminOfficer {
  id: string;
  _id?: string;
  name: string;
  code: string;
  designation: string;
  role: 'super_admin' | 'admin' | 'editor' | 'reviewer' | 'state_admin' | 'district_admin' | string;
  status: 'Active' | 'Pending Review' | 'Suspended' | string;
  avatar?: string;
  initials?: string;
  circle?: string;
  email: string;
  state?: string;
  district?: string;
  stateId?: string;
  cityId?: string;
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
  id?: string;
  code: string;
  state: string;
  district: string;
  activeCategories: string;
  published: number;
  draft: number;
  review?: number;
  total?: number;
  isHighlighted?: boolean;
}
