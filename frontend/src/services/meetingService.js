import api from './api';

export async function listMeetings({ page = 0, size = 50, sort = 'meetingDate,desc' } = {}) {
  const res = await api.get('/meetings', { params: { page, size, sort } });
  return res.data.data;
}

export async function getMeeting(id) {
  const res = await api.get(`/meetings/${id}`);
  return res.data.data;
}

export async function createMeeting(payload) {
  const res = await api.post('/meetings', payload);
  return res.data.data;
}

export async function updateMeeting(id, payload) {
  const res = await api.put(`/meetings/${id}`, payload);
  return res.data.data;
}

export async function deleteMeeting(id) {
  await api.delete(`/meetings/${id}`);
}

export async function listMeetingMinutes(id) {
  const res = await api.get(`/meetings/${id}/minutes`);
  return res.data.data;
}

export async function uploadMeetingMinutes(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/meetings/${id}/minutes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
