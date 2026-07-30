package com.lias.labmanagement.meeting.repository;

import com.lias.labmanagement.meeting.entity.Meeting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    Page<Meeting> findByOrderByMeetingDateDesc(Pageable pageable);

    List<Meeting> findByMeetingDateBetween(LocalDateTime start, LocalDateTime end);
}
