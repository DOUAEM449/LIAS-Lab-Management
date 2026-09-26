package com.lias.labmanagement.common.enums;

import java.util.EnumSet;
import java.util.Set;

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
    FORMER_MEMBER;

    /**
     * Roles admitted to the internal modules: documents, equipment, meetings. CdC §2.2.C
     * closes them to PhD students. An allow-list on purpose: a role added later stays out
     * until someone decides otherwise.
     * <p>
     * The controllers of those modules state the same list in their class-level
     * {@code @PreAuthorize}; this method is for the places that aggregate several modules
     * (global search, calendar) and must apply the rule themselves.
     */
    private static final Set<RoleName> INTERNAL_MODULES = EnumSet.of(
            SYSTEM_ADMIN, DIRECTOR, VICE_DIRECTOR, TEAM_LEADER, PERMANENT_MEMBER, ASSOCIATE_MEMBER);

    public boolean canAccessInternalModules() {
        return INTERNAL_MODULES.contains(this);
    }
}
