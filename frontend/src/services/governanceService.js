import api from './api';

// Teams
export async function listTeams() {
  const res = await api.get('/teams');
  return res.data.data;
}

export async function getTeam(id) {
  const res = await api.get(`/teams/${id}`);
  return res.data.data;
}

export async function createTeam(payload) {
  const res = await api.post('/teams', payload);
  return res.data.data;
}

export async function updateTeam(id, payload) {
  const res = await api.put(`/teams/${id}`, payload);
  return res.data.data;
}

export async function archiveTeam(id) {
  await api.delete(`/teams/${id}`);
}

// Mandates
export async function listActiveMandates() {
  const res = await api.get('/mandates/active');
  return res.data.data;
}

export async function getMemberMandates(memberId) {
  const res = await api.get(`/mandates/member/${memberId}`);
  return res.data.data;
}

export async function assignMandate(payload) {
  const res = await api.post('/mandates', payload);
  return res.data.data;
}

export async function endMandate(id, payload) {
  const res = await api.post(`/mandates/${id}/end`, payload);
  return res.data.data;
}

// Team memberships
export async function getMemberTeamHistory(memberId) {
  const res = await api.get(`/team-memberships/member/${memberId}`);
  return res.data.data;
}

export async function transferMemberTeam(payload) {
  const res = await api.post('/team-memberships/transfer', payload);
  return res.data.data;
}
