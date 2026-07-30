package com.lias.labmanagement.event.dto;

import java.time.Instant;
import java.util.UUID;

public record EventParticipantResponse(
        UUID id,
        UUID memberId,
        String fullName,
        Instant registeredAt
) {
}
