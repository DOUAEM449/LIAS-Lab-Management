import api from './api';

// GET /api/v1/members?status=&teamId=&search=&page=&size=&sort=
export async function searchMembers({ status, teamId, search, page = 0, size = 20, sort } = {}) {
  const res = await api.get('/members', {
    params: { status, teamId, search, page, size, ...(sort ? { sort } : {}) },
  });
  return res.data.data;
}

// GET /api/v1/members?status=PERMANENT&page=0&size=1 -> we only need totalElements
export async function countMembersByStatus(status) {
  const res = await api.get('/members', { params: { status, page: 0, size: 1 } });
  return res.data.data.totalElements;
}

// GET /api/v1/public/members?page=0&size=1 -> no auth required, safe for the landing page
export async function countPublicMembers() {
  const res = await api.get('/public/members', { params: { page: 0, size: 1 } });
  return res.data.data.totalElements;
}

export async function getMember(id) {
  const res = await api.get(`/members/${id}`);
  return res.data.data;
}

// GET /api/v1/members/me -> the current user's own member profile.
// Throws (404) for technical accounts with no linked Member (e.g. SYSTEM_ADMIN) — callers should handle that.
export async function getMyProfile() {
  const res = await api.get('/members/me');
  return res.data.data;
}

// POST /api/v1/members/me/avatar (multipart)
export async function uploadMyAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/members/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

// DELETE /api/v1/members/me/avatar -> removes the current user's photo, reverting to the default
export async function deleteMyAvatar() {
  const res = await api.delete('/members/me/avatar');
  return res.data.data;
}

export async function updateMember(id, payload) {
  const res = await api.put(`/members/${id}`, payload);
  return res.data.data;
}

export async function changeMemberStatus(id, payload) {
  const res = await api.post(`/members/${id}/status`, payload);
  return res.data.data;
}

export async function archiveMember(id) {
  await api.delete(`/members/${id}`);
}

export async function restoreMember(id) {
  await api.post(`/members/${id}/restore`);
}

export async function leaveMember(id, payload) {
  await api.post(`/members/${id}/leave`, payload);
}

// POST /api/v1/members/{id}/return — reactivate a former/retired member (new affiliation
// period, status + role resynced, full history kept).
export async function returnMemberToLab(id, payload) {
  const res = await api.post(`/members/${id}/return`, payload);
  return res.data.data;
}

export async function getMemberStatusHistory(id) {
  const res = await api.get(`/members/${id}/status-history`);
  return res.data.data;
}

export async function getMemberAffiliationHistory(id) {
  const res = await api.get(`/members/${id}/affiliation-history`);
  return res.data.data;
}
