package com.lias.labmanagement.document.dto;

import java.time.Instant;
import java.util.UUID;

public record DocumentVersionResponse(
        UUID id,
        int versionNumber,
        String originalFileName,
        UUID uploadedBy,
        Instant uploadedAt
) {
}
