package com.lias.labmanagement.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lias.labmanagement.audit.entity.AuditLog;
import com.lias.labmanagement.common.enums.AuditAction;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

/**
 * What reaches the audit table, and what a failure to write it does to the caller.
 * The transactional behaviour itself is exercised on a real stack by
 * {@link AuditTrailIntegrationTest}.
 */
@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock private AuditLogWriter writer;

    private AuditService service() {
        return new AuditService(writer, new ObjectMapper());
    }

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void theShortOverloadWritesThroughTheTransactionalWriter() {
        service().record(AuditAction.CREATE, "Event", UUID.randomUUID(), "Event created");

        verify(writer).write(any(AuditLog.class));
    }

    @Test
    void clientSuppliedValuesAreBoundedToTheirColumns() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // A spoofed X-Forwarded-For must be ignored; the recorded address is the socket one.
        request.addHeader("X-Forwarded-For", "203.0.113.7, " + "10.0.0.1, ".repeat(20));
        request.setRemoteAddr("198.51.100.4");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        service().record(AuditAction.LOGIN_FAILED, "User", "a".repeat(300) + "@example.org", "d".repeat(900));

        ArgumentCaptor<AuditLog> written = ArgumentCaptor.forClass(AuditLog.class);
        verify(writer).write(written.capture());
        AuditLog entry = written.getValue();
        assertThat(entry.getIpAddress()).isEqualTo("198.51.100.4");
        assertThat(entry.getEntityId()).hasSize(AuditLog.ENTITY_ID_LENGTH);
        assertThat(entry.getDetails()).hasSize(AuditLog.DETAILS_LENGTH);
    }

    @Test
    void aTraceThatCannotBeWrittenNeverReachesTheCaller() {
        doThrow(new IllegalStateException("database unavailable")).when(writer).write(any());

        assertThatCode(() -> service().record(AuditAction.DELETE, "Member", UUID.randomUUID(), "archived"))
                .doesNotThrowAnyException();
    }
}
