package com.lias.labmanagement.membershiprequest.controller;

import com.lias.labmanagement.common.enums.RequestStatus;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.membershiprequest.dto.ApproveRequest;
import com.lias.labmanagement.membershiprequest.dto.MembershipRequestResponse;
import com.lias.labmanagement.membershiprequest.dto.MembershipRequestSubmission;
import com.lias.labmanagement.membershiprequest.dto.RejectRequest;
import com.lias.labmanagement.membershiprequest.service.MembershipRequestService;
import com.lias.labmanagement.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/membership-requests")
@RequiredArgsConstructor
@Tag(name = "Membership Requests", description = "Public application, director approval/rejection workflow")
public class MembershipRequestController {

    private final MembershipRequestService service;

    @PostMapping(path = "/public", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit a new membership application (public, no authentication required)")
    public ApiResponse<MembershipRequestResponse> submit(
            @Valid @RequestPart("data") MembershipRequestSubmission submission,
            @RequestPart(value = "cv", required = false) MultipartFile cv) {
        return ApiResponse.of(service.submit(submission, cv), "Application submitted successfully");
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "List membership requests filtered by status")
    public ApiResponse<PageResponse<MembershipRequestResponse>> findByStatus(
            @RequestParam(required = false, defaultValue = "PENDING") RequestStatus status, @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.findByStatus(status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Get a single membership request")
    public ApiResponse<MembershipRequestResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(service.getById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('DIRECTOR')")
    @Operation(summary = "Approve a membership request (Director only): creates the account automatically")
    public ApiResponse<MembershipRequestResponse> approve(@PathVariable UUID id,
                                                           @AuthenticationPrincipal CustomUserDetails currentUser,
                                                           @RequestBody(required = false) ApproveRequest request) {
        String note = request != null ? request.decisionNote() : null;
        return ApiResponse.of(service.approve(id, currentUser.getId(), note), "Membership request approved");
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('DIRECTOR')")
    @Operation(summary = "Reject a membership request (Director only)")
    public ApiResponse<MembershipRequestResponse> reject(@PathVariable UUID id,
                                                          @AuthenticationPrincipal CustomUserDetails currentUser,
                                                          @RequestBody(required = false) RejectRequest request) {
        String note = request != null ? request.decisionNote() : null;
        return ApiResponse.of(service.reject(id, currentUser.getId(), note), "Membership request rejected");
    }
}
