import client from './client';

export interface Property {
  id: string;
  title: string;
  description?: string;
  location: string;
  district: string;
  price: number;
  priceLabel?: string;
  sqft?: number;
  ground?: number;
  status: 'For Sale' | 'Sold' | 'Premium' | 'New Launch' | 'Draft';
  imgType?: string;
  plotType?: string;
  isReraVerified?: boolean;
  isFeatured?: boolean;
  offerCode?: string;
  bankOffer?: string;
  partnerOffer?: string;
  images?: string[];
  videoUrl?: string;
  viewsCount?: number;
  leadsCount?: number;
  documents?: any[];
  amenities?: any[];
  nearby?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyStats {
  total: number;
  statusStats?: { status: string; count: number }[];
  districtStats: { district: string; count: number }[];
}

export interface PaginatedProperties {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetPropertiesParams {
  search?: string;
  status?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minGround?: number;
  maxGround?: number;
  page?: number;
  limit?: number;
}

export const propertiesApi = {
  getAll: (params: GetPropertiesParams = {}) =>
    client.get<PaginatedProperties>('/properties', { params }).then(r => r.data),

  getFeatured: () =>
    client.get<Property[]>('/properties/featured').then(r => r.data),

  getStats: (params?: { status?: string; district?: string }) =>
    client.get<PropertyStats>('/properties/stats', { params }).then(r => r.data),

  getOne: (id: string) =>
    client.get<Property>(`/properties/${id}`).then(r => r.data),

  create: (data: Partial<Property>) =>
    client.post<Property>('/properties', data).then(r => r.data),

  update: (id: string, data: Partial<Property>) =>
    client.patch<Property>(`/properties/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/properties/${id}`).then(r => r.data),
};
