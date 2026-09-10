import api from './api';

// GET /api/v1/public/laboratory — no auth required
export async function getLaboratory() {
  const res = await api.get('/public/laboratory');
  return res.data.data;
}

// PUT /api/v1/laboratory — SYSTEM_ADMIN only
export async function updateLaboratory(payload) {
  const res = await api.put('/laboratory', payload);
  return res.data.data;
}
