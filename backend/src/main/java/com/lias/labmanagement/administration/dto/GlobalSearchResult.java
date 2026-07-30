package com.lias.labmanagement.administration.dto;

import java.util.UUID;

public record GlobalSearchResult(
        String entityType,
        UUID id,
        String title,
        String subtitle
) {
}
