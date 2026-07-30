package com.lias.labmanagement.auth.dto;

import com.lias.labmanagement.common.enums.RoleName;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        UUID userId,
        String email,
        RoleName role
) {
    public static AuthResponse of(String accessToken, String refreshToken, UUID userId, String email, RoleName role) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", userId, email, role);
    }
}
