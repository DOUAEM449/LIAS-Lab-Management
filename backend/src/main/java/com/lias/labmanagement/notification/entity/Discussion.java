package com.lias.labmanagement.notification.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import com.lias.labmanagement.event.entity.Event;
import com.lias.labmanagement.governance.entity.Team;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

/**
 * A discussion thread scoped to the whole lab, a single team, or a single
 * event. Contains an ordered collection of {@link Message}s.
 */
@Entity
@Table(name = "discussions", indexes = {
        @Index(name = "idx_discussions_team", columnList = "team_id"),
        @Index(name = "idx_discussions_event", columnList = "event_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Discussion extends BaseEntity {

    @Column(nullable = false, length = 300)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DiscussionScope scope;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_member_id", nullable = false)
    private Member createdByMember;
}
