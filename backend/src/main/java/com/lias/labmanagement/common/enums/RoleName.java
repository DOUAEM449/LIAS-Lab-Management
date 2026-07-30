package com.lias.labmanagement.common.enums;

/**
 * Technical roles used for Role-Based Access Control (RBAC).
 * Distinct from {@link MemberStatus} (membership category) and
 * {@link MandateRoleType} (governance responsibility) but derived from them
 * to produce the effective set of permissions granted to a user.
 */
public enum RoleName {
    SYSTEM_ADMIN,
    DIRECTOR,
    VICE_DIRECTOR,
    TEAM_LEADER,
    PERMANENT_MEMBER,
    ASSOCIATE_MEMBER,
    PHD_STUDENT,
    RETIRED_MEMBER,
    FORMER_MEMBER
}
