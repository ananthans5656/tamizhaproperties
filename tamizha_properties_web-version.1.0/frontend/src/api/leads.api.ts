import client from './client';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  city?: string;
  nativePlace?: string;
  propertyInterest?: string;
  propertyId?: string;
  status: 'HOT' | 'WARM' | 'NEW' | 'CLOSED' | 'LOST';
  source?: 'User App' | 'WhatsApp' | 'Web Referral' | 'Walk-in' | 'Other';
  timeSpent?: string;
  assignedAgent?: string;
  loginUserId?: string;
  notes?: string;
  lastContact?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  messages?: any[];
}

export interface LeadStats {
  hot: number;
  warm: number;
  new: number;
  closed: number;
  total: number;
  sourceBreakdown: { source: string; count: number }[];
}

export interface PaginatedLeads {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetLeadsParams {
  search?: string;
  status?: string;
  source?: string;
  propertyId?: string;
  page?: number;
  limit?: number;
}

export const leadsApi = {
  getAll: (params: GetLeadsParams = {}) =>
    client.get<PaginatedLeads>('/leads', { params }).then(r => r.data),

  getStats: () =>
    client.get<LeadStats>('/leads/stats').then(r => r.data),

  getOne: (id: string) =>
    client.get<Lead>(`/leads/${id}`).then(r => r.data),

  getByUserId: (userId: string) =>
    client.get<Lead | null>(`/leads/by-user/${userId}`).then(r => r.data),

  create: (data: Partial<Lead>) =>
    client.post<Lead>('/leads', data).then(r => r.data),

  update: (id: string, data: Partial<Lead>) =>
    client.patch<Lead>(`/leads/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/leads/${id}`).then(r => r.data),

  assignLogin: (leadId: string, email: string, password: string) =>
    client.post<{ message: string; userId: string }>(`/leads/${leadId}/assign-login`, { email, password }).then(r => r.data),

  getMessages: (leadId: string) =>
    client.get(`/leads/${leadId}/messages`).then(r => r.data),

  sendMessage: (leadId: string, text: string, sender: 'admin' | 'client' = 'admin') =>
    client.post(`/leads/${leadId}/messages`, { text, sender }).then(r => r.data),

  deleteMessage: (leadId: string, msgId: string) =>
    client.delete(`/leads/${leadId}/messages/${msgId}`).then(r => r.data),

  deleteAllMessages: (leadId: string) =>
    client.delete(`/leads/${leadId}/messages`).then(r => r.data),
};

