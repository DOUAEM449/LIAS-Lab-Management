import { countMembersByStatus, searchMembers } from './memberService';
import { countEventsThisYear, searchEvents } from './eventService';
import { countPublications, searchPublications } from './publicationService';
import { getRequestsByStatus } from './membershipRequestService';
import { listTeams, listActiveMandates } from './governanceService';

// GET /api/v1/membership-requests is restricted to SYSTEM_ADMIN/DIRECTOR/
// VICE_DIRECTOR on the backend — skip it entirely for other roles instead
// of letting it 403.
export async function getDashboardStats(isManagementUser) {
  const [permanentMembers, pendingRequests, eventsThisYear, totalPublications, teams] = await Promise.all([
    countMembersByStatus('PERMANENT'),
    isManagementUser
      ? getRequestsByStatus('PENDING', { page: 0, size: 1 }).then((p) => p.totalElements)
      : Promise.resolve(null),
    countEventsThisYear(),
    countPublications(),
    listTeams().catch(() => []),
  ]);

  return {
    permanentMembers,
    pendingRequests,
    eventsThisYear,
    totalPublications,
    teamCount: teams.length,
  };
}

/**
 * Publications per year over the last five years, built from real rows so the
 * dashboard chart never shows invented data. Returns [{ year, count }].
 */
export async function getPublicationsByYear(years = 5) {
  const currentYear = new Date().getFullYear();
  const wanted = Array.from({ length: years }, (_, i) => currentYear - (years - 1 - i));
  const pages = await Promise.all(
    wanted.map((year) => searchPublications({ year, page: 0, size: 1 }).catch(() => ({ totalElements: 0 })))
  );
  return wanted.map((year, i) => ({ year, count: pages[i].totalElements ?? 0 }));
}

/** Distribution of members across the five membership statuses (CdC §2.2). */
export async function getMemberStatusBreakdown() {
  const statuses = ['PERMANENT', 'ASSOCIATE', 'PHD_STUDENT', 'RETIRED', 'FORMER'];
  const counts = await Promise.all(statuses.map((s) => countMembersByStatus(s).catch(() => 0)));
  return statuses.map((status, i) => ({ status, count: counts[i] }));
}

/**
 * Governance currently in office, resolved from ACTIVE MANDATES — never from a
 * stored role (CdC §2.5 / §2.21: the mandate is the source of truth).
 */
export async function getCurrentGovernance() {
  const mandates = await listActiveMandates().catch(() => []);
  return {
    director: mandates.find((m) => m.role === 'DIRECTOR') ?? null,
    viceDirector: mandates.find((m) => m.role === 'VICE_DIRECTOR') ?? null,
    teamLeaders: mandates.filter((m) => m.role === 'TEAM_LEADER'),
  };
}

/** The next scientific events, for the dashboard's "à venir" panel. */
export async function getUpcomingEvents(limit = 4) {
  const page = await searchEvents({ page: 0, size: 50, sort: 'startDate,desc' }).catch(() => ({ content: [] }));
  const now = new Date();
  return page.content
    .filter((e) => new Date(e.startDate) >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, limit);
}

/** Most recently registered members, used for the activity panel. */
export async function getRecentMembers(limit = 5) {
  const page = await searchMembers({ page: 0, size: limit, sort: 'createdAt,desc' }).catch(() => ({ content: [] }));
  return page.content;
}
