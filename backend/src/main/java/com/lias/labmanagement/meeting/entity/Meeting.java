package com.lias.labmanagement.meeting.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "meetings", indexes = {
        @Index(name = "idx_meetings_date", columnList = "meeting_date")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Meeting extends BaseEntity {

    @Column(nullable = false, length = 300)
    private String title;

    @Column(name = "meeting_date", nullable = false)
    private LocalDateTime meetingDate;

    @Column(columnDefinition = "TEXT")
    private String agenda;

    @Column(length = 100)
    private String type;

    @Column(length = 255)
    private String location;
}
