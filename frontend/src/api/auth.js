import api from './axios';

export const onboardProfile = (data) => api.post('/auth/onboard', data);
export const checkHealth = () => api.get('/health');
