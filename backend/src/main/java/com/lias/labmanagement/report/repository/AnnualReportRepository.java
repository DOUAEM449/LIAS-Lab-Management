package com.lias.labmanagement.report.repository;

import com.lias.labmanagement.report.entity.AnnualReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnnualReportRepository extends JpaRepository<AnnualReport, UUID> {
    Optional<AnnualReport> findByYear(int year);

    List<AnnualReport> findAllByOrderByYearDesc();

    boolean existsByYear(int year);
}
