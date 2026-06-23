import client from './client';

export type LocationType = 'PRIME' | 'RESIDENTIAL' | 'HIGH DEMAND' | 'NEW DEV' | 'UPCOMING' | 'INDUSTRIAL' | 'STRATEGIC' | 'NEW HUB';
export type LocationDistrict = 'TIRUNELVELI' | 'TENKASI' | 'THOOTHUKUDI' | 'NAGERCOIL' | 'COIMBATORE' | 'CHENNAI';

export interface Location {
  id: string;
  name: string;
  road?: string;
  district: LocationDistrict;
  type: LocationType;
  units: number;
  sold: number;
  revenue?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationStats {
  total: number;
  districtStats: { district: string; count: number }[];
}

export interface PaginatedLocations {
  data: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetLocationsParams {
  search?: string;
  district?: string;
  page?: number;
  limit?: number;
}

export const locationsApi = {
  getAll: (params: GetLocationsParams = {}) =>
    client.get<PaginatedLocations>('/locations', { params }).then(r => r.data),

  getStats: () =>
    client.get<LocationStats>('/locations/stats').then(r => r.data),

  getOne: (id: string) =>
    client.get<Location>(`/locations/${id}`).then(r => r.data),

  create: (data: Partial<Location>) =>
    client.post<Location>('/locations', data).then(r => r.data),

  update: (id: string, data: Partial<Location>) =>
    client.patch<Location>(`/locations/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/locations/${id}`).then(r => r.data),
};
