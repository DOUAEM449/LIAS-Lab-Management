package com.lias.labmanagement.partnership.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.partnership.dto.AgreementRequest;
import com.lias.labmanagement.partnership.dto.AgreementResponse;
import com.lias.labmanagement.partnership.service.AgreementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agreements")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
@Tag(name = "Agreements", description = "Partnership agreements and contracts")
public class AgreementController {

    private final AgreementService service;

    @GetMapping
    @Operation(summary = "List agreements for a given partner")
    public ApiResponse<List<AgreementResponse>> getByPartner(@RequestParam UUID partnerId) {
        return ApiResponse.of(service.getByPartner(partnerId));
    }

    @PostMapping
    @Operation(summary = "Create a new agreement")
    public ApiResponse<AgreementResponse> create(@Valid @RequestBody AgreementRequest request) {
        return ApiResponse.of(service.create(request), "Agreement created");
    }

    @PostMapping(path = "/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload the signed document for an agreement")
    public ApiResponse<AgreementResponse> uploadDocument(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(service.uploadDocument(id, file), "Document uploaded");
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an agreement")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Agreement deleted");
    }
}
