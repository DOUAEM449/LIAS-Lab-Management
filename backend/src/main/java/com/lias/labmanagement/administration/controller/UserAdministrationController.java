package com.lias.labmanagement.administration.controller;

import com.lias.labmanagement.administration.dto.CreateUserRequest;
import com.lias.labmanagement.administration.dto.UpdateUserRoleRequest;
import com.lias.labmanagement.administration.dto.UserAdminResponse;
import com.lias.labmanagement.administration.service.UserAdministrationService;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
@Tag(name = "Administration - Users", description = "Technical user account management (SYSTEM_ADMIN only)")
public class UserAdministrationController {

    private final UserAdministrationService service;

    @GetMapping
    @Operation(summary = "List every technical user account")
    public ApiResponse<PageResponse<UserAdminResponse>> list(@ParameterObject Pageable pageable) {
        return ApiResponse.of(service.list(pageable));
    }

    @PostMapping
    @Operation(summary = "Create a new technical user account")
    public ApiResponse<UserAdminResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.of(service.create(request), "User created");
    }

    @PatchMapping("/{id}/enable")
    @Operation(summary = "Enable a user account")
    public ApiResponse<UserAdminResponse> enable(@PathVariable UUID id) {
        return ApiResponse.of(service.setEnabled(id, true), "User enabled");
    }

    @PatchMapping("/{id}/disable")
    @Operation(summary = "Disable a user account")
    public ApiResponse<UserAdminResponse> disable(@PathVariable UUID id) {
        return ApiResponse.of(service.setEnabled(id, false), "User disabled");
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Change a user's technical role")
    public ApiResponse<UserAdminResponse> updateRole(@PathVariable UUID id, @Valid @RequestBody UpdateUserRoleRequest request) {
        return ApiResponse.of(service.updateRole(id, request), "Role updated");
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a user account")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("User deleted");
    }
}
