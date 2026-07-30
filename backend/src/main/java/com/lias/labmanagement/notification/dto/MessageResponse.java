package com.lias.labmanagement.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID discussionId,
        UUID senderId,
        String senderName,
        String content,
        Instant timestamp
) {
}
