package com.lias.labmanagement.equipment.repository;

import com.lias.labmanagement.equipment.entity.EquipmentDistribution;
import com.lias.labmanagement.members.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EquipmentDistributionRepository extends JpaRepository<EquipmentDistribution, UUID> {
    List<EquipmentDistribution> findByEquipmentId(UUID equipmentId);

    List<EquipmentDistribution> findByMemberId(UUID memberId);

    /** CdC §2.15 — "qui n'a pas reçu" a given equipment item: every active member with no distribution row for it. */
    @Query("""
            select m from Member m
            where m.currentStatus not in (com.lias.labmanagement.common.enums.MemberStatus.RETIRED,
                                           com.lias.labmanagement.common.enums.MemberStatus.FORMER)
              and m.id not in (
                    select d.member.id from EquipmentDistribution d where d.equipment.id = :equipmentId)
            order by m.lastName, m.firstName
            """)
    List<Member> findMembersWithoutDistribution(@Param("equipmentId") UUID equipmentId);
}
