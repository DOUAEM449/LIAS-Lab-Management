package com.lias.labmanagement.members.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record LeaveAffiliationRequest(
        @NotNull LocalDate leaveDate,
        String reason
) {
}
