package com.lias.labmanagement.notification.dto;

import com.lias.labmanagement.notification.entity.DiscussionScope;

import java.time.Instant;
import java.util.UUID;

public record DiscussionResponse(
        UUID id,
        String title,
        DiscussionScope scope,
        UUID teamId,
        UUID eventId,
        UUID createdByMemberId,
        String createdByName,
        Instant createdAt
) {
}
