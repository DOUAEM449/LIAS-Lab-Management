package com.lias.labmanagement.notification.dto;

import com.lias.labmanagement.common.enums.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String message,
        boolean read,
        String relatedEntityType,
        UUID relatedEntityId,
        Instant createdAt
) {
}
