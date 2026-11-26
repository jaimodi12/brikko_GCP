import api from './axios';

export const createAndEstimate = (data) => api.post('/projects/estimate', data);
export const getMyProjects = () => api.get('/projects/my');
export const getOpenProjects = (city) =>
  api.get('/projects/open', { params: city ? { city } : {} });
export const getProjectBreakdown = (id) => api.get(`/projects/${id}/breakdown`);
export const getOptions = {
  cities: (state) => api.get('/options/cities', { params: state ? { state } : {} }),
  states: () => api.get('/options/states'),
  lookupPincode: (pincode) => api.get(`/options/pincode/${encodeURIComponent(pincode)}`),
  cementTypes: () => api.get('/options/cement-types'),
  paintTypes: () => api.get('/options/paint-types'),
  windowTypes: () => api.get('/options/window-types'),
};
