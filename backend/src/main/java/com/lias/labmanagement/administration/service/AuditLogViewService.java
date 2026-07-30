package com.lias.labmanagement.administration.service;

import com.lias.labmanagement.administration.dto.AuditLogResponse;
import com.lias.labmanagement.audit.entity.AuditLog;
import com.lias.labmanagement.audit.repository.AuditLogRepository;
import com.lias.labmanagement.common.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Read-only access to the append-only audit trail, for SYSTEM_ADMIN and
 * governance roles investigating who did what and when.
 */
@Service
@RequiredArgsConstructor
public class AuditLogViewService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> list(Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAll(pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> byEntity(String entityType, String entityId, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> byActor(UUID actorId, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findByActorId(actorId, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    private AuditLogResponse toResponse(AuditLog l) {
        return new AuditLogResponse(l.getId(), l.getActorId(), l.getActorEmail(), l.getAction(),
                l.getEntityType(), l.getEntityId(), l.getDetails(), l.getIpAddress(), l.getCreatedAt());
    }
}
