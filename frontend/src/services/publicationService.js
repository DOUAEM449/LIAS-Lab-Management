import api from './api';

// GET /api/v1/publications?year=&teamId=&authorId=&query=&page=&size=&sort= -> PageResponse<PublicationResponse> (public read)
export async function searchPublications({ year, teamId, authorId, query, page = 0, size = 20, sort } = {}) {
  const res = await api.get('/publications', {
    params: { year, teamId, authorId, query, page, size, ...(sort ? { sort } : {}) },
  });
  return res.data.data;
}

// GET /api/v1/publications?page=0&size=1 -> we only need totalElements
export async function countPublications() {
  const res = await api.get('/publications', { params: { page: 0, size: 1 } });
  return res.data.data.totalElements;
}

export async function getPublication(id) {
  const res = await api.get(`/publications/${id}`);
  return res.data.data;
}

export async function createPublication(payload) {
  const res = await api.post('/publications', payload);
  return res.data.data;
}

export async function updatePublication(id, payload) {
  const res = await api.put(`/publications/${id}`, payload);
  return res.data.data;
}

export async function deletePublication(id) {
  await api.delete(`/publications/${id}`);
}

export async function uploadPublicationPdf(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/publications/${id}/pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
