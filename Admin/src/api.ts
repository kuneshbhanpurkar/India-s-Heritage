import { CitySectionConfig } from './config/sections';
import { AdminOfficer, HeritagePlace, PdfDocument, VideoRecord } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body as T;
}

export interface ApiContent {
  _id: string;
  id?: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  fullDescription?: string;
  slug: string;
  section?: string;
  status: 'draft' | 'review' | 'published' | 'hidden' | 'archived';
  featured?: boolean;
  isFeatured?: boolean;
  districtId: string;
  cityId?: string;
  cityName?: string;
  stateId?: string;
  stateName?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  location?: { type: string; coordinates: [number, number] };
  fields?: Record<string, unknown>;
  media?: Array<{ type: string; url: string; alt?: string; title?: string; caption?: string }>;
  documents?: Array<{ title?: string; type?: string; url?: string; author?: string; publisher?: string }>;
  sources?: Array<{ sourceTitle?: string; sourceUrl?: string; publisher?: string }>;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface AdminSummary {
  content: { total: number; published: number; draft: number; review: number; hidden: number; archived?: number; featured?: number };
  admins: { total: number; active: number; superAdmins: number; editors: number; reviewers: number; stateAdmins?: number; districtAdmins?: number };
  users: { active: number };
  coverage: { activeStates: number; activeDistricts: number };
  categories: number;
  ledger: Array<{ id?: string; code: string; state: string; district: string; activeCategories: string; published: number; draft: number; review?: number; total?: number; isHighlighted?: boolean }>;
}

export const loginAdmin = (email: string, password: string) =>
  request<{ token: string; admin: { id: string; name: string; email: string; role: 'super_admin' | 'editor' | 'reviewer' } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getAdminContent = (token: string, districtId?: string, section?: string, search?: string) => {
  const params = new URLSearchParams();
  if (districtId) params.append('districtId', districtId);
  if (section) params.append('section', section);
  if (search) params.append('search', search);
  return request<ApiContent[]>(`/api/admin/content?${params.toString()}`, {}, token);
};

export const getContentById = (token: string, id: string) =>
  request<ApiContent>(`/api/admin/content/${encodeURIComponent(id)}`, {}, token);

export const getAdminSummary = (token: string, districtId?: string) =>
  request<AdminSummary>(`/api/admin/summary${districtId ? `?districtId=${encodeURIComponent(districtId)}` : ''}`, {}, token);

export const getAdminStates = (token: string) =>
  request<Array<{ _id: string; name: string; code: string }>>('/api/admin/states', {}, token);

export const getAdminDistricts = (token: string, stateId: string) =>
  request<Array<{ _id: string; name: string; stateId: string; coverImage?: string }>>(`/api/admin/states/${encodeURIComponent(stateId)}/districts`, {}, token);

export const updateAdminDistrict = (token: string, id: string, body: { coverImage?: string }) =>
  request<{ _id: string; coverImage?: string }>(`/api/admin/districts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }, token);

export const createAdminState = (token: string, body: { name: string; code: string; active: boolean }) =>
  request<{ _id: string; name: string; code: string }>('/api/admin/states', { method: 'POST', body: JSON.stringify(body) }, token);

export const createAdminDistrict = (token: string, body: { stateId: string; name: string; active: boolean }) =>
  request<{ _id: string; name: string; stateId: string }>('/api/admin/districts', { method: 'POST', body: JSON.stringify(body) }, token);

export const deleteAdminState = (token: string, id: string) =>
  request<void>(`/api/admin/states/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);

export const deleteAdminDistrict = (token: string, id: string) =>
  request<void>(`/api/admin/districts/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);

export const getAdminDistrictCategories = (token: string, districtId: string) =>
  request<Array<CitySectionConfig & { enabled: boolean }>>(`/api/admin/district-categories?districtId=${encodeURIComponent(districtId)}`, {}, token);

export const updateAdminDistrictCategory = (token: string, districtId: string, categorySlug: string, enabled: boolean) =>
  request<{ success: boolean; districtId: string; categorySlug: string; enabled: boolean }>(
    `/api/admin/district-categories/${encodeURIComponent(districtId)}/${encodeURIComponent(categorySlug)}`,
    { method: 'PUT', body: JSON.stringify({ enabled }) },
    token
  );

export const createContent = (token: string, body: Record<string, unknown>) =>
  request<ApiContent>('/api/admin/content', { method: 'POST', body: JSON.stringify(body) }, token);

export const updateContent = (token: string, id: string, body: Record<string, unknown>) =>
  request<ApiContent>(`/api/admin/content/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }, token);

export const patchContentStatus = (token: string, id: string, status: string) =>
  request<{ success: boolean; id: string; status: string }>(`/api/admin/content/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);

export const deleteContent = (token: string, id: string) =>
  request<void>(`/api/admin/content/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);

export const getAdminOfficers = async (token: string) => {
  const admins = await request<Array<{ _id: string; name: string; email: string; role: 'super_admin' | 'editor' | 'reviewer'; active: boolean }>>('/api/admin/admins', {}, token);
  return admins.map(mapAdminOfficer);
};

export const mapAdminOfficer = (admin: { _id?: string; id?: string; name: string; email: string; role: 'super_admin' | 'editor' | 'reviewer'; active: boolean }): AdminOfficer => {
  const id = admin._id || admin.id || '';
  return {
    id,
    name: admin.name,
    email: admin.email,
    code: `#ADM-${id.slice(-4).toUpperCase()}`,
    designation: admin.role === 'super_admin' ? 'Director General' : 'Circle Administrator',
    role: admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'reviewer' ? 'Archival Auditor' : 'Circle Admin',
    status: admin.active ? 'Active' : 'Suspended',
    circle: 'National Portal',
  };
};

export const createAdminOfficer = (token: string, body: Record<string, unknown>) =>
  request<{ id: string; name: string; email: string; role: 'super_admin' | 'editor' | 'reviewer'; active: boolean }>('/api/admin/admins', { method: 'POST', body: JSON.stringify(body) }, token).then(mapAdminOfficer);

export const updateAdminOfficer = (token: string, id: string, body: Record<string, unknown>) =>
  request<{ id: string; name: string; email: string; role: 'super_admin' | 'editor' | 'reviewer'; active: boolean }>(`/api/admin/admins/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token).then(mapAdminOfficer);

export const toHeritagePlace = (item: ApiContent): HeritagePlace => {
  const fields = item.fields || {};
  const status =
    item.status === 'published'
      ? 'Published'
      : item.status === 'review'
      ? 'Verification Pending'
      : item.status === 'hidden'
      ? 'Hidden'
      : item.status === 'archived'
      ? 'Archived'
      : 'Draft (In Curation)';
  const lat = item.latitude !== undefined ? item.latitude : (fields.latitude as number | undefined);
  const lng = item.longitude !== undefined ? item.longitude : (fields.longitude as number | undefined);
  const districtId = item.districtId || item.cityId || '';
  const cityName = item.cityName || String(fields.city || '');

  return {
    id: item._id,
    name: item.title,
    code: String(fields.code || `#${item.slug.toUpperCase()}`),
    category: (fields.category || 'Other') as HeritagePlace['category'],
    city: cityName,
    subLocation: String(fields.subLocation || ''),
    status,
    imageUrl: String(fields.imageUrl || item.media?.find((media) => media.type === 'image')?.url || ''),
    description: String(item.shortDescription || fields.description || ''),
    openingHours: String(fields.openingHours || ''),
    builtYear: String(fields.builtYear || ''),
    dynasty: String(fields.dynasty || ''),
    subTitle: String(item.subtitle || fields.subTitle || ''),
    visitorTariffs: fields.visitorTariffs as any,
    media: item.media || [],
    latitude: lat,
    longitude: lng,
    section: item.section || 'popular-places',
    districtId,
    stateId: item.stateId,
    visualsMediaEnabled: fields.visualsMediaEnabled !== false,
    bookEnabled: fields.bookEnabled !== false,
  };
};

