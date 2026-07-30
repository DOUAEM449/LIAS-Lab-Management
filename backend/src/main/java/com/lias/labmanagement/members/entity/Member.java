package com.lias.labmanagement.members.entity;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.common.entity.BaseEntity;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.governance.entity.Team;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

/**
 * Complete profile of a laboratory member. {@code currentStatus} and
 * {@code currentTeam} are denormalized read-optimizations kept in sync by
 * {@code MemberService}; the historized truth lives in
 * {@link MemberStatusHistory} and {@code TeamMembershipHistory}.
 */
@Entity
@Table(name = "members", indexes = {
        @Index(name = "idx_members_last_name", columnList = "last_name"),
        @Index(name = "idx_members_status", columnList = "current_status"),
        @Index(name = "idx_members_team", columnList = "current_team_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Member extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "email", nullable = false, length = 190)
    private String email;

    @Column(name = "photo_url")
    private String photoUrl;

    /** Confidential: only visible to self, Director/Vice-Director and System Admin. */
    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "first_affiliation_date")
    private LocalDate firstAffiliationDate;

    @Column(name = "home_institution", length = 255)
    private String homeInstitution;

    @Column(name = "home_laboratory", length = 255)
    private String homeLaboratory;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @Column(name = "research_interests", columnDefinition = "TEXT")
    private String researchInterests;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", nullable = false, length = 40)
    private MemberStatus currentStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_team_id")
    private Team currentTeam;
}
