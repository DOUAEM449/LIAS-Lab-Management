package com.lias.labmanagement.governance.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record TeamRequest(
        @NotBlank String name,
        String description,
        LocalDate creationDate
) {
}
