package com.lias.labmanagement.audit.entity;

import com.lias.labmanagement.common.enums.AuditAction;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * Immutable trail of every important action performed in the system
 * (creation, update, deletion, approval, login...). Satisfies the
 * "every important action must be traceable" functional rule.
 * <p>
 * This table is intentionally append-only: rows are never updated or
 * deleted, so it does not extend {@code BaseEntity}.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @jakarta.persistence.Index(name = "idx_audit_actor", columnList = "actor_id"),
        @jakarta.persistence.Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
        @jakarta.persistence.Index(name = "idx_audit_created_at", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    /*
     * Column widths, shared with AuditService: an audit row is written from values the
     * caller does not control (an e-mail typed at login, a forwarded-for header), so every
     * bounded column is truncated to these sizes before it reaches the database.
     */
    public static final int ACTOR_EMAIL_LENGTH = 190;
    public static final int ENTITY_TYPE_LENGTH = 100;
    public static final int ENTITY_ID_LENGTH = 100;
    public static final int DETAILS_LENGTH = 500;
    public static final int IP_ADDRESS_LENGTH = 64;

    @Id
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "actor_id", columnDefinition = "uuid")
    private UUID actorId;

    @Column(name = "actor_email", length = ACTOR_EMAIL_LENGTH)
    private String actorEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AuditAction action;

    @Column(name = "entity_type", nullable = false, length = ENTITY_TYPE_LENGTH)
    private String entityType;

    @Column(name = "entity_id", length = ENTITY_ID_LENGTH)
    private String entityId;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(length = DETAILS_LENGTH)
    private String details;

    @Column(name = "ip_address", length = IP_ADDRESS_LENGTH)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
