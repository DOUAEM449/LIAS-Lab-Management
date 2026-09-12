// Mirrors RoleName + the @PreAuthorize rules on the backend controllers —
// keep in sync if a controller's authorization changes.

export const ROLE_LABEL_FR = {
  SYSTEM_ADMIN: 'Administrateur système',
  DIRECTOR: 'Directeur',
  VICE_DIRECTOR: 'Vice-directeur',
  TEAM_LEADER: "Chef d'équipe",
  PERMANENT_MEMBER: 'Membre permanent',
  ASSOCIATE_MEMBER: 'Membre associé',
  PHD_STUDENT: 'Doctorant',
  RETIRED_MEMBER: 'Retraité',
  FORMER_MEMBER: 'Ancien membre',
};

// Membership requests (list/approve/reject), Governance (teams/mandates
// management), Partnerships (partners/agreements CRUD), Reports: all
// class-/method-level restricted to these three on the backend.
export const MANAGEMENT_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR'];

// Deciding a membership request (approve/reject) — the backend restricts this to
// DIRECTOR alone (MembershipRequestController), even though SYSTEM_ADMIN and
// VICE_DIRECTOR can view the list. The decision buttons must follow that.
export const MEMBERSHIP_DECISION_ROLES = ['DIRECTOR'];

// Equipment inventory CRUD (EquipmentController class-level PreAuthorize).
export const EQUIPMENT_ADMIN_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR'];

// Approving/rejecting equipment requests — note SYSTEM_ADMIN is NOT included
// here even though it is for inventory CRUD (EquipmentRequestController).
export const EQUIPMENT_DECISION_ROLES = ['DIRECTOR', 'VICE_DIRECTOR'];

// Creating events/meetings (EventController / MeetingController).
export const EVENT_MEETING_CREATE_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR', 'TEAM_LEADER'];

// "Modules internes" per CdC matrix (§2.2.C): Equipment and Meetings/PV are
// entirely off-limits to Doctorants (and, transitively, to frozen/disabled
// accounts, which never reach the dashboard at all). Mirrors the backend
// class-level @PreAuthorize on EquipmentController/EquipmentRequestController/MeetingController.
export const INTERNAL_MODULE_ROLES = [
  'SYSTEM_ADMIN',
  'DIRECTOR',
  'VICE_DIRECTOR',
  'TEAM_LEADER',
  'PERMANENT_MEMBER',
  'ASSOCIATE_MEMBER',
];

// Archiving a member / changing another member's status — CdC: visible only
// to "ADMIN ou DIRECTEUR EN MANDAT" (mirrors MemberController's archive
// restriction, the strictest of the two member-admin endpoints).
export const MEMBER_ADMIN_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR'];

// Editing another member's profile (not archiving/status) — backend also
// allows VICE_DIRECTOR here (MemberService.updateProfile PROFILE_ADMIN_ROLES).
export const MEMBER_PROFILE_EDIT_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR'];

// Consulting the audit trail (AuditLogController) — SYSTEM_ADMIN + governance.
export const AUDIT_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR'];

// Managing the governance structure itself — creating/editing/archiving teams
// (TeamController) and assigning/ending mandates (MandateController). The backend
// restricts these to SYSTEM_ADMIN + DIRECTOR only; a VICE_DIRECTOR reaches the
// Gouvernance page (AUDIT/MANAGEMENT scope) but may only consult and transfer.
export const GOVERNANCE_STRUCTURE_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR'];

// Deleting a document (DocumentController's method-level @PreAuthorize). Viewing,
// uploading and editing metadata are open to every INTERNAL_MODULE_ROLES holder,
// which is exactly the class-level rule on the same controller.
export const DOCUMENT_DELETE_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR'];

// Technical account administration (UserAdministrationController) — SYSTEM_ADMIN only.
// Kept separate from MANAGEMENT_ROLES on purpose: SYSTEM_ADMIN = administration
// technique, DIRECTOR/VICE_DIRECTOR = gouvernance métier (CdC §2.5/§5.1 vs §5.2).
export const SYSTEM_ADMIN_ROLES = ['SYSTEM_ADMIN'];

export function hasRole(user, roles) {
  return Boolean(user?.role) && roles.includes(user.role);
}

export function isManagement(user) {
  return hasRole(user, MANAGEMENT_ROLES);
}
