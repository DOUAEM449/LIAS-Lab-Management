import api from './api';

export async function searchEquipment({ query, page = 0, size = 50 } = {}) {
  const res = await api.get('/equipment', { params: { query, page, size } });
  return res.data.data;
}

export async function createEquipment(payload) {
  const res = await api.post('/equipment', payload);
  return res.data.data;
}

export async function updateEquipment(id, payload) {
  const res = await api.put(`/equipment/${id}`, payload);
  return res.data.data;
}

export async function deleteEquipment(id) {
  await api.delete(`/equipment/${id}`);
}

export async function listDistributions(equipmentId) {
  const res = await api.get(`/equipment/${equipmentId}/distributions`);
  return res.data.data;
}

export async function distributeEquipment(equipmentId, payload) {
  const res = await api.post(`/equipment/${equipmentId}/distributions`, payload);
  return res.data.data;
}

export async function returnDistribution(distributionId) {
  await api.post(`/equipment/distributions/${distributionId}/return`);
}

// Equipment requests (member submissions + director/vice-director decisions)
export async function listEquipmentRequestsByStatus(status, { page = 0, size = 30 } = {}) {
  const res = await api.get('/equipment-requests', { params: { status, page, size } });
  return res.data.data;
}

export async function listMyEquipmentRequests({ page = 0, size = 30 } = {}) {
  const res = await api.get('/equipment-requests/mine', { params: { page, size } });
  return res.data.data;
}

export async function submitEquipmentRequest(payload) {
  const res = await api.post('/equipment-requests', payload);
  return res.data.data;
}

export async function approveEquipmentRequest(id, note) {
  const res = await api.post(`/equipment-requests/${id}/approve`, note ? { note } : {});
  return res.data.data;
}

export async function rejectEquipmentRequest(id, note) {
  const res = await api.post(`/equipment-requests/${id}/reject`, note ? { note } : {});
  return res.data.data;
}
