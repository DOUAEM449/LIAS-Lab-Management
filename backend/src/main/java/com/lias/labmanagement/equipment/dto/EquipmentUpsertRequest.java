package com.lias.labmanagement.equipment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

public record EquipmentUpsertRequest(
        @NotBlank String name,
        String description,
        String category,
        LocalDate arrivalDate,
        @PositiveOrZero int quantity
) {
}
