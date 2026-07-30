package com.lias.labmanagement.governance.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record TransferTeamRequest(
        @NotNull UUID memberId,
        @NotNull UUID newTeamId,
        @NotNull LocalDate effectiveDate
) {
}
