package com.lias.labmanagement.members.repository;

import com.lias.labmanagement.members.entity.AffiliationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AffiliationHistoryRepository extends JpaRepository<AffiliationHistory, UUID> {
    List<AffiliationHistory> findByMemberIdOrderByStartDateDesc(UUID memberId);

    Optional<AffiliationHistory> findByMemberIdAndEndDateIsNull(UUID memberId);
}
