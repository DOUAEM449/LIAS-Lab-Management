package com.lias.labmanagement.equipment.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import com.lias.labmanagement.common.enums.EquipmentRequestStatus;
import com.lias.labmanagement.members.entity.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/** Request from a member for new equipment, validated by the Director/Vice-Director. */
@Entity
@Table(name = "equipment_requests", indexes = {
        @Index(name = "idx_equipment_requests_status", columnList = "status"),
        @Index(name = "idx_equipment_requests_requester", columnList = "requester_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class EquipmentRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private Member requester;

    @Column(nullable = false, length = 255)
    private String itemName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EquipmentRequestStatus status;

    @Column(name = "validated_by", columnDefinition = "uuid")
    private UUID validatedBy;

    @Column(name = "validation_date")
    private Instant validationDate;

    @Column(name = "validation_note", length = 1000)
    private String validationNote;
}
