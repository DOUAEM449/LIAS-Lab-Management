import api from './api';

// GET /api/v1/events?type=&query=&page=&size=&sort= -> PageResponse<EventResponse> (public read)
export async function searchEvents({ type, query, page = 0, size = 30, sort = 'startDate,desc' } = {}) {
  const res = await api.get('/events', { params: { type, query, page, size, sort } });
  return res.data.data;
}

// NOTE: EventController has no `year` query param (unlike PublicationController),
// so "events this year" is approximated by fetching a large page sorted by
// startDate desc and counting client-side. Fine at this project's scale; if
// the event volume grows, add a `year` filter to the backend instead.
export async function countEventsThisYear() {
  const res = await api.get('/events', { params: { page: 0, size: 200, sort: 'startDate,desc' } });
  const currentYear = new Date().getFullYear();
  return res.data.data.content.filter((e) => new Date(e.startDate).getFullYear() === currentYear).length;
}

export async function getEvent(id) {
  const res = await api.get(`/events/${id}`);
  return res.data.data;
}

export async function createEvent(payload) {
  const res = await api.post('/events', payload);
  return res.data.data;
}

export async function updateEvent(id, payload) {
  const res = await api.put(`/events/${id}`, payload);
  return res.data.data;
}

export async function deleteEvent(id) {
  await api.delete(`/events/${id}`);
}

export async function listEventParticipants(id) {
  const res = await api.get(`/events/${id}/participants`);
  return res.data.data;
}

export async function registerForEvent(id, memberId) {
  const res = await api.post(`/events/${id}/register`, null, { params: { memberId } });
  return res.data.data;
}

export async function uploadEventBanner(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/events/${id}/banner`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
