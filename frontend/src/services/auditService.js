import api from './api';

// SYSTEM_ADMIN / DIRECTOR / VICE_DIRECTOR only (backend: AuditLogController). Read-only —
// there is intentionally no delete/clear function: audit logs must never be removable.

// GET /api/v1/admin/audit-logs?page=&size=
export async function listAuditLogs({ page = 0, size = 30 } = {}) {
  const res = await api.get('/admin/audit-logs', { params: { page, size, sort: 'createdAt,desc' } });
  return res.data.data;
}

// GET /api/v1/admin/audit-logs/by-entity?entityType=&entityId=
export async function getAuditLogsForEntity(entityType, entityId, { page = 0, size = 30 } = {}) {
  const res = await api.get('/admin/audit-logs/by-entity', {
    params: { entityType, entityId, page, size, sort: 'createdAt,desc' },
  });
  return res.data.data;
}

// GET /api/v1/admin/audit-logs/by-actor/{actorId}
export async function getAuditLogsForActor(actorId, { page = 0, size = 30 } = {}) {
  const res = await api.get(`/admin/audit-logs/by-actor/${actorId}`, {
    params: { page, size, sort: 'createdAt,desc' },
  });
  return res.data.data;
}
