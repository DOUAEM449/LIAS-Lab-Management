package com.lias.labmanagement.governance.dto;

import com.lias.labmanagement.common.enums.MandateRoleType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record AssignMandateRequest(
        @NotNull UUID memberId,
        @NotNull MandateRoleType role,
        UUID teamId,
        @NotNull LocalDate startDate
) {
}
