package com.lias.labmanagement.equipment.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.equipment.dto.DistributionRequest;
import com.lias.labmanagement.equipment.dto.DistributionResponse;
import com.lias.labmanagement.equipment.dto.EquipmentResponse;
import com.lias.labmanagement.equipment.dto.EquipmentUpsertRequest;
import com.lias.labmanagement.equipment.dto.NonRecipientResponse;
import com.lias.labmanagement.equipment.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// CdC matrix: Doctorants have NO access to internal modules (Equipment, Meetings, Administration).
@RestController
@RequestMapping("/api/v1/equipment")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER','PERMANENT_MEMBER','ASSOCIATE_MEMBER')")
@Tag(name = "Equipment", description = "Laboratory equipment inventory and distribution tracking")
public class EquipmentController {

    private final EquipmentService service;

    @GetMapping
    @Operation(summary = "Search / list equipment")
    public ApiResponse<PageResponse<EquipmentResponse>> search(
            @RequestParam(required = false, defaultValue = "") String query, @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.search(query, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single equipment item")
    public ApiResponse<EquipmentResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Add a new equipment item to the inventory")
    public ApiResponse<EquipmentResponse> create(@Valid @RequestBody EquipmentUpsertRequest request) {
        return ApiResponse.of(service.create(request), "Equipment added");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Update an equipment item")
    public ApiResponse<EquipmentResponse> update(@PathVariable UUID id, @Valid @RequestBody EquipmentUpsertRequest request) {
        return ApiResponse.of(service.update(id, request), "Equipment updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Soft-delete an equipment item")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Equipment deleted");
    }

    @PostMapping("/{id}/distributions")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Distribute equipment to a member")
    public ApiResponse<DistributionResponse> distribute(@PathVariable UUID id, @Valid @RequestBody DistributionRequest request) {
        return ApiResponse.of(service.distribute(id, request), "Equipment distributed");
    }

    @PostMapping("/distributions/{distributionId}/return")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Mark a distribution as returned")
    public ApiResponse<DistributionResponse> returnDistribution(@PathVariable UUID distributionId) {
        return ApiResponse.of(service.returnDistribution(distributionId), "Equipment returned");
    }

    @GetMapping("/{id}/distributions")
    @Operation(summary = "List distributions for a given equipment item")
    public ApiResponse<List<DistributionResponse>> getDistributionsForEquipment(@PathVariable UUID id) {
        return ApiResponse.of(service.getDistributionsForEquipment(id));
    }

    @GetMapping("/members/{memberId}/distributions")
    @Operation(summary = "List equipment currently or previously held by a member")
    public ApiResponse<List<DistributionResponse>> getDistributionsForMember(@PathVariable UUID memberId) {
        return ApiResponse.of(service.getDistributionsForMember(memberId));
    }

    @GetMapping("/{id}/non-recipients")
    @Operation(summary = "List active members who have NOT received this equipment item")
    public ApiResponse<List<NonRecipientResponse>> getNonRecipients(@PathVariable UUID id) {
        return ApiResponse.of(service.getNonRecipients(id));
    }
}
