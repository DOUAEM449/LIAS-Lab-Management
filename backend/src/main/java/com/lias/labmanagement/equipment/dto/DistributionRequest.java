package com.lias.labmanagement.equipment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record DistributionRequest(
        @NotNull UUID memberId,
        @Min(1) int quantity,
        LocalDate distributionDate
) {
}
