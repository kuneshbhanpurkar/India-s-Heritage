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
  title: string;
  slug: string;
  section?: string;
  status: 'draft' | 'review' | 'published' | 'hidden';
  featured?: boolean;
  districtId: string;
  categoryId: string;
  latitude?: number;
  longitude?: number;
  location?: { type: string; coordinates: [number, number] };
  fields?: Record<string, unknown>;
  media?: Array<{ type: string; url: string; alt?: string }>;
}

export interface AdminSummary {
  content: { total: number; published: number; draft: number; review: number; hidden: number };
  admins: { total: number; active: number; superAdmins: number; editors: number; reviewers: number };
  users: { active: number };
  coverage: { activeStates: number; activeDistricts: number };
  categories: number;
  ledger: Array<{ code: string; state: string; district: string; activeCategories: string; published: number; draft: number; isHighlighted?: boolean }>;
}

export const loginAdmin = (email: string, password: string) =>
  request<{ token: string; admin: { id: string; name: string; email: string; role: 'super_admin' | 'editor' | 'reviewer' } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getAdminContent = (token: string, districtId?: string, section?: string) =>
  request<ApiContent[]>(
    `/api/admin/content?${districtId ? `districtId=${encodeURIComponent(districtId)}&` : ''}${section ? `section=${encodeURIComponent(section)}` : ''}`,
    {},
    token
  );
export const getAdminSummary = (token: string, districtId?: string) => request<AdminSummary>(`/api/admin/summary${districtId ? `?districtId=${encodeURIComponent(districtId)}` : ''}`, {}, token);
export const getAdminStates = (token: string) => request<Array<{ _id: string; name: string; code: string }>>('/api/admin/states', {}, token);
export const getAdminDistricts = (token: string, stateId: string) => request<Array<{ _id: string; name: string; stateId: string; coverImage?: string }>>(`/api/admin/states/${encodeURIComponent(stateId)}/districts`, {}, token);
export const updateAdminDistrict = (token: string, id: string, body: { coverImage?: string }) => request<{ _id: string; coverImage?: string }>(`/api/admin/districts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }, token);
export const createAdminState = (token: string, body: { name: string; code: string; active: boolean }) => request<{ _id: string; name: string; code: string }>('/api/admin/states', { method: 'POST', body: JSON.stringify(body) }, token);
export const createAdminDistrict = (token: string, body: { stateId: string; name: string; active: boolean }) => request<{ _id: string; name: string; stateId: string }>('/api/admin/districts', { method: 'POST', body: JSON.stringify(body) }, token);
export const updateAdminDistrictCategory = (token: string, districtId: string, categoryId: string, enabled: boolean) => request<{ enabled: boolean }>(`/api/admin/district-categories/${encodeURIComponent(districtId)}/${encodeURIComponent(categoryId)}`, { method: 'PUT', body: JSON.stringify({ enabled }) }, token);
export const getAdminDistrictCategories = (token: string, districtId: string, categoryId: string) => request<Array<{ enabled: boolean }>>(`/api/admin/district-categories?districtId=${encodeURIComponent(districtId)}&categoryId=${encodeURIComponent(categoryId)}`, {}, token);
export const createContent = (token: string, body: Record<string, unknown>) =>
  request<ApiContent>('/api/admin/content', { method: 'POST', body: JSON.stringify(body) }, token);
export const updateContent = (token: string, id: string, body: Record<string, unknown>) =>
  request<ApiContent>(`/api/admin/content/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token);
export const deleteContent = (token: string, id: string) =>
  request<void>(`/api/admin/content/${id}`, { method: 'DELETE' }, token);

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
  const status = item.status === 'published' ? 'Published' : item.status === 'review' ? 'Verification Pending' : 'Draft (In Curation)';
  const lat = item.latitude !== undefined ? item.latitude : (fields.latitude as number | undefined);
  const lng = item.longitude !== undefined ? item.longitude : (fields.longitude as number | undefined);
  return {
    id: item._id,
    name: item.title,
    code: String(fields.code || `#${item.slug.toUpperCase()}`),
    category: (fields.category || 'Other') as HeritagePlace['category'],
    city: String(fields.city || ''),
    subLocation: String(fields.subLocation || ''),
    status,
    imageUrl: String(fields.imageUrl || item.media?.find((media) => media.type === 'image')?.url || ''),
    description: String(fields.description || ''),
    openingHours: String(fields.openingHours || ''),
    builtYear: String(fields.builtYear || ''),
    dynasty: String(fields.dynasty || ''),
    subTitle: String(fields.subTitle || ''),
    visitorTariffs: fields.visitorTariffs as any,
    media: item.media,
    latitude: lat,
    longitude: lng,
  };
};

export const toContentPayload = (place: Partial<HeritagePlace>, districtId: string, categoryId: string, media: Array<{ type: string; url: string; alt?: string }> = []) => ({
  districtId,
  cityId: districtId,
  categoryId,
  section: categoryId || 'popular-places',
  title: place.name,
  status: place.status === 'Published' ? 'published' : place.status === 'Verification Pending' ? 'review' : 'draft',
  latitude: place.latitude,
  longitude: place.longitude,
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
  },
  media: place.media || media,
});

export type { VideoRecord, PdfDocument };
