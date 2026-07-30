package com.lias.labmanagement.governance.dto;

import java.time.LocalDate;
import java.util.UUID;

public record TeamResponse(
        UUID id,
        String name,
        String description,
        LocalDate creationDate,
        String currentLeaderName,
        UUID currentLeaderId,
        long memberCount,
        Long version
) {
}
