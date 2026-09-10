package com.lias.labmanagement.auth.entity;

import com.lias.labmanagement.common.enums.RoleChangeSource;
import com.lias.labmanagement.common.enums.RoleName;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Append-only timeline of the effective {@link com.lias.labmanagement.common.enums.RoleName}
 * (the value Spring Security actually authorizes against) held by a {@link User}.
 * <p>
 * {@code User.role} remains the field read by {@code @PreAuthorize}, but it is now a
 * <em>derived</em>, kept-in-sync value: {@code UserRoleSyncService} recomputes it from the
 * member's current status plus their highest-priority active {@code Mandate} on every
 * mandate or status change, and always closes the previous open row here before opening a
 * new one — so no past value is ever lost (CdC RÈGLE 3 / RÈGLE 4).
 */
@Entity
@Table(name = "user_role_history", indexes = {
        @Index(name = "idx_user_role_history_user", columnList = "user_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleHistory {

    @jakarta.persistence.Id
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RoleName role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RoleChangeSource source;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "changed_by", columnDefinition = "uuid")
    private UUID changedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
