package com.lias.labmanagement.report.service;

import com.lias.labmanagement.common.exception.FileStorageException;
import com.lias.labmanagement.laboratory.entity.Laboratory;
import com.lias.labmanagement.laboratory.repository.LaboratoryRepository;
import com.lias.labmanagement.report.dto.ReportStatistics;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Renders an {@link com.lias.labmanagement.report.entity.AnnualReport} into a
 * printable PDF (CdC §2.11 — the annual activity report is the document the
 * laboratory submits to obtain its yearly budget, so it must exist as a real
 * deliverable, not only as an on-screen counter).
 * <p>
 * Deliberately dependency-light: plain OpenPDF primitives, no templating
 * engine, using the institutional identity stored in {@link Laboratory}.
 */
@Component
@RequiredArgsConstructor
public class AnnualReportPdfGenerator {

    private static final Color NAVY = new Color(28, 38, 56);
    private static final Color BLUE = new Color(45, 92, 160);
    private static final Color MUTED = new Color(110, 118, 130);
    private static final Color ROW_TINT = new Color(246, 248, 251);
    private static final Color BORDER = new Color(223, 228, 235);

    private static final DateTimeFormatter GENERATED_AT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm").withZone(ZoneId.systemDefault());

    private final LaboratoryRepository laboratoryRepository;

    public byte[] render(int year, ReportStatistics stats, Instant generatedDate) {
        Laboratory lab = laboratoryRepository.findAll().stream().findFirst().orElse(null);
        String labName = lab != null ? lab.getName() : "Laboratoire LIAS";

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 56, 56, 54, 54);
        try {
            PdfWriter.getInstance(document, out);
            document.addTitle("Rapport d'activité " + year + " — " + labName);
            document.addCreator("LIAS Lab Management System");
            document.open();

            document.add(header(labName, year));
            document.add(spacer(18));
            document.add(sectionTitle("Synthèse de l'activité"));
            document.add(spacer(8));
            document.add(statisticsTable(stats));
            document.add(spacer(18));
            document.add(sectionTitle("Lecture des indicateurs"));
            document.add(spacer(6));
            document.add(commentary(year, stats));
            document.add(spacer(26));
            document.add(footer(generatedDate));

            document.close();
        } catch (Exception e) {
            throw new FileStorageException("Failed to render the annual report PDF for " + year, e);
        }
        return out.toByteArray();
    }

    private Element header(String labName, int year) {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);

        PdfPCell name = borderless(new Phrase(labName, font(15, Font.BOLD, NAVY)));
        PdfPCell subtitle = borderless(new Phrase(
                "Faculté des Sciences Ben M'Sik — Université Hassan II de Casablanca", font(9.5f, Font.NORMAL, MUTED)));
        PdfPCell title = borderless(new Phrase("Rapport d'activité annuel — " + year, font(20, Font.BOLD, BLUE)));
        title.setPaddingTop(16);

        table.addCell(name);
        table.addCell(subtitle);
        table.addCell(title);
        return table;
    }

    private Element sectionTitle(String label) {
        Paragraph paragraph = new Paragraph(label.toUpperCase(), font(9.5f, Font.BOLD, MUTED));
        paragraph.setSpacingBefore(4);
        return paragraph;
    }

    private Element statisticsTable(ReportStatistics stats) {
        PdfPTable table = new PdfPTable(new float[]{3.2f, 1f});
        table.setWidthPercentage(100);

        table.addCell(headerCell("Indicateur"));
        table.addCell(headerCell("Valeur"));

        List<Row> rows = List.of(
                new Row("Membres du laboratoire", stats.totalMembers()),
                new Row("Publications scientifiques de l'année", stats.totalPublicationsThisYear()),
                new Row("Événements scientifiques organisés", stats.totalEventsThisYear()),
                new Row("Demandes d'adhésion acceptées", stats.approvedMembershipRequestsThisYear()),
                new Row("Demandes d'adhésion refusées", stats.rejectedMembershipRequestsThisYear()),
                new Row("Demandes de matériel soumises", stats.equipmentRequestsThisYear())
        );

        boolean tinted = false;
        for (Row row : rows) {
            table.addCell(bodyCell(row.label(), font(10.5f, Font.NORMAL, NAVY), Element.ALIGN_LEFT, tinted));
            table.addCell(bodyCell(String.valueOf(row.value()), font(11.5f, Font.BOLD, BLUE), Element.ALIGN_RIGHT, tinted));
            tinted = !tinted;
        }
        return table;
    }

    private Element commentary(int year, ReportStatistics stats) {
        long decided = stats.approvedMembershipRequestsThisYear() + stats.rejectedMembershipRequestsThisYear();
        StringBuilder text = new StringBuilder();
        text.append("Au cours de l'année ").append(year).append(", le laboratoire a produit ")
                .append(stats.totalPublicationsThisYear()).append(" publication(s) scientifique(s) et organisé ")
                .append(stats.totalEventsThisYear()).append(" événement(s) scientifique(s). ");
        if (decided > 0) {
            text.append(decided).append(" demande(s) d'adhésion ont été instruites, dont ")
                    .append(stats.approvedMembershipRequestsThisYear()).append(" acceptée(s). ");
        } else {
            text.append("Aucune demande d'adhésion n'a été instruite sur la période. ");
        }
        text.append("L'effectif enregistré s'établit à ").append(stats.totalMembers()).append(" membre(s), ")
                .append("historique des affiliations inclus.");

        Paragraph paragraph = new Paragraph(text.toString(), font(10.5f, Font.NORMAL, NAVY));
        paragraph.setAlignment(Element.ALIGN_JUSTIFIED);
        paragraph.setLeading(16);
        return paragraph;
    }

    private Element footer(Instant generatedDate) {
        Paragraph paragraph = new Paragraph(
                "Document généré automatiquement par la plateforme LIAS le " + GENERATED_AT.format(generatedDate) + ".",
                font(8.5f, Font.ITALIC, MUTED));
        paragraph.setAlignment(Element.ALIGN_CENTER);
        return paragraph;
    }

    private PdfPCell headerCell(String label) {
        PdfPCell cell = new PdfPCell(new Phrase(label.toUpperCase(), font(8.5f, Font.BOLD, MUTED)));
        cell.setBackgroundColor(ROW_TINT);
        cell.setBorderColor(BORDER);
        cell.setPadding(9);
        return cell;
    }

    private PdfPCell bodyCell(String value, Font font, int alignment, boolean tinted) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBorderColor(BORDER);
        cell.setPadding(9);
        if (tinted) {
            cell.setBackgroundColor(ROW_TINT);
        }
        return cell;
    }

    private PdfPCell borderless(Phrase phrase) {
        PdfPCell cell = new PdfPCell(phrase);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0);
        return cell;
    }

    private Element spacer(float height) {
        Paragraph paragraph = new Paragraph(" ");
        paragraph.setLeading(height);
        return paragraph;
    }

    private Font font(float size, int style, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, color);
    }

    private record Row(String label, long value) {
    }
}
