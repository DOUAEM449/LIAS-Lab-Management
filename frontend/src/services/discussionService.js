import api from './api';

export async function listDiscussions(scope) {
  const res = await api.get('/discussions', { params: { scope, page: 0, size: 50 } });
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
