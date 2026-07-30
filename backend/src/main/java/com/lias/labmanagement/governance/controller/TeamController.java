package com.lias.labmanagement.governance.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.governance.dto.TeamRequest;
import com.lias.labmanagement.governance.dto.TeamResponse;
import com.lias.labmanagement.governance.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
@Tag(name = "Governance - Teams", description = "Research team management")
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    @Operation(summary = "List all research teams (public)")
    public ApiResponse<List<TeamResponse>> findAll() {
        return ApiResponse.of(teamService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a team by id (public)")
    public ApiResponse<TeamResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(teamService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Create a new research team")
    public ApiResponse<TeamResponse> create(@Valid @RequestBody TeamRequest request) {
        return ApiResponse.of(teamService.create(request), "Team created");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Update a research team")
    public ApiResponse<TeamResponse> update(@PathVariable UUID id, @Valid @RequestBody TeamRequest request) {
        return ApiResponse.of(teamService.update(id, request), "Team updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Archive a research team (soft delete)")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        teamService.delete(id);
        return ApiResponse.message("Team archived");
    }
}
