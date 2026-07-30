package com.lias.labmanagement.administration.controller;

import com.lias.labmanagement.administration.dto.AuditLogResponse;
import com.lias.labmanagement.administration.service.AuditLogViewService;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
@Tag(name = "Administration - Audit", description = "Read-only view of the audit trail")
public class AuditLogController {

    private final AuditLogViewService service;

    @GetMapping
    @Operation(summary = "List every audit entry")
    public ApiResponse<PageResponse<AuditLogResponse>> list(@ParameterObject Pageable pageable) {
        return ApiResponse.of(service.list(pageable));
    }

    @GetMapping("/by-entity")
    @Operation(summary = "List audit entries for a given entity")
    public ApiResponse<PageResponse<AuditLogResponse>> byEntity(@RequestParam String entityType,
                                                                 @RequestParam String entityId,
                                                                 @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.byEntity(entityType, entityId, pageable));
    }

    @GetMapping("/by-actor/{actorId}")
    @Operation(summary = "List audit entries performed by a given user")
    public ApiResponse<PageResponse<AuditLogResponse>> byActor(@PathVariable UUID actorId, @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.byActor(actorId, pageable));
    }
}
