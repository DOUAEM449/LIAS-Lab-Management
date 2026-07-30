package com.lias.labmanagement.document.dto;

import com.lias.labmanagement.common.enums.DocumentCategory;

import java.time.Instant;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String title,
        DocumentCategory category,
        String tags,
        String originalFileName,
        String contentType,
        long sizeBytes,
        UUID relatedEventId,
        int currentVersion,
        Instant createdAt,
        Instant updatedAt
) {
}
