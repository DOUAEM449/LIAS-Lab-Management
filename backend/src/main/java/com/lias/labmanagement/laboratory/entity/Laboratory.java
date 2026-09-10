package com.lias.labmanagement.laboratory.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

/**
 * Institutional identity of the laboratory itself (CdC §4.1 — "Date de création du
 * laboratoire" is an explicitly required temporal datum, distinct from any member's own
 * dates). A single logical instance is expected — the CdC does not describe a
 * multi-laboratory system — enforced by {@code LaboratoryService} rather than a DB
 * constraint, to keep the schema simple.
 */
@Entity
@Table(name = "laboratory")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Laboratory extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "founding_date")
    private LocalDate foundingDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "director_message", columnDefinition = "TEXT")
    private String directorMessage;
}
