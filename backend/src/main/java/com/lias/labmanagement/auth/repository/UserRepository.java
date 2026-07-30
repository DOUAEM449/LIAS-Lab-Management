package com.lias.labmanagement.auth.repository;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.common.enums.RoleName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCaseAndDeletedFalse(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<User> findByRole(RoleName role, Pageable pageable);
}
