package com.lias.labmanagement.event.dto;

import com.lias.labmanagement.common.enums.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EventRequest(
        @NotNull EventType type,
        @NotBlank String title,
        String description,
        Integer editionNumber,
        @NotNull LocalDateTime startDate,
        @NotNull LocalDateTime endDate,
        String location,
        List<UUID> organizerMemberIds
) {
}
