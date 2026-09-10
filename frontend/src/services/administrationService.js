import api from './api';

// SYSTEM_ADMIN only (backend: UserAdministrationController, @PreAuthorize hasRole('SYSTEM_ADMIN')).

// GET /api/v1/admin/users?page=&size=
export async function listUsers({ page = 0, size = 20 } = {}) {
  const res = await api.get('/admin/users', { params: { page, size } });
  return res.data.data;
}

// POST /api/v1/admin/users
export async function createUser(payload) {
  const res = await api.post('/admin/users', payload);
  return res.data.data;
}

// PATCH /api/v1/admin/users/{id}/enable
export async function enableUser(id) {
  const res = await api.patch(`/admin/users/${id}/enable`);
  return res.data.data;
}

// PATCH /api/v1/admin/users/{id}/disable
export async function disableUser(id) {
  const res = await api.patch(`/admin/users/${id}/disable`);
  return res.data.data;
}

// PATCH /api/v1/admin/users/{id}/role
export async function updateUserRole(id, role) {
  const res = await api.patch(`/admin/users/${id}/role`, { role });
  return res.data.data;
}

// DELETE /api/v1/admin/users/{id}
export async function deleteUser(id) {
  await api.delete(`/admin/users/${id}`);
}
