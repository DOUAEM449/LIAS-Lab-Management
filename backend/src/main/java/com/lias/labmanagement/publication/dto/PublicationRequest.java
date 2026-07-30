package com.lias.labmanagement.publication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record PublicationRequest(
        @NotBlank String title,
        String abstractText,
        String keywords,
        @NotNull int year,
        String doi,
        UUID teamId,
        @NotEmpty List<UUID> authorMemberIds
) {
}
