package com.lias.labmanagement.notification.dto;

import com.lias.labmanagement.notification.entity.DiscussionScope;

import java.time.Instant;
import java.util.UUID;

/**
 * A discussion thread. {@code teamName} / {@code eventTitle} are carried
 * alongside the ids so the client can label a TEAM or EVENT thread (CdC §2.13)
 * without an extra round-trip per row.
 */
public record DiscussionResponse(
        UUID id,
        String title,
        DiscussionScope scope,
        UUID teamId,
        String teamName,
        UUID eventId,
        String eventTitle,
        UUID createdByMemberId,
        String createdByName,
        Instant createdAt
) {
}
