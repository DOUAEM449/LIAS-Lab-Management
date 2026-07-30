package com.lias.labmanagement.partnership.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AgreementResponse(
        UUID id,
        UUID partnerId,
        String partnerName,
        String title,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String documentOriginalName
) {
}
