package com.lias.labmanagement.members.dto;

import com.lias.labmanagement.common.enums.MemberStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ChangeStatusRequest(
        @NotNull MemberStatus newStatus,
        @NotNull LocalDate effectiveDate,
        String reason
) {
}
