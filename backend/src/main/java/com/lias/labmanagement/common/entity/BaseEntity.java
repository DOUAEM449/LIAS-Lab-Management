package com.lias.labmanagement.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Base class shared by every persistent entity in the system.
 * <p>
 * Provides, uniformly across the whole domain model:
 * <ul>
 *     <li>UUID identifiers (instead of auto-increment integers)</li>
 *     <li>Creation / modification auditing (who, when)</li>
 *     <li>Optimistic locking via {@code @Version}</li>
 *     <li>Soft delete flag (nothing is ever physically removed)</li>
 * </ul>
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", columnDefinition = "uuid", updatable = false)
    private UUID createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", columnDefinition = "uuid")
    private UUID updatedBy;

    /** Optimistic locking token. */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    /** Soft delete flag: records are archived, never physically removed. */
    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public void markDeleted() {
        this.deleted = true;
        this.deletedAt = Instant.now();
    }

    public void restore() {
        this.deleted = false;
        this.deletedAt = null;
    }
}
