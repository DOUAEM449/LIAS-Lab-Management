package com.lias.labmanagement.common.enums;

/**
 * Why a {@code User.role} value changed — recorded on every row of
 * {@code UserRoleHistory} so the effective-permissions trail stays
 * auditable independently of the Mandate/Status history it was derived from.
 */
public enum RoleChangeSource {
    /** Recomputed because an active governance Mandate (Director/Vice-Director/Team Leader) started or ended. */
    MANDATE_CHANGE,
    /** Recomputed because the member's status changed (e.g. PhD Student -> Permanent, or frozen on Retired/Former). */
    STATUS_CHANGE,
    /** Directly set by a SYSTEM_ADMIN (e.g. granting SYSTEM_ADMIN itself, which has no Member/Mandate counterpart). */
    ADMIN_OVERRIDE,
    /** Realigned by the startup reconciliation (legacy account whose role predated the derivation logic). */
    RECONCILIATION
}
