package com.lias.labmanagement.members.dto;

import com.lias.labmanagement.common.enums.MemberStatus;

import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

public record MemberStatusHistoryResponse(
        UUID id,
        MemberStatus status,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        Instant createdAt
) {
}
