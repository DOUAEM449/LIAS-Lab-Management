package com.lias.labmanagement.partnership.dto;

import java.util.UUID;

public record PartnerResponse(
        UUID id,
        String name,
        String type,
        String country,
        String contactInfo,
        String logoPath
) {
}
