package com.lias.labmanagement.equipment.dto;

import com.lias.labmanagement.common.enums.EquipmentRequestStatus;

import java.time.Instant;
import java.util.UUID;

public record EquipmentRequestResponse(
        UUID id,
        UUID requesterId,
        String requesterName,
        String itemName,
        String description,
        int quantity,
        EquipmentRequestStatus status,
        UUID validatedBy,
        Instant validationDate,
        String validationNote
) {
}
