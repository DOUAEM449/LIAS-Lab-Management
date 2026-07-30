package com.lias.labmanagement.common.enums;

/**
 * Membership category (slow changing, historized). Distinct from the
 * time-bound governance role held via a {@code Mandate}.
 */
public enum MemberStatus {
    PERMANENT,
    ASSOCIATE,
    PHD_STUDENT,
    RETIRED,
    FORMER
}
