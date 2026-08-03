import api from './api';

export async function listNotifications({ page = 0, size = 30 } = {}) {
  const res = await api.get('/notifications', { params: { page, size } });
  return res.data.data;
}

export async function countUnreadNotifications() {
  const res = await api.get('/notifications/unread-count');
  return res.data.data;
}

export async function markNotificationRead(id) {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all');
}
