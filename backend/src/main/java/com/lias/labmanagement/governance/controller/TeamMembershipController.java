package com.lias.labmanagement.governance.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.governance.dto.TeamMembershipHistoryResponse;
import com.lias.labmanagement.governance.dto.TransferTeamRequest;
import com.lias.labmanagement.governance.service.TeamMembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/team-memberships")
@RequiredArgsConstructor
@Tag(name = "Governance - Team Membership", description = "Historized team membership assignment")
public class TeamMembershipController {

    private final TeamMembershipService teamMembershipService;

    @GetMapping("/member/{memberId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Full team membership history of a member")
    public ApiResponse<List<TeamMembershipHistoryResponse>> history(@PathVariable UUID memberId) {
        return ApiResponse.of(teamMembershipService.history(memberId));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Transfer a member to a different team (historized)")
    public ApiResponse<Void> transfer(@Valid @RequestBody TransferTeamRequest request) {
        teamMembershipService.transfer(request);
        return ApiResponse.message("Member transferred successfully");
    }
}
