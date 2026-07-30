package com.lias.labmanagement.meeting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record MeetingRequest(
        @NotBlank String title,
        @NotNull LocalDateTime meetingDate,
        String agenda,
        String type,
        String location
) {
}
