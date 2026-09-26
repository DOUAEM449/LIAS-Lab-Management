package com.lias.labmanagement.audit.service;

import com.lias.labmanagement.audit.entity.AuditLog;
import com.lias.labmanagement.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists one audit row in a transaction of its own, committed before control returns to
 * the audited operation.
 * <p>
 * This lives in a separate bean on purpose. Spring applies {@code @Transactional} through a
 * proxy, and a call made from inside {@link AuditService} to one of its own methods never
 * crosses that proxy: the {@code REQUIRES_NEW} was silently ignored, the trace joined the
 * caller's transaction, and it was rolled back with it — which is why no failed login was
 * ever recorded. Calling across beans is what makes the propagation real.
 */
@Component
@RequiredArgsConstructor
public class AuditLogWriter {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(AuditLog entry) {
        auditLogRepository.save(entry);
    }
}
