package com.lias.labmanagement.members.dto;

import com.lias.labmanagement.common.enums.MemberStatus;

import java.util.UUID;

/** Public-facing profile: no birth date, no login email exposed. */
public record MemberPublicResponse(
        UUID id,
        String firstName,
        String lastName,
        String photoUrl,
        String biography,
        String researchInterests,
        MemberStatus currentStatus,
        UUID currentTeamId,
        String currentTeamName
) {
}
