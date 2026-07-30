package com.lias.labmanagement.governance.repository;

import com.lias.labmanagement.governance.entity.TeamMembershipHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMembershipHistoryRepository extends JpaRepository<TeamMembershipHistory, UUID> {
    List<TeamMembershipHistory> findByMemberIdOrderByStartDateDesc(UUID memberId);

    Optional<TeamMembershipHistory> findByMemberIdAndEndDateIsNull(UUID memberId);

    List<TeamMembershipHistory> findByTeamIdAndEndDateIsNull(UUID teamId);
}
