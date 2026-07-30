package com.lias.labmanagement.membershiprequest.dto;

import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RequestStatus;

import java.time.Instant;
import java.util.UUID;

public record MembershipRequestResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        MemberStatus requestedStatus,
        String homeInstitution,
        String motivationLetter,
        String cvOriginalName,
        RequestStatus status,
        Instant submittedAt,
        UUID decidedBy,
        Instant decisionDate,
        String decisionNote
) {
}
