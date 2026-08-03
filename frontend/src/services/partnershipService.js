import api from './api';

// Partners
export async function searchPartners({ query, page = 0, size = 50 } = {}) {
  const res = await api.get('/partners', { params: { query, page, size } });
  return res.data.data;
}

export async function getPartner(id) {
  const res = await api.get(`/partners/${id}`);
  return res.data.data;
}

export async function createPartner(payload) {
  const res = await api.post('/partners', payload);
  return res.data.data;
}

export async function updatePartner(id, payload) {
  const res = await api.put(`/partners/${id}`, payload);
  return res.data.data;
}

export async function deletePartner(id) {
  await api.delete(`/partners/${id}`);
}

export async function uploadPartnerLogo(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/partners/${id}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

// Agreements
export async function listAgreementsByPartner(partnerId) {
  const res = await api.get('/agreements', { params: { partnerId } });
  return res.data.data;
}

export async function createAgreement(payload) {
  const res = await api.post('/agreements', payload);
  return res.data.data;
}

export async function deleteAgreement(id) {
  await api.delete(`/agreements/${id}`);
}

export async function uploadAgreementDocument(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/agreements/${id}/document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
