package com.lias.labmanagement.auth.repository;

import com.lias.labmanagement.auth.entity.UserRoleHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleHistoryRepository extends JpaRepository<UserRoleHistory, UUID> {

    Optional<UserRoleHistory> findByUserIdAndEndDateIsNull(UUID userId);

    List<UserRoleHistory> findByUserIdOrderByStartDateDesc(UUID userId);
}
