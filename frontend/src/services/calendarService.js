import api from './api';

/**
 * CdC §2.20 — calendrier : visualisation des événements et navigation temporelle.
 * The backend returns events and meetings already merged and sorted.
 */
export async function listCalendarItems(from, to) {
  const res = await api.get('/calendar', {
    params: { from: toIsoLocal(from), to: toIsoLocal(to) },
  });
  // The backend field is `itemType` ("EVENT" | "MEETING"); expose it as `type`
  // so callers have one consistent shape.
  return (res.data.data || []).map((it) => ({ ...it, type: it.itemType }));
}

/**
 * The endpoint binds LocalDateTime, so it must receive a local ISO string
 * without timezone suffix — `toISOString()` would shift the range by the UTC
 * offset and silently drop items at month boundaries.
 */
function toIsoLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
