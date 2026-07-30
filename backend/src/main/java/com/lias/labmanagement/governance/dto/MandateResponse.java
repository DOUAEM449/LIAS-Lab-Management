package com.lias.labmanagement.governance.dto;

import com.lias.labmanagement.common.enums.MandateRoleType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MandateResponse(
        UUID id,
        UUID memberId,
        String memberName,
        MandateRoleType role,
        UUID teamId,
        String teamName,
        LocalDate startDate,
        LocalDate endDate,
        boolean active,
        Instant createdAt
) {
}
