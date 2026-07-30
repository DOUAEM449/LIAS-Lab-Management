package com.lias.labmanagement.membershiprequest.dto;

import com.lias.labmanagement.common.enums.MemberStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MembershipRequestSubmission(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotNull MemberStatus requestedStatus,
        String homeInstitution,
        @NotBlank String motivationLetter
) {
}
