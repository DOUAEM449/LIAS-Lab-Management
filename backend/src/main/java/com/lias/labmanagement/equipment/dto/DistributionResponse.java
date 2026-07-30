package com.lias.labmanagement.equipment.dto;

import java.time.LocalDate;
import java.util.UUID;

public record DistributionResponse(
        UUID id,
        UUID equipmentId,
        String equipmentName,
        UUID memberId,
        String memberName,
        LocalDate distributionDate,
        int quantity,
        LocalDate returnedDate
) {
}
