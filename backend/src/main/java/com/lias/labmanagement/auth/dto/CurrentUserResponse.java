package com.lias.labmanagement.auth.dto;

import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleName;

import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String email,
        RoleName role,
        boolean mustChangePassword,
        MemberStatus status
) {
}
