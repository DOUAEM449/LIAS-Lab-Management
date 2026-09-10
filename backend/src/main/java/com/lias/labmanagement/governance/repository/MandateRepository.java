package com.lias.labmanagement.governance.repository;

import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.governance.entity.Mandate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MandateRepository extends JpaRepository<Mandate, UUID> {

    List<Mandate> findByMemberIdOrderByStartDateDesc(UUID memberId);

    Optional<Mandate> findByRoleAndActiveTrueAndEndDateIsNull(MandateRoleType role);

    Optional<Mandate> findByRoleAndTeamIdAndActiveTrueAndEndDateIsNull(MandateRoleType role, UUID teamId);

    List<Mandate> findByActiveTrueAndEndDateIsNull();

    List<Mandate> findByMemberIdAndActiveTrueAndEndDateIsNull(UUID memberId);
}
