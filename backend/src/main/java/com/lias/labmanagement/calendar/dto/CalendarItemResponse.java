package com.lias.labmanagement.calendar.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/** A unified calendar entry aggregating both events and meetings. */
public record CalendarItemResponse(
        UUID id,
        String itemType,
        String title,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String location
) {
}
