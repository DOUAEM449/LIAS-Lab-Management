package com.lias.labmanagement.report.repository;

import com.lias.labmanagement.report.entity.AnnualReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnnualReportRepository extends JpaRepository<AnnualReport, UUID> {
    Optional<AnnualReport> findByYear(int year);

    List<AnnualReport> findAllByOrderByYearDesc();

    /** Only a <em>live</em> report blocks a regeneration — an archived one must not. */
    boolean existsByYearAndDeletedFalse(int year);

    /**
     * Finds the report of a year <em>including</em> an archived one, which
     * {@code @SQLRestriction("deleted = false")} would otherwise hide.
     * <p>
     * Needed because {@code report_year} carries a UNIQUE constraint that does not
     * exclude soft-deleted rows: an archived report still occupies the slot for its
     * year, so regeneration must reuse that row instead of inserting a second one.
     */
    @Query(value = "select * from annual_reports where report_year = :year", nativeQuery = true)
    Optional<AnnualReport> findByYearIncludingArchived(@Param("year") int year);
}
