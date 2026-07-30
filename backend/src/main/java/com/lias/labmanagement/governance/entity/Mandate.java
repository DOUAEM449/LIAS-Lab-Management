package com.lias.labmanagement.governance.entity;

import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.members.entity.Member;
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
 * Time-bound governance responsibility (Director, Vice-Director, Team
 * Leader). The complete history of mandates is always preserved: ending
 * one mandate never deletes it, it only sets {@code endDate}.
 */
@Entity
@Table(name = "mandates", indexes = {
        @Index(name = "idx_mandates_member", columnList = "member_id"),
        @Index(name = "idx_mandates_team", columnList = "team_id"),
        @Index(name = "idx_mandates_role", columnList = "role")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Mandate {

    @jakarta.persistence.Id
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private MandateRoleType role;

    /** Only populated for TEAM_LEADER mandates. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public boolean isCurrentlyActive() {
        return active && endDate == null;
    }
}
