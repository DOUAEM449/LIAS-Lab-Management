package com.lias.labmanagement.partnership.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record AgreementRequest(
        @NotNull UUID partnerId,
        @NotBlank String title,
        String description,
        LocalDate startDate,
        LocalDate endDate
) {
}
