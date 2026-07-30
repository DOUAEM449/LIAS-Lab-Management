package com.lias.labmanagement.report.dto;

public record ReportStatistics(
        long totalMembers,
        long totalPublicationsThisYear,
        long totalEventsThisYear,
        long approvedMembershipRequestsThisYear,
        long rejectedMembershipRequestsThisYear,
        long equipmentRequestsThisYear
) {
}
