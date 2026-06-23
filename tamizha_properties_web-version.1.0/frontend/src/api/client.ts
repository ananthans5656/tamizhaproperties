import axios from 'axios';

const client = axios.create({
  // @ts-ignore
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('tp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and redirect to login
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tp_token');
      localStorage.removeItem('tp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default client;
