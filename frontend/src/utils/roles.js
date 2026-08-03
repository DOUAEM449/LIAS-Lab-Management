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

// Equipment inventory CRUD (EquipmentController class-level PreAuthorize).
export const EQUIPMENT_ADMIN_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR'];

// Approving/rejecting equipment requests — note SYSTEM_ADMIN is NOT included
// here even though it is for inventory CRUD (EquipmentRequestController).
export const EQUIPMENT_DECISION_ROLES = ['DIRECTOR', 'VICE_DIRECTOR'];

// Creating events/meetings (EventController / MeetingController).
export const EVENT_MEETING_CREATE_ROLES = ['SYSTEM_ADMIN', 'DIRECTOR', 'VICE_DIRECTOR', 'TEAM_LEADER'];

export function hasRole(user, roles) {
  return Boolean(user?.role) && roles.includes(user.role);
}

export function isManagement(user) {
  return hasRole(user, MANAGEMENT_ROLES);
}
