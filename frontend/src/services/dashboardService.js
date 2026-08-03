import { countMembersByStatus } from './memberService';
import { countEventsThisYear } from './eventService';
import { countPublications } from './publicationService';
import { getRequestsByStatus } from './membershipRequestService';

// GET /api/v1/membership-requests is restricted to SYSTEM_ADMIN/DIRECTOR/
// VICE_DIRECTOR on the backend — skip it entirely for other roles instead
// of letting it 403.
export async function getDashboardStats(isManagementUser) {
  const [permanentMembers, pendingRequests, eventsThisYear, totalPublications] = await Promise.all([
    countMembersByStatus('PERMANENT'),
    isManagementUser
      ? getRequestsByStatus('PENDING', { page: 0, size: 1 }).then((p) => p.totalElements)
      : Promise.resolve(null),
    countEventsThisYear(),
    countPublications(),
  ]);

  return {
    permanentMembers,
    pendingRequests,
    eventsThisYear,
    totalPublications,
  };
}
