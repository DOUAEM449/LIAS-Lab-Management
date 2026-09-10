package com.lias.labmanagement.administration.service;

import com.lias.labmanagement.administration.dto.CreateUserRequest;
import com.lias.labmanagement.administration.dto.UpdateUserRoleRequest;
import com.lias.labmanagement.administration.dto.UserAdminResponse;
import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.ConflictException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.governance.service.UserRoleSyncService;
import com.lias.labmanagement.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * System-administrator operations on technical user accounts: creation,
 * enable/disable, role changes. Every mutation is written to the audit
 * trail. All endpoints exposed on top of this service are restricted to
 * {@code SYSTEM_ADMIN} at the controller level.
 */
@Service
@RequiredArgsConstructor
public class UserAdministrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final UserRoleSyncService userRoleSyncService;

    @Transactional(readOnly = true)
    public PageResponse<UserAdminResponse> list(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional
    public UserAdminResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A user with this email already exists");
        }
        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.temporaryPassword()))
                .role(request.role())
                .enabled(true)
                .mustChangePassword(true)
                .failedLoginAttempts(0)
                .build();
        User saved = userRepository.save(user);
        auditService.record(AuditAction.CREATE, "User", saved.getId(), "User account created: " + saved.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public UserAdminResponse setEnabled(UUID id, boolean enabled) {
        User user = getUser(id);
        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        auditService.record(AuditAction.STATUS_CHANGE, "User", id,
                (enabled ? "User enabled: " : "User disabled: ") + user.getEmail());
        return toResponse(saved);
    }

    /**
     * Direct SYSTEM_ADMIN override of a user's effective role. Still historized like any
     * other role change (see {@link UserRoleSyncService}). Note: for accounts linked to a
     * Member profile, this value will be recomputed and may be overwritten the next time
     * that member's status or mandate changes — it is not a permanent pin, only a
     * point-in-time correction (e.g. bootstrapping SYSTEM_ADMIN itself, which has no
     * Member/Mandate counterpart to derive a role from).
     */
    @Transactional
    public UserAdminResponse updateRole(UUID id, UpdateUserRoleRequest request) {
        User user = getUser(id);
        String oldRole = user.getRole().name();
        userRoleSyncService.overrideRole(user, request.role(), currentActorId());
        auditService.record(AuditAction.ROLE_CHANGE, "User", id,
                "Role changed from " + oldRole + " to " + request.role());
        return toResponse(user);
    }

    private UUID currentActorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details.getId();
        }
        return null;
    }

    @Transactional
    public void delete(UUID id) {
        User user = getUser(id);
        user.markDeleted();
        userRepository.save(user);
        auditService.record(AuditAction.DELETE, "User", id, "User account soft-deleted: " + user.getEmail());
    }

    private User getUser(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("User", id));
    }

    private UserAdminResponse toResponse(User u) {
        return new UserAdminResponse(u.getId(), u.getEmail(), u.getRole(), u.isEnabled(),
                u.isMustChangePassword(), u.getLastLoginAt(), u.getFailedLoginAttempts());
    }
}
