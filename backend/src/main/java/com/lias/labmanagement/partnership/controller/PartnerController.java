package com.lias.labmanagement.partnership.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.partnership.dto.PartnerRequest;
import com.lias.labmanagement.partnership.dto.PartnerResponse;
import com.lias.labmanagement.partnership.service.PartnerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
@Tag(name = "Partnerships", description = "Institutional and industrial partners, public listing")
public class PartnerController {

    private final PartnerService service;

    @GetMapping
    @Operation(summary = "Search / list partners (public read access)")
    public ApiResponse<PageResponse<PartnerResponse>> search(
            @RequestParam(required = false, defaultValue = "") String query, @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.search(query, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single partner (public read access)")
    public ApiResponse<PartnerResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Create a new partner")
    public ApiResponse<PartnerResponse> create(@Valid @RequestBody PartnerRequest request) {
        return ApiResponse.of(service.create(request), "Partner created");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Update a partner")
    public ApiResponse<PartnerResponse> update(@PathVariable UUID id, @Valid @RequestBody PartnerRequest request) {
        return ApiResponse.of(service.update(id, request), "Partner updated");
    }

    @PostMapping(path = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Upload the logo for a partner")
    public ApiResponse<PartnerResponse> uploadLogo(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(service.uploadLogo(id, file), "Logo uploaded");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Soft-delete a partner")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Partner deleted");
    }
}
