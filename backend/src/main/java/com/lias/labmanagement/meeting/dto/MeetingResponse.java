package com.lias.labmanagement.meeting.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MeetingResponse(
        UUID id,
        String title,
        LocalDateTime meetingDate,
        String agenda,
        String type,
        String location,
        boolean hasMinutes
) {
}
