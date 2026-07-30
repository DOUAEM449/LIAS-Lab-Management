package com.lias.labmanagement.notification.repository;

import com.lias.labmanagement.notification.entity.Discussion;
import com.lias.labmanagement.notification.entity.DiscussionScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DiscussionRepository extends JpaRepository<Discussion, UUID> {
    Page<Discussion> findByScope(DiscussionScope scope, Pageable pageable);

    List<Discussion> findByTeamId(UUID teamId);

    List<Discussion> findByEventId(UUID eventId);
}
