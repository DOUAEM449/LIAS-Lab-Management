package com.lias.labmanagement.event.repository;

import com.lias.labmanagement.event.entity.EventOrganizer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventOrganizerRepository extends JpaRepository<EventOrganizer, UUID> {
    List<EventOrganizer> findByEventId(UUID eventId);

    void deleteByEventId(UUID eventId);
}
