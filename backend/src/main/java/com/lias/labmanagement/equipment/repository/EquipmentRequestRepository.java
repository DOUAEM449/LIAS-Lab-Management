package com.lias.labmanagement.equipment.repository;

import com.lias.labmanagement.common.enums.EquipmentRequestStatus;
import com.lias.labmanagement.equipment.entity.EquipmentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface EquipmentRequestRepository extends JpaRepository<EquipmentRequest, UUID> {
    Page<EquipmentRequest> findByStatus(EquipmentRequestStatus status, Pageable pageable);

    Page<EquipmentRequest> findByRequesterId(UUID requesterId, Pageable pageable);

    long countByCreatedAtBetween(Instant start, Instant end);
}
