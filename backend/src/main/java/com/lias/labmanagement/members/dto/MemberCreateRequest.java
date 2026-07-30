package com.lias.labmanagement.members.dto;

import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Used by administration to directly create a member + linked user account. */
public record MemberCreateRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotNull MemberStatus status,
        @NotNull RoleName role,
        LocalDate hireDate,
        LocalDate affiliationDate,
        String homeInstitution,
        String homeLaboratory
) {
}
