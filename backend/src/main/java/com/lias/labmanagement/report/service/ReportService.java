package com.lias.labmanagement.report.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.EquipmentRequestStatus;
import com.lias.labmanagement.common.enums.RequestStatus;
import com.lias.labmanagement.common.exception.ConflictException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileDownload;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.equipment.repository.EquipmentRequestRepository;
import com.lias.labmanagement.event.repository.EventRepository;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.membershiprequest.repository.MembershipRequestRepository;
import com.lias.labmanagement.publication.repository.PublicationRepository;
import com.lias.labmanagement.report.dto.AnnualReportResponse;
import com.lias.labmanagement.report.dto.ReportStatistics;
import com.lias.labmanagement.report.entity.AnnualReport;
import com.lias.labmanagement.report.repository.AnnualReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Generates and stores yearly activity reports by aggregating counters
 * from every relevant module (members, publications, events, membership
 * requests, equipment requests).
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final AnnualReportRepository reportRepository;
    private final MemberRepository memberRepository;
    private final PublicationRepository publicationRepository;
    private final EventRepository eventRepository;
    private final MembershipRequestRepository membershipRequestRepository;
    private final EquipmentRequestRepository equipmentRequestRepository;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;
    private final AnnualReportPdfGenerator pdfGenerator;
    private final FileStorageService fileStorageService;

    /** True when the report for that year already exists — used by the yearly scheduler. */
    @Transactional(readOnly = true)
    public boolean existsForYear(int year) {
        return reportRepository.existsByYear(year);
    }

    @Transactional
    public AnnualReportResponse generate(int year) {
        if (reportRepository.existsByYear(year)) {
            throw new ConflictException("A report for year " + year + " already exists");
        }

        Instant start = ZonedDateTime.of(year, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC).toInstant();
        Instant end = ZonedDateTime.of(year + 1, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC).toInstant();

        ReportStatistics statistics = new ReportStatistics(
                memberRepository.count(),
                publicationRepository.countByYear(year),
                eventRepository.findByStartDateBetweenOrEndDateBetween(
                        start.atZone(ZoneOffset.UTC).toLocalDateTime(), end.atZone(ZoneOffset.UTC).toLocalDateTime(),
                        start.atZone(ZoneOffset.UTC).toLocalDateTime(), end.atZone(ZoneOffset.UTC).toLocalDateTime()).size(),
                membershipRequestRepository.countByStatusAndDecisionDateBetween(RequestStatus.APPROVED, start, end),
                membershipRequestRepository.countByStatusAndDecisionDateBetween(RequestStatus.REJECTED, start, end),
                equipmentRequestRepository.countByCreatedAtBetween(start, end)
        );

        Instant generatedDate = Instant.now();
        AnnualReport report;
        try {
            report = AnnualReport.builder()
                    .year(year)
                    .generatedDate(generatedDate)
                    .statisticsJson(objectMapper.writeValueAsString(statistics))
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize report statistics", e);
        }

        // CdC §2.11: the report is the deliverable conditioning the yearly budget —
        // export it as a real PDF alongside the JSON statistics snapshot.
        byte[] pdf = pdfGenerator.render(year, statistics, generatedDate);
        StoredFile stored = fileStorageService.storeBytes(
                pdf, "reports", "rapport-activite-" + year + ".pdf", MediaType.APPLICATION_PDF_VALUE);
        report.setPdfPath(stored.relativePath());

        AnnualReport saved = reportRepository.save(report);
        auditService.record(AuditAction.CREATE, "AnnualReport", saved.getId(), "Annual report generated for " + year);
        return toResponse(saved, statistics);
    }

    /**
     * Returns the stored PDF of a report as a downloadable resource, regenerating it
     * on the fly if the file is missing (report created before PDF export existed, or
     * storage cleaned up).
     */
    @Transactional
    public FileDownload download(int year) {
        AnnualReport report = reportRepository.findByYear(year)
                .orElseThrow(() -> new ResourceNotFoundException("No report found for year " + year));

        Path path = report.getPdfPath() != null ? fileStorageService.resolve(report.getPdfPath()) : null;
        if (path == null || !Files.exists(path)) {
            ReportStatistics statistics = readStatistics(report);
            if (statistics == null) {
                throw new ConflictException("Report statistics for " + year + " are unreadable; regenerate the report");
            }
            byte[] pdf = pdfGenerator.render(report.getYear(), statistics, report.getGeneratedDate());
            StoredFile stored = fileStorageService.storeBytes(
                    pdf, "reports", "rapport-activite-" + year + ".pdf", MediaType.APPLICATION_PDF_VALUE);
            report.setPdfPath(stored.relativePath());
            reportRepository.save(report);
            path = fileStorageService.resolve(stored.relativePath());
        }

        auditService.record(AuditAction.FILE_DOWNLOAD, "AnnualReport", report.getId(),
                "Annual report PDF downloaded for " + year);
        return new FileDownload("rapport-activite-" + year + ".pdf",
                MediaType.APPLICATION_PDF_VALUE, new FileSystemResource(path));
    }

    @Transactional(readOnly = true)
    public List<AnnualReportResponse> listAll() {
        return reportRepository.findAllByOrderByYearDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AnnualReportResponse getByYear(int year) {
        AnnualReport report = reportRepository.findByYear(year)
                .orElseThrow(() -> new ResourceNotFoundException("No report found for year " + year));
        return toResponse(report);
    }

    @Transactional
    public void delete(UUID id) {
        AnnualReport report = reportRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("AnnualReport", id));
        report.markDeleted();
        reportRepository.save(report);
        auditService.record(AuditAction.DELETE, "AnnualReport", id, "Annual report soft-deleted");
    }

    private AnnualReportResponse toResponse(AnnualReport r, ReportStatistics statistics) {
        return new AnnualReportResponse(r.getId(), r.getYear(), r.getGeneratedDate(), statistics, r.getPdfPath());
    }

    private AnnualReportResponse toResponse(AnnualReport r) {
        return new AnnualReportResponse(r.getId(), r.getYear(), r.getGeneratedDate(), readStatistics(r), r.getPdfPath());
    }

    private ReportStatistics readStatistics(AnnualReport r) {
        try {
            return objectMapper.readValue(r.getStatisticsJson(), ReportStatistics.class);
        } catch (Exception e) {
            return null;
        }
    }
}
