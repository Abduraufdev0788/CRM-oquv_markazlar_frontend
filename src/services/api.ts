import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we receive a 401, clear auth state and redirect to login
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
