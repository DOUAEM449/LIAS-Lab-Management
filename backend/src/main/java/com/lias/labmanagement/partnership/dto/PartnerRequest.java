package com.lias.labmanagement.partnership.dto;

import jakarta.validation.constraints.NotBlank;

public record PartnerRequest(
        @NotBlank String name,
        String type,
        String country,
        String contactInfo
) {
}
