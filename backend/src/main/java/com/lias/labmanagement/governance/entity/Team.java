package com.lias.labmanagement.governance.entity;

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

import java.time.LocalDate;

@Entity
@Table(name = "teams", indexes = {
        @Index(name = "idx_teams_name", columnList = "name")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Team extends BaseEntity {

    @Column(nullable = false, unique = true, length = 190)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "creation_date")
    private LocalDate creationDate;
}
