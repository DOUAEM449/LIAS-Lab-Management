package com.lias.labmanagement.auth.service;

import com.lias.labmanagement.auth.dto.AuthResponse;
import com.lias.labmanagement.auth.dto.ChangePasswordRequest;
import com.lias.labmanagement.auth.dto.LoginRequest;
import com.lias.labmanagement.auth.entity.PasswordResetToken;
import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.PasswordResetTokenRepository;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.exception.UnauthorizedException;
import com.lias.labmanagement.common.mail.MailService;
import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.security.CustomUserDetails;
import com.lias.labmanagement.security.CustomUserDetailsService;
import com.lias.labmanagement.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final AuditService auditService;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
            CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setLastLoginAt(Instant.now());
            user.setFailedLoginAttempts(0);
            userRepository.save(user);

            String accessToken = jwtService.generateAccessToken(principal);
            String refreshToken = jwtService.generateRefreshToken(principal);

            // Publish the authenticated principal before auditing: the login request
            // arrives anonymous, so without this the LOGIN row would be attributed to
            // "system" instead of naming who actually signed in.
            SecurityContextHolder.getContext().setAuthentication(authentication);
            auditService.record(AuditAction.LOGIN, "User", user.getId(), "Successful login");

            return AuthResponse.of(accessToken, refreshToken, user.getId(), user.getEmail(), user.getRole());
        } catch (org.springframework.security.core.AuthenticationException ex) {
            userRepository.findByEmailIgnoreCaseAndDeletedFalse(request.email()).ifPresent(user -> {
                user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
                userRepository.save(user);
            });
            auditService.record(AuditAction.LOGIN_FAILED, "User", request.email(), "Failed login attempt");
            throw ex;
        }
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        String tokenType = jwtService.extractTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmailIgnoreCaseAndDeletedFalse(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        CustomUserDetails principal = (CustomUserDetails) userDetailsService.loadUserByUsername(email);
        if (!jwtService.isTokenValid(refreshToken, principal)) {
            throw new UnauthorizedException("Refresh token expired or invalid");
        }
        // Re-checked here too: a member frozen/deactivated after their refresh token was
        // issued must not be able to mint a fresh access token.
        if (!principal.isEnabled()) {
            throw new UnauthorizedException("Your account has been frozen or disabled");
        }

        String newAccessToken = jwtService.generateAccessToken(principal);
        String newRefreshToken = jwtService.generateRefreshToken(principal);
        return AuthResponse.of(newAccessToken, newRefreshToken, user.getId(), user.getEmail(), user.getRole());
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCaseAndDeletedFalse(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(token)
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .used(false)
                    .createdAt(Instant.now())
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
            mailService.send(user.getEmail(), "LIAS Laboratory - Password Reset",
                    "You requested a password reset. Use the link below (valid 1 hour):\n" + resetLink
                            + "\n\nIf you did not request this, please ignore this email.");
        });
        // Always respond the same way, whether or not the email exists, to avoid user enumeration.
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        auditService.record(AuditAction.PASSWORD_RESET, "User", user.getId(), "Password reset via email token");
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        auditService.record(AuditAction.PASSWORD_RESET, "User", user.getId(), "Password changed by user");
    }
}
