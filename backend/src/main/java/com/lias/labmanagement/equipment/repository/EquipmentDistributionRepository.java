package com.lias.labmanagement.equipment.repository;

import com.lias.labmanagement.equipment.entity.EquipmentDistribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EquipmentDistributionRepository extends JpaRepository<EquipmentDistribution, UUID> {
    List<EquipmentDistribution> findByEquipmentId(UUID equipmentId);

    List<EquipmentDistribution> findByMemberId(UUID memberId);
}
