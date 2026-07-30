package com.lias.labmanagement.report.dto;

import java.time.Instant;
import java.util.UUID;

public record AnnualReportResponse(
        UUID id,
        int year,
        Instant generatedDate,
        ReportStatistics statistics,
        String pdfPath
) {
}
