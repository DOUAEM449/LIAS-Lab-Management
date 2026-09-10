import api from './api';

export async function listDiscussions(scope) {
  const res = await api.get('/discussions', { params: { scope, page: 0, size: 50 } });
  return res.data.data;
}

/** CdC §2.13 — "Échanges par équipe". */
export async function listTeamDiscussions(teamId) {
  const res = await api.get(`/discussions/by-team/${teamId}`);
  return res.data.data;
}

/** CdC §2.13 — "Discussions liées aux événements". */
export async function listEventDiscussions(eventId) {
  const res = await api.get(`/discussions/by-event/${eventId}`);
  return res.data.data;
}

export async function createDiscussion(payload) {
  const res = await api.post('/discussions', payload);
  return res.data.data;
}

export async function listMessages(discussionId) {
  const res = await api.get(`/discussions/${discussionId}/messages`);
  return res.data.data;
}

export async function postMessage(discussionId, content) {
  const res = await api.post(`/discussions/${discussionId}/messages`, { content });
  return res.data.data;
}
