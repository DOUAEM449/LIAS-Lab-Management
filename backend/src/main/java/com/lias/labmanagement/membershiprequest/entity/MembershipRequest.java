package com.lias.labmanagement.membershiprequest.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * Online membership application (CV + motivation letter). Only the acting
 * Director (or Vice-Director) can approve/reject. Approval triggers
 * automatic account creation; rejection sends a notification.
 */
@Entity
@Table(name = "membership_requests", indexes = {
        @Index(name = "idx_membership_requests_status", columnList = "status"),
        @Index(name = "idx_membership_requests_email", columnList = "email")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class MembershipRequest extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 190)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_status", nullable = false, length = 40)
    private MemberStatus requestedStatus;

    @Column(name = "home_institution", length = 255)
    private String homeInstitution;

    @Column(name = "motivation_letter", columnDefinition = "TEXT")
    private String motivationLetter;

    @Column(name = "cv_path")
    private String cvPath;

    @Column(name = "cv_original_name")
    private String cvOriginalName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private RequestStatus status;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "decided_by", columnDefinition = "uuid")
    private UUID decidedBy;

    @Column(name = "decision_date")
    private Instant decisionDate;

    @Column(name = "decision_note", length = 1000)
    private String decisionNote;
}
