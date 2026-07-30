package com.lias.labmanagement.equipment.dto;

import java.time.LocalDate;
import java.util.UUID;

public record EquipmentResponse(
        UUID id,
        String name,
        String description,
        String category,
        LocalDate arrivalDate,
        int quantity,
        int availableQuantity
) {
}
