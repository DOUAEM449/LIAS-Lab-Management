package com.lias.labmanagement.equipment.entity;

import com.lias.labmanagement.members.entity.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.LocalDate;
import java.util.UUID;

/** Tracks which member currently holds which equipment (and how much). */
@Entity
@Table(name = "equipment_distributions", indexes = {
        @Index(name = "idx_equipment_distributions_equipment", columnList = "equipment_id"),
        @Index(name = "idx_equipment_distributions_member", columnList = "member_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDistribution {

    @jakarta.persistence.Id
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "distribution_date", nullable = false)
    private LocalDate distributionDate;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "returned_date")
    private LocalDate returnedDate;
}
