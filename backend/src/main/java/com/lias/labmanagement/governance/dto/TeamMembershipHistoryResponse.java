package com.lias.labmanagement.governance.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TeamMembershipHistoryResponse(
        UUID id,
        UUID teamId,
        String teamName,
        LocalDate startDate,
        LocalDate endDate,
        Instant createdAt
) {
}
