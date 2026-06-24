import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

// Fix stored image URLs that have old/different IP addresses or are relative paths.
export const normalizeImageUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('/')) {
    // Relative URL — prepend the API base (strip the /api suffix).
    const apiBase = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${apiBase}${url}`;
  }
  return url.replace(/http:\/\/[\d.]+:\d+/g, API_BASE_URL.replace(/\/api\/?$/, ''));
};

const getToken = () => AsyncStorage.getItem('user_auth_token');

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

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('POST', '/auth/login', { email, password }),
  register: (data: any) => request('POST', '/auth/register', data),

  // Properties (read-only for user app)
  getProperties: () => request('GET', '/properties').then((d: any) => Array.isArray(d) ? d : (d.data || [])),
  getProperty: (id: string) => request('GET', `/properties/${id}`),

  // Leads (user submitting enquiry)
  getLeads: () => request('GET', '/leads').then((d: any) => Array.isArray(d) ? d : (d.data || [])),
  getLeadByUser: (userId: string) => request('GET', `/leads/by-user/${userId}`),
  createLead: (data: any) => request('POST', '/leads', data),

  // Messages / Chat
  getMessages: (leadId: string) => request('GET', `/leads/${leadId}/messages`),
  sendMessage: (leadId: string, text: string, sender: string) =>
    request('POST', `/leads/${leadId}/messages`, { text, sender }),

  // Site visits
  getSiteVisits: () => request('GET', '/site-visits'),
  createSiteVisit: (data: any) => request('POST', '/site-visits', data),
  updateSiteVisit: (id: string, data: any) => request('PUT', `/site-visits/${id}`, data),

  // Notifications
  getUserNotifications: (leadId: string) => request('GET', `/notifications/user?lead_id=${leadId}`),
  markNotificationRead: (id: string) => request('PUT', `/notifications/${id}/read`, {}),

  // Password change
  changePassword: (data: any) => request('POST', '/users/change-password', data),
};

// Token management
export const saveToken = (token: string) =>
  AsyncStorage.setItem('user_auth_token', token);
export const clearToken = () => AsyncStorage.removeItem('user_auth_token');
export const getStoredToken = getToken;

// User session management (stored locally)
export const saveUserSession = (user: any) =>
  AsyncStorage.setItem('user_session', JSON.stringify(user));
export const getUserSession = async () => {
  const raw = await AsyncStorage.getItem('user_session');
  return raw ? JSON.parse(raw) : null;
};
export const clearUserSession = () => AsyncStorage.removeItem('user_session');

// User profile (name, nativePlace, currentCity etc. stored locally)
export const saveUserProfile = (profile: any) =>
  AsyncStorage.setItem('user_profile', JSON.stringify(profile));
export const getUserProfile = async () => {
  const raw = await AsyncStorage.getItem('user_profile');
  return raw ? JSON.parse(raw) : null;
};

// Lead ID for chat (stored after first enquiry or registration)
export const saveLeadId = (leadId: string) =>
  AsyncStorage.setItem('user_lead_id', leadId);
export const getLeadId = () => AsyncStorage.getItem('user_lead_id');
export const clearLeadId = () => AsyncStorage.removeItem('user_lead_id');

// Saved properties (stored locally)
export const getSavedProperties = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem('saved_properties');
  return raw ? JSON.parse(raw) : [];
};
export const toggleSavedProperty = async (propertyId: string): Promise<boolean> => {
  const saved = await getSavedProperties();
  const idx = saved.indexOf(propertyId);
  if (idx >= 0) {
    saved.splice(idx, 1);
  } else {
    saved.push(propertyId);
  }
  await AsyncStorage.setItem('saved_properties', JSON.stringify(saved));
  return idx < 0; // returns true if now saved
};
