package com.lias.labmanagement.document.controller;

import com.lias.labmanagement.common.enums.DocumentCategory;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.document.dto.DocumentMetadataRequest;
import com.lias.labmanagement.document.dto.DocumentResponse;
import com.lias.labmanagement.document.dto.DocumentVersionResponse;
import com.lias.labmanagement.document.service.DocumentService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Documents", description = "Centralized document repository with full version history")
public class DocumentController {

    private final DocumentService service;

    @GetMapping
    @Operation(summary = "Search / list documents")
    public ApiResponse<PageResponse<DocumentResponse>> search(
            @RequestParam(required = false) DocumentCategory category,
            @RequestParam(required = false, defaultValue = "") String query,
            @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.search(category, query, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single document")
    public ApiResponse<DocumentResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(service.getById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a new document")
    public ApiResponse<DocumentResponse> upload(@Valid @RequestPart("metadata") DocumentMetadataRequest metadata,
                                                 @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(service.upload(metadata, file), "Document uploaded");
    }

    @PostMapping(path = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a new version of an existing document")
    public ApiResponse<DocumentResponse> uploadNewVersion(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(service.uploadNewVersion(id, file), "New version uploaded");
    }

    @GetMapping("/{id}/versions")
    @Operation(summary = "List all versions of a document")
    public ApiResponse<List<DocumentVersionResponse>> getVersions(@PathVariable UUID id) {
        return ApiResponse.of(service.getVersions(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update document metadata")
    public ApiResponse<DocumentResponse> updateMetadata(@PathVariable UUID id, @Valid @RequestBody DocumentMetadataRequest metadata) {
        return ApiResponse.of(service.updateMetadata(id, metadata), "Document metadata updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Soft-delete a document")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Document deleted");
    }
}
