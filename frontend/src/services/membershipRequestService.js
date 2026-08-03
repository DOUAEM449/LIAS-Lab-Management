import api from './api';

const ALL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

// GET /api/v1/membership-requests?status=&page=&size=&sort= -> PageResponse<MembershipRequestResponse>
export async function getRequestsByStatus(status, { page = 0, size = 100, sort } = {}) {
  const res = await api.get('/membership-requests', {
    params: { status, page, size, ...(sort ? { sort } : {}) },
  });
  return res.data.data; // { content, page, size, totalElements, totalPages, first, last }
}

// The backend has no "all statuses" endpoint (status is a required filter,
// defaulting to PENDING) — so "all requests" means fetching each status
// and merging. Fine at a single lab's request volume; paginate per-status
// if that ever stops being true.
export async function getAllRequests({ size = 100 } = {}) {
  const pages = await Promise.all(
    ALL_STATUSES.map((status) => getRequestsByStatus(status, { page: 0, size }))
  );
  return pages.flatMap((p) => p.content);
}

// POST /api/v1/membership-requests/public (multipart, no auth required)
// The "data" part must be sent as an application/json Blob — a plain string
// part defaults to text/plain, which the backend has no converter for and
// used to surface as an opaque 500 (see MembershipRequestController).
export async function submitMembershipRequest(payload, cvFile) {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (cvFile) {
    formData.append('cv', cvFile);
  }
  const res = await api.post('/membership-requests/public', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

// POST /api/v1/membership-requests/{id}/approve
export async function approveRequest(id, decisionNote) {
  const res = await api.post(`/membership-requests/${id}/approve`, decisionNote ? { decisionNote } : {});
  return res.data.data;
}

// POST /api/v1/membership-requests/{id}/reject
export async function rejectRequest(id, decisionNote) {
  const res = await api.post(`/membership-requests/${id}/reject`, decisionNote ? { decisionNote } : {});
  return res.data.data;
}
