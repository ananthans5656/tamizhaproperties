import client from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  nativePlace?: string;
  status: 'Active' | 'NRI Premium' | 'Pending' | 'Inactive';
  role: 'admin' | 'agent' | 'user';
  profilePhoto?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  total: number;
  nriPremium: number;
  active: number;
  pending: number;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetUsersParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  getAll: (params: GetUsersParams = {}) =>
    client.get<PaginatedUsers>('/users', { params }).then(r => r.data),

  getStats: () =>
    client.get<UserStats>('/users/stats').then(r => r.data),

  getOne: (id: string) =>
    client.get<User>(`/users/${id}`).then(r => r.data),

  create: (data: Partial<User> & { password: string }) =>
    client.post<User>('/users', data).then(r => r.data),

  update: (id: string, data: Partial<User>) =>
    client.patch<User>(`/users/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    client.delete(`/users/${id}`).then(r => r.data),

  changePassword: (id: string, data: { currentPassword: string; newPassword: string }) =>
    client.patch<{ message: string }>(`/users/${id}/change-password`, data).then(r => r.data),
};
