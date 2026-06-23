import client from './client';

export interface LoginResponse {
  token: string;
  access_token?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    client.post<LoginResponse>('/auth/login', { email, password }).then(r => r.data),
};
