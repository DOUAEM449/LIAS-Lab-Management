package com.lias.labmanagement.report.service;

import com.lias.labmanagement.common.enums.NotificationType;
import com.lias.labmanagement.notification.service.NotificationService;
import com.lias.labmanagement.report.dto.AnnualReportResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Produces the annual activity report automatically (CdC §2.11 — "génération
 * annuelle automatique"), so the laboratory never has to remember to build the
 * document its yearly budget depends on.
 * <p>
 * The job runs once a year and closes the <em>previous</em> calendar year, which is
 * the only year whose figures are final. It is idempotent: if the report already
 * exists (because someone generated it manually beforehand) it does nothing. The
 * schedule itself is configurable through {@code app.reports.annual-cron} rather
 * than hard-coded, and defaults to 1 January at 02:00.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnnualReportScheduler {

    private final ReportService reportService;
    private final NotificationService notificationService;

    @Scheduled(cron = "${app.reports.annual-cron:0 0 2 1 1 *}", zone = "${app.reports.annual-zone:Africa/Casablanca}")
    public void generatePreviousYearReport() {
        int year = LocalDate.now().getYear() - 1;

        if (reportService.existsForYear(year)) {
            log.info("Annual report for {} already exists — automatic generation skipped", year);
            return;
        }

        try {
            AnnualReportResponse report = reportService.generate(year);
            log.info("Annual report for {} generated automatically ({})", year, report.id());
            notificationService.notifyGovernance(NotificationType.SYSTEM,
                    "Le rapport d'activité " + year + " a été généré automatiquement.",
                    "AnnualReport", report.id());
        } catch (Exception ex) {
            // Never let a scheduled failure take the application down; the report stays
            // generatable manually from the Rapports page.
            log.error("Automatic generation of the {} annual report failed: {}", year, ex.getMessage(), ex);
        }
    }
}
