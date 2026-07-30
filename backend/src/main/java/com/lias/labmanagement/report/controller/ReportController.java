package com.lias.labmanagement.report.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.report.dto.AnnualReportResponse;
import com.lias.labmanagement.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
@Tag(name = "Reports", description = "Yearly aggregated activity reports")
public class ReportController {

    private final ReportService service;

    @GetMapping
    @Operation(summary = "List every generated annual report")
    public ApiResponse<List<AnnualReportResponse>> listAll() {
        return ApiResponse.of(service.listAll());
    }

    @GetMapping("/{year}")
    @Operation(summary = "Get the report for a specific year")
    public ApiResponse<AnnualReportResponse> getByYear(@PathVariable int year) {
        return ApiResponse.of(service.getByYear(year));
    }

    @PostMapping("/{year}/generate")
    @Operation(summary = "Generate the annual report for a given year")
    public ApiResponse<AnnualReportResponse> generate(@PathVariable int year) {
        return ApiResponse.of(service.generate(year), "Annual report generated");
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an annual report")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Report deleted");
    }
}
