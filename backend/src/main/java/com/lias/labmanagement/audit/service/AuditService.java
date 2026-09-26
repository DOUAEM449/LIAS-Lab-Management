package com.lias.labmanagement.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lias.labmanagement.audit.entity.AuditLog;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;

/**
 * Central service used across every module to record traceable actions.
 * <p>
 * Each row is written by {@link AuditLogWriter} in its own transaction, so a trace outlives
 * the rollback of the operation it describes (a failed login, typically) and a trace that
 * cannot be written never cancels that operation: any failure, including one raised at
 * commit time, is caught here and logged.
 * <p>
 * Every bounded column is truncated to its width first. Several values come straight from
 * the client — the e-mail typed at login, the {@code X-Forwarded-For} header — and an
 * oversized one used to make the audited request fail.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogWriter writer;
    private final ObjectMapper objectMapper;

    public void record(AuditAction action, String entityType, Object entityId, Object oldValue, Object newValue, String details) {
        try {
            CustomUserDetails currentUser = currentUser();
            AuditLog entry = AuditLog.builder()
                    .actorId(currentUser != null ? currentUser.getId() : null)
                    .actorEmail(bounded(currentUser != null ? currentUser.getUsername() : "system",
                            AuditLog.ACTOR_EMAIL_LENGTH))
                    .action(action)
                    .entityType(bounded(entityType, AuditLog.ENTITY_TYPE_LENGTH))
                    .entityId(bounded(entityId != null ? entityId.toString() : null, AuditLog.ENTITY_ID_LENGTH))
                    .oldValue(serialize(oldValue))
                    .newValue(serialize(newValue))
                    .details(bounded(details, AuditLog.DETAILS_LENGTH))
                    .ipAddress(bounded(currentRequestIp(), AuditLog.IP_ADDRESS_LENGTH))
                    .createdAt(Instant.now())
                    .build();
            writer.write(entry);
        } catch (Exception ex) {
            // Auditing must never break the business flow.
            log.warn("Failed to persist audit log for {} {}: {}", entityType, entityId, ex.getMessage());
        }
    }

    public void record(AuditAction action, String entityType, Object entityId, String details) {
        record(action, entityType, entityId, null, null, details);
    }

    /** Truncates to the column width; a trace cut short is better than no trace at all. */
    static String bounded(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    /**
     * The client's address: the first hop of {@code X-Forwarded-For} when present, the
     * socket address otherwise. The header lists one address per proxy crossed
     * ("client, proxy1, proxy2"); only the first names the client, and the rest could
     * overflow the column.
     */
    static String clientAddress(String forwardedFor, String remoteAddress) {
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return remoteAddress;
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
            return clientAddress(request.getHeader("X-Forwarded-For"), request.getRemoteAddr());
        } catch (Exception e) {
            return null;
        }
    }
}
