package com.lias.labmanagement.event.repository;

import com.lias.labmanagement.event.entity.EventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, UUID> {
    List<EventParticipant> findByEventId(UUID eventId);

    Optional<EventParticipant> findByEventIdAndMemberId(UUID eventId, UUID memberId);

    long countByEventId(UUID eventId);
}
