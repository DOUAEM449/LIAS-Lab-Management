package com.lias.labmanagement.members.dto;

import com.lias.labmanagement.common.enums.MemberStatus;

import java.time.LocalDate;
import java.util.UUID;

/** Full profile: returned to the member themselves, Director/Vice-Director and System Admin. */
public record MemberResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String photoUrl,
        LocalDate birthDate,
        LocalDate hireDate,
        LocalDate firstAffiliationDate,
        String homeInstitution,
        String homeLaboratory,
        String biography,
        String researchInterests,
        MemberStatus currentStatus,
        UUID currentTeamId,
        String currentTeamName,
        Long version
) {
}
