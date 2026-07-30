package com.lias.labmanagement.equipment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record EquipmentRequestSubmission(
        @NotBlank String itemName,
        String description,
        @Min(1) int quantity
) {
}
