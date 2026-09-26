package com.lias.labmanagement.audit.service;

import com.lias.labmanagement.audit.repository.AuditLogRepository;
import com.lias.labmanagement.common.enums.AuditAction;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The audit trail against the real transaction machinery — Spring proxies, Hibernate, H2 —
 * because the defect it pins was invisible to any test that mocks the repository.
 * <p>
 * Two promises: a trace outlives the rollback of the operation it describes (that is the
 * only way a failed login is ever recorded), and a trace that cannot be written never takes
 * the operation down with it.
 */
@SpringBootTest(properties = "spring.config.import=")
@ActiveProfiles("test")
class AuditTrailIntegrationTest {

    @Autowired private AuditService auditService;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    @Test
    void aTraceSurvivesTheRollbackOfTheOperationItDescribes() {
        String marker = "rollback-" + UUID.randomUUID();
        TransactionTemplate operation = new TransactionTemplate(transactionManager);

        assertThatThrownBy(() -> operation.executeWithoutResult(status -> {
            auditService.record(AuditAction.LOGIN_FAILED, "User", marker, "Failed login attempt");
            throw new IllegalStateException("authentication failed");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(auditLogRepository.findByEntityTypeAndEntityId("User", marker, PageRequest.of(0, 5)))
                .hasSize(1);
    }

    @Test
    void anOversizedTraceNeverRollsBackTheOperationItDescribes() {
        TransactionTemplate operation = new TransactionTemplate(transactionManager);

        // 900 characters for a 500-character column. When the audit row shared the caller's
        // transaction, its failure at commit cancelled the audited operation itself.
        assertThatCode(() -> operation.executeWithoutResult(status ->
                auditService.record(AuditAction.CREATE, "Event", UUID.randomUUID(), "x".repeat(900))))
                .doesNotThrowAnyException();
    }
}
