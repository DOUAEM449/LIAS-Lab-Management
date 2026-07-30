package com.lias.labmanagement.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lias.labmanagement.audit.entity.AuditLog;
import com.lias.labmanagement.audit.repository.AuditLogRepository;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;

/**
 * Central service used across every module to record traceable actions.
 * Runs in its own transaction (REQUIRES_NEW) so an audit write never rolls
 * back — and never causes a rollback of — the business transaction that
 * triggered it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditAction action, String entityType, Object entityId, Object oldValue, Object newValue, String details) {
        try {
            CustomUserDetails currentUser = currentUser();
            AuditLog log = AuditLog.builder()
                    .actorId(currentUser != null ? currentUser.getId() : null)
                    .actorEmail(currentUser != null ? currentUser.getUsername() : "system")
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId != null ? entityId.toString() : null)
                    .oldValue(serialize(oldValue))
                    .newValue(serialize(newValue))
                    .details(details)
                    .ipAddress(currentRequestIp())
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(log);
        } catch (Exception ex) {
            // Auditing must never break the business flow.
            log.warn("Failed to persist audit log for {} {}: {}", entityType, entityId, ex.getMessage());
        }
    }

    public void record(AuditAction action, String entityType, Object entityId, String details) {
        record(action, entityType, entityId, null, null, details);
    }

    private String serialize(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    private CustomUserDetails currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details;
        }
        return null;
    }

    private String currentRequestIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                return null;
            }
            HttpServletRequest request = attrs.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            return forwarded != null ? forwarded : request.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
