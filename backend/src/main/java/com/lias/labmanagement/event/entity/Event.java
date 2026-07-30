package com.lias.labmanagement.event.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import com.lias.labmanagement.common.enums.EventType;
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

import java.time.LocalDateTime;

/**
 * A scientific event (conference, workshop, seminar). Recurring events
 * (e.g. an annual workshop) share the same title across years and are
 * distinguished by {@code editionNumber}, allowing archival browsing by
 * edition.
 */
@Entity
@Table(name = "events", indexes = {
        @Index(name = "idx_events_type", columnList = "type"),
        @Index(name = "idx_events_start_date", columnList = "start_date")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Event extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EventType type;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "edition_number")
    private Integer editionNumber;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(length = 255)
    private String location;

    @Column(name = "banner_image_path")
    private String bannerImagePath;
}
