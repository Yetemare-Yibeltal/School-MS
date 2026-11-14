import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 30000,
});

const readStored = () => {
  try {
    return JSON.parse(localStorage.getItem('kat-auth-storage'));
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = readStored()?.state?.accessToken;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall =
      original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = api.post('/auth/refresh').finally(() => {
            refreshing = null;
          });
        }
        const res = await refreshing;
        const newToken = res.data.accessToken;
        const stored = readStored();
        if (stored?.state) {
          stored.state.accessToken = newToken;
          localStorage.setItem('kat-auth-storage', JSON.stringify(stored));
        }
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        localStorage.removeItem('kat-auth-storage');
        window.location.href = '/login';
        return Promise.reject(e);
      }
    }

    if (status === 403 && error.response?.data?.code !== 'TEMPORARY_PASSWORD') {
      toast.error('You do not have permission to perform this action.', { id: 'forbidden' });
    }
    if (status === 429) {
      toast.error('Too many requests. Please slow down.', { id: 'rate' });
    }
    if (status >= 500) {
      toast.error('Server error. Please try again.', { id: 'server' });
    }
    return Promise.reject(error);
  }
);

export default api;
