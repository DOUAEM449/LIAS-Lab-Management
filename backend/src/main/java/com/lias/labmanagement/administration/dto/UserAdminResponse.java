package com.lias.labmanagement.administration.dto;

import com.lias.labmanagement.common.enums.RoleName;

import java.time.Instant;
import java.util.UUID;

public record UserAdminResponse(
        UUID id,
        String email,
        RoleName role,
        boolean enabled,
        boolean mustChangePassword,
        Instant lastLoginAt,
        int failedLoginAttempts
) {
}
