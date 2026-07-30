package com.lias.labmanagement.event.dto;

import com.lias.labmanagement.common.enums.EventType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EventResponse(
        UUID id,
        EventType type,
        String title,
        String description,
        Integer editionNumber,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String location,
        String bannerImagePath,
        long participantCount,
        List<OrganizerSummary> organizers
) {
    public record OrganizerSummary(UUID memberId, String fullName) {
    }
}
