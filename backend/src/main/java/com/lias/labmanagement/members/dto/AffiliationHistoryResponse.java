package com.lias.labmanagement.members.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AffiliationHistoryResponse(
        UUID id,
        LocalDate startDate,
        LocalDate endDate,
        String reason
) {
}
