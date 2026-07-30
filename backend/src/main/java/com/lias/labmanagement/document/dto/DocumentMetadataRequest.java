package com.lias.labmanagement.document.dto;

import com.lias.labmanagement.common.enums.DocumentCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DocumentMetadataRequest(
        @NotBlank String title,
        @NotNull DocumentCategory category,
        String tags,
        UUID relatedEventId
) {
}
