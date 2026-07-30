package com.lias.labmanagement.meeting.repository;

import com.lias.labmanagement.meeting.entity.MeetingMinutes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MeetingMinutesRepository extends JpaRepository<MeetingMinutes, UUID> {
    List<MeetingMinutes> findByMeetingIdOrderByUploadedAtDesc(UUID meetingId);
}
