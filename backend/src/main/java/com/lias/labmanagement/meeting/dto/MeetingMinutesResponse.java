package com.lias.labmanagement.meeting.dto;

import java.time.Instant;
import java.util.UUID;

public record MeetingMinutesResponse(
        UUID id,
        String originalFileName,
        UUID uploadedBy,
        Instant uploadedAt
) {
}
