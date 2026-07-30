package com.lias.labmanagement.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(
        @NotBlank String content
) {
}
