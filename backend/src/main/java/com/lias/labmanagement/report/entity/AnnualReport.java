package com.lias.labmanagement.report.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * Generated yearly activity report aggregating statistics (publications,
 * events, membership evolution, equipment...) as a JSON snapshot, with an
 * optional exported PDF.
 */
@Entity
@Table(name = "annual_reports", indexes = {
        @Index(name = "idx_annual_reports_year", columnList = "report_year", unique = true)
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class AnnualReport extends BaseEntity {

    @Column(name = "report_year", nullable = false, unique = true)
    private int year;

    @Column(name = "generated_date", nullable = false)
    private Instant generatedDate;

    @Column(name = "statistics_json", nullable = false, columnDefinition = "TEXT")
    private String statisticsJson;

    @Column(name = "pdf_path")
    private String pdfPath;
}
