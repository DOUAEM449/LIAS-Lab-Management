package com.lias.labmanagement.auth.controller;

import com.lias.labmanagement.auth.dto.AuthResponse;
import com.lias.labmanagement.auth.dto.ChangePasswordRequest;
import com.lias.labmanagement.auth.dto.CurrentUserResponse;
import com.lias.labmanagement.auth.dto.ForgotPasswordRequest;
import com.lias.labmanagement.auth.dto.LoginRequest;
import com.lias.labmanagement.auth.dto.RefreshTokenRequest;
import com.lias.labmanagement.auth.dto.ResetPasswordRequest;
import com.lias.labmanagement.auth.service.AuthService;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, logout, refresh, forgot/reset password")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email and password, returns JWT access/refresh tokens")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.of(authService.login(request), "Login successful");
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a valid refresh token for a new access/refresh token pair")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.of(authService.refresh(request.refreshToken()), "Token refreshed");
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Operation(summary = "Request a password reset email")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ApiResponse.message("If this email is registered, a reset link has been sent");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using the token received by email")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ApiResponse.message("Password has been reset successfully");
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password of the currently authenticated user")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal CustomUserDetails user,
                                             @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user.getId(), request);
        return ApiResponse.message("Password changed successfully");
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Logout (stateless: client discards tokens, endpoint kept for auditing/UX)")
    public ApiResponse<Void> logout() {
        return ApiResponse.message("Logged out successfully");
    }

    @PostMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Return the currently authenticated user's identity")
    public ApiResponse<CurrentUserResponse> me(@AuthenticationPrincipal CustomUserDetails user) {
        return ApiResponse.of(new CurrentUserResponse(user.getId(), user.getUsername(), user.getRole(),
                false));
    }
}
