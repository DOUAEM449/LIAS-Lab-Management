package com.lias.labmanagement.notification.dto;

import com.lias.labmanagement.notification.entity.DiscussionScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DiscussionRequest(
        @NotBlank String title,
        @NotNull DiscussionScope scope,
        UUID teamId,
        UUID eventId
) {
}
