package com.lias.labmanagement.governance.repository;

import com.lias.labmanagement.governance.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    boolean existsByNameIgnoreCase(String name);
}
