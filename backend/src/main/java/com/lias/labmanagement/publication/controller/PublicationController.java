package com.lias.labmanagement.publication.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.publication.dto.PublicationRequest;
import com.lias.labmanagement.publication.dto.PublicationResponse;
import com.lias.labmanagement.publication.service.PublicationService;
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
@RequestMapping("/api/v1/publications")
@RequiredArgsConstructor
@Tag(name = "Publications", description = "Scientific publications, public listing and authenticated management")
public class PublicationController {

    private final PublicationService service;

    @GetMapping
    @Operation(summary = "Search / list publications (public read access) — filterable by year, team and/or author")
    public ApiResponse<PageResponse<PublicationResponse>> search(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) UUID teamId,
            @RequestParam(required = false) UUID authorId,
            @RequestParam(required = false, defaultValue = "") String query,
            @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.search(year, teamId, authorId, query, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single publication (public read access)")
    public ApiResponse<PublicationResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER','PERMANENT_MEMBER','ASSOCIATE_MEMBER','PHD_STUDENT')")
    @Operation(summary = "Create a new publication")
    public ApiResponse<PublicationResponse> create(@Valid @RequestBody PublicationRequest request) {
        return ApiResponse.of(service.create(request), "Publication created");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER','PERMANENT_MEMBER','ASSOCIATE_MEMBER','PHD_STUDENT')")
    @Operation(summary = "Update an existing publication")
    public ApiResponse<PublicationResponse> update(@PathVariable UUID id, @Valid @RequestBody PublicationRequest request) {
        return ApiResponse.of(service.update(id, request), "Publication updated");
    }

    @PostMapping(path = "/{id}/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER','PERMANENT_MEMBER','ASSOCIATE_MEMBER','PHD_STUDENT')")
    @Operation(summary = "Upload the PDF file for a publication")
    public ApiResponse<PublicationResponse> uploadPdf(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(service.uploadPdf(id, file), "PDF uploaded");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Soft-delete a publication")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Publication deleted");
    }
}
