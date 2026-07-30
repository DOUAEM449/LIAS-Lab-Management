package com.lias.labmanagement.administration.dto;

import com.lias.labmanagement.common.enums.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String temporaryPassword,
        @NotNull RoleName role
) {
}
