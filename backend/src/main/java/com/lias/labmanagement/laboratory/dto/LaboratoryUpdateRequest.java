package com.lias.labmanagement.laboratory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record LaboratoryUpdateRequest(
        @NotBlank @Size(max = 255) String name,
        LocalDate foundingDate,
        String description,
        String directorMessage
) {
}
