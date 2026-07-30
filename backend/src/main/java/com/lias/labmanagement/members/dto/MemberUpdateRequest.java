package com.lias.labmanagement.members.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MemberUpdateRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Email String email,
        String photoUrl,
        LocalDate birthDate,
        @Size(max = 255) String homeInstitution,
        @Size(max = 255) String homeLaboratory,
        String biography,
        String researchInterests
) {
}
