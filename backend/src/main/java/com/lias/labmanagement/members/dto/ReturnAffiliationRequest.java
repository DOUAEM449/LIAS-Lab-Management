package com.lias.labmanagement.members.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReturnAffiliationRequest(
        @NotNull LocalDate returnDate
) {
}
