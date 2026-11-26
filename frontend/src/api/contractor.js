import api from './axios';

export const getContractorsByCity = (city) => api.get('/contractors/list', { params: { city } });
export const matchContractors = (city, budget) => api.get('/contractors/match', { params: { city, budget } });
export const submitBid = (data) => api.post('/contractors/bid', data);
export const getBidsForProject = (projectId) => api.get(`/contractors/bids/project/${projectId}`);
export const getMyBids = () => api.get('/contractors/bids/my');
