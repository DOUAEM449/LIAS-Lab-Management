package com.lias.labmanagement.administration.dto;

import com.lias.labmanagement.common.enums.AuditAction;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        String actorEmail,
        AuditAction action,
        String entityType,
        String entityId,
        String details,
        String ipAddress,
        Instant createdAt
) {
}