export const toContentPayload = (
  place: Partial<HeritagePlace>,
  districtId: string,
  categoryId: string,
  media: Array<{ type: string; url: string; alt?: string }> = []
) => ({
  districtId,
  cityId: districtId,
  categoryId,
  section: categoryId || place.section || 'popular-places',
  title: place.name,
  subtitle: place.subTitle || '',
  shortDescription: place.description || '',
  fullDescription: place.description || '',
  status: place.status === 'Published' ? 'published' : place.status === 'Verification Pending' ? 'review' : 'draft',
  latitude: place.latitude,
  longitude: place.longitude,
  mediaEnabled: place.visualsMediaEnabled !== false,
  documentsEnabled: place.bookEnabled !== false,
  fields: {
    code: place.code,
    category: place.category,
    city: place.city,
    subLocation: place.subLocation,
    imageUrl: place.imageUrl,
    description: place.description,
    openingHours: place.openingHours,
    builtYear: place.builtYear,
    dynasty: place.dynasty,
    subTitle: place.subTitle,
    visitorTariffs: place.visitorTariffs,
    latitude: place.latitude,
    longitude: place.longitude,
    visualsMediaEnabled: place.visualsMediaEnabled !== false,
    bookEnabled: place.bookEnabled !== false,
  },
  media: place.media || media,
});

export type { VideoRecord, PdfDocument };
