package com.lias.labmanagement.laboratory.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Public-facing: the whole laboratory record is non-confidential institutional info.
 * <p>
 * {@code directorName} is resolved from the currently active DIRECTOR mandate rather
 * than stored on the laboratory, so the public presentation always names whoever is
 * actually in office (CdC §2.5 — le directeur est celui en mandat).
 */
public record LaboratoryResponse(
        UUID id,
        String name,
        LocalDate foundingDate,
        String description,
        String directorMessage,
        String directorName
) {
}
