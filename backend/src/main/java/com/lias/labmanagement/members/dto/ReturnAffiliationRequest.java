package com.lias.labmanagement.members.dto;

import com.lias.labmanagement.common.enums.MemberStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReturnAffiliationRequest(
        @NotNull LocalDate returnDate,
        @NotNull MemberStatus reinstatedStatus
) {
}
