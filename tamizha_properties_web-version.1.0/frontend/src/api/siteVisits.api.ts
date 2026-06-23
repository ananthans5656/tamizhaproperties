import client from './client';

export interface SiteVisit {
  id: string;
  lead_id: string;
  property_id: string;
  visit_date: string;
  status: string;
  notes?: string;
  created_at: string;
  lead_name?: string;
  lead_phone?: string;
  property_title?: string;
  property_location?: string;
}

export const siteVisitsApi = {
  getAll: () =>
    client.get<SiteVisit[]>('/site-visits').then(r => r.data),

  getOne: (id: string) =>
    client.get<SiteVisit>(`/site-visits/${id}`).then(r => r.data),

  create: (data: Partial<SiteVisit>) =>
    client.post<SiteVisit>('/site-visits', data).then(r => r.data),

  update: (id: string, data: Partial<SiteVisit>) =>
    client.put<SiteVisit>(`/site-visits/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/site-visits/${id}`).then(r => r.data),
};
