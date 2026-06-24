import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

const getToken = () => AsyncStorage.getItem('auth_token');

export const normalizeImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('/')) {
    // Relative URL — prepend the API base (strip the /api suffix).
    const apiBase = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${apiBase}${url}`;
  }
  return url.replace(/https?:\/\/[\d.a-zA-Z-]+:\d+/g, API_BASE_URL.replace(/\/api\/?$/, ''));
};

const request = async (method: string, path: string, body?: any) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

const uploadFile = async (fileUri: string, fileName: string, mimeType: string): Promise<string> => {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: mimeType } as any);
  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url as string;
};

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('POST', '/admin/auth/login', { email, password }),

  // Leads — unwrap paginated response to plain array
  getLeads: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return request('GET', `/leads${qs}`).then((r: any) => Array.isArray(r) ? r : (r.data || []));
  },
  getLead: (id: string) => request('GET', `/leads/${id}`),
  createLead: (data: any) => request('POST', '/leads', data),
  updateLead: (id: string, data: any) => request('PATCH', `/leads/${id}`, data),
  deleteLead: (id: string) => request('DELETE', `/leads/${id}`),
  getLeadStats: () => request('GET', '/leads/stats'),
  assignLogin: (leadId: string, data: any) => request('POST', `/leads/${leadId}/assign-login`, data),

  // Properties — unwrap paginated response to plain array
  getProperties: (params?: { page?: number; limit?: number; status?: string; district?: string; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return request('GET', `/properties${qs}`).then((r: any) => Array.isArray(r) ? r : (r.data || []));
  },
  getProperty: (id: string) => request('GET', `/properties/${id}`),
  createProperty: (data: any) => request('POST', '/properties', data),
  updateProperty: (id: string, data: any) => request('PATCH', `/properties/${id}`, data),
  deleteProperty: (id: string) => request('DELETE', `/properties/${id}`),
  getPropertyStats: () => request('GET', '/properties/stats'),

  // Users
  getUsers: () => request('GET', '/users'),
  createUser: (data: any) => request('POST', '/users', data),
  changePassword: (data: any) => request('POST', '/users/change-password', data),

  // Site Visits
  getSiteVisits: () => request('GET', '/site-visits'),
  createSiteVisit: (data: any) => request('POST', '/site-visits', data),
  updateSiteVisit: (id: string, data: any) => request('PUT', `/site-visits/${id}`, data),
  deleteSiteVisit: (id: string) => request('DELETE', `/site-visits/${id}`),

  // Dashboard
  getDashboard: () => request('GET', '/dashboard'),

  // Messages (Chat)
  getMessages: (leadId: string) => request('GET', `/leads/${leadId}/messages`),
  sendMessage: (leadId: string, text: string, sender: string) =>
    request('POST', `/leads/${leadId}/messages`, { text, sender }),
  deleteMessage: (leadId: string, msgId: string) =>
    request('DELETE', `/leads/${leadId}/messages/${msgId}`),
  deleteAllMessages: (leadId: string) =>
    request('DELETE', `/leads/${leadId}/messages`),

  // Notifications
  getAdminNotifications: () => request('GET', '/notifications/admin'),
  markNotificationRead: (id: string) => request('PUT', `/notifications/${id}/read`, {}),
  markAllAdminRead: () => request('PUT', '/notifications/mark-all-read', { role: 'admin' }),
  deleteNotifications: (ids: string[]) => request('POST', '/notifications/delete-many', { ids }),
  acceptVisitReschedule: (visitId: string) => request('POST', `/notifications/visits/${visitId}/accept`, {}),
  denyVisitReschedule: (visitId: string, reason: string) => request('POST', `/notifications/visits/${visitId}/deny`, { reason }),

  // File upload
  uploadFile,
};

export const saveToken = (token: string) => AsyncStorage.setItem('auth_token', token);
export const clearToken = () => AsyncStorage.removeItem('auth_token');
export const getStoredToken = getToken;
