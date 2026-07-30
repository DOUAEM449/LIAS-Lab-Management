package com.lias.labmanagement.equipment.controller;

import com.lias.labmanagement.common.enums.EquipmentRequestStatus;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.equipment.dto.EquipmentRequestResponse;
import com.lias.labmanagement.equipment.dto.EquipmentRequestSubmission;
import com.lias.labmanagement.equipment.dto.ValidationDecisionRequest;
import com.lias.labmanagement.equipment.service.EquipmentRequestService;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/equipment-requests")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Equipment Requests", description = "Member requests for new equipment, validated by Director/Vice-Director")
public class EquipmentRequestController {

    private final EquipmentRequestService service;
    private final MemberRepository memberRepository;

    @PostMapping
    @Operation(summary = "Submit a new equipment request as the current member")
    public ApiResponse<EquipmentRequestResponse> submit(@Valid @RequestBody EquipmentRequestSubmission submission,
                                                         @AuthenticationPrincipal CustomUserDetails currentUser) {
        var member = memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new com.lias.labmanagement.common.exception.ResourceNotFoundException("No member profile linked to this account"));
        return ApiResponse.of(service.submit(member.getId(), submission), "Equipment request submitted");
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "List equipment requests filtered by status")
    public ApiResponse<PageResponse<EquipmentRequestResponse>> findByStatus(
            @RequestParam(required = false, defaultValue = "PENDING") EquipmentRequestStatus status, @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.findByStatus(status, pageable));
    }

    @GetMapping("/mine")
    @Operation(summary = "List the current member's own equipment requests")
    public ApiResponse<PageResponse<EquipmentRequestResponse>> findMine(@AuthenticationPrincipal CustomUserDetails currentUser, @ParameterObject Pageable pageable) {
        var member = memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new com.lias.labmanagement.common.exception.ResourceNotFoundException("No member profile linked to this account"));
        return ApiResponse.of(service.findByRequester(member.getId(), pageable));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Approve an equipment request")
    public ApiResponse<EquipmentRequestResponse> approve(@PathVariable UUID id,
                                                          @AuthenticationPrincipal CustomUserDetails currentUser,
                                                          @RequestBody(required = false) ValidationDecisionRequest request) {
        String note = request != null ? request.note() : null;
        return ApiResponse.of(service.decide(id, currentUser.getId(), EquipmentRequestStatus.APPROVED, note), "Request approved");
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Reject an equipment request")
    public ApiResponse<EquipmentRequestResponse> reject(@PathVariable UUID id,
                                                         @AuthenticationPrincipal CustomUserDetails currentUser,
                                                         @RequestBody(required = false) ValidationDecisionRequest request) {
        String note = request != null ? request.note() : null;
        return ApiResponse.of(service.decide(id, currentUser.getId(), EquipmentRequestStatus.REJECTED, note), "Request rejected");
    }
}
