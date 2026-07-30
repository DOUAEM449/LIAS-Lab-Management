package com.lias.labmanagement.administration.dto;

import com.lias.labmanagement.common.enums.RoleName;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull RoleName role
) {
}
