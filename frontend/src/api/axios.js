import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach live Firebase ID token to every API request
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (typeof res.data === 'string' && res.data.trim().startsWith('<')) {
      return Promise.reject(new Error('Unexpected HTML response from API endpoint.'));
    }
    return res;
  },
  (err) => Promise.reject(err)
);

export default api;
