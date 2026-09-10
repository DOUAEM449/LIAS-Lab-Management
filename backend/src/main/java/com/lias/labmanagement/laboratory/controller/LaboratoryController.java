package com.lias.labmanagement.laboratory.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.laboratory.dto.LaboratoryResponse;
import com.lias.labmanagement.laboratory.dto.LaboratoryUpdateRequest;
import com.lias.labmanagement.laboratory.service.LaboratoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Laboratory", description = "Institutional identity of the laboratory (CdC §4.1)")
public class LaboratoryController {

    private final LaboratoryService service;

    @GetMapping("/api/v1/public/laboratory")
    @Operation(summary = "Public laboratory information (no authentication required)")
    public ApiResponse<LaboratoryResponse> get() {
        return ApiResponse.of(service.get());
    }

    @PutMapping("/api/v1/laboratory")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Update the laboratory's administrative information (SYSTEM_ADMIN only)")
    public ApiResponse<LaboratoryResponse> update(@Valid @RequestBody LaboratoryUpdateRequest request) {
        return ApiResponse.of(service.update(request), "Laboratory information updated");
    }
}
