package com.lias.labmanagement.publication.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PublicationResponse(
        UUID id,
        String title,
        String abstractText,
        String keywords,
        int year,
        String doi,
        String pdfOriginalName,
        UUID teamId,
        String teamName,
        List<AuthorSummary> authors,
        Instant createdAt
) {
    public record AuthorSummary(UUID memberId, String fullName) {
    }
}
