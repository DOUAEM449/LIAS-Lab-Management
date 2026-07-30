package com.lias.labmanagement.governance.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EndMandateRequest(
        @NotNull LocalDate endDate
) {
}
