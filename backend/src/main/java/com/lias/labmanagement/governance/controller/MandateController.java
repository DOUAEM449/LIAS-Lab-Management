package com.lias.labmanagement.governance.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.governance.dto.AssignMandateRequest;
import com.lias.labmanagement.governance.dto.EndMandateRequest;
import com.lias.labmanagement.governance.dto.MandateResponse;
import com.lias.labmanagement.governance.service.MandateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mandates")
@RequiredArgsConstructor
@Tag(name = "Governance - Mandates", description = "Director/Vice-Director/Team Leader mandate management")
public class MandateController {

    private final MandateService mandateService;

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List all currently active mandates")
    public ApiResponse<List<MandateResponse>> findActive() {
        return ApiResponse.of(mandateService.findActive());
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Full mandate history of a member")
    public ApiResponse<List<MandateResponse>> byMember(@PathVariable UUID memberId) {
        return ApiResponse.of(mandateService.findByMember(memberId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Assign a governance mandate to a member (historized)")
    public ApiResponse<MandateResponse> assign(@Valid @RequestBody AssignMandateRequest request) {
        return ApiResponse.of(mandateService.assign(request), "Mandate assigned");
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "End an active mandate")
    public ApiResponse<MandateResponse> end(@PathVariable UUID id, @Valid @RequestBody EndMandateRequest request) {
        return ApiResponse.of(mandateService.end(id, request), "Mandate ended");
    }
}
