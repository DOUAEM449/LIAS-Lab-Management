package com.lias.labmanagement.calendar.service;

import com.lias.labmanagement.calendar.dto.CalendarItemResponse;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.event.entity.Event;
import com.lias.labmanagement.event.repository.EventRepository;
import com.lias.labmanagement.meeting.entity.Meeting;
import com.lias.labmanagement.meeting.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/**
 * Aggregates {@link Event} and {@link Meeting} occurrences within a date
 * range into a single unified timeline for the lab-wide calendar view.
 */
@Service
@RequiredArgsConstructor
public class CalendarService {

    private final EventRepository eventRepository;
    private final MeetingRepository meetingRepository;

    /**
     * @param callerRole role of the person viewing the calendar. Meetings belong to an
     *                   internal module (CdC §2.2.C): they are left out for a caller who
     *                   cannot open that module. Null counts as no access.
     */
    @Transactional(readOnly = true)
    public List<CalendarItemResponse> getItems(LocalDateTime from, LocalDateTime to, RoleName callerRole) {
        List<Event> events = eventRepository.findByStartDateBetweenOrEndDateBetween(from, to, from, to);
        List<Meeting> meetings = callerRole != null && callerRole.canAccessInternalModules()
                ? meetingRepository.findByMeetingDateBetween(from, to)
                : List.of();

        Stream<CalendarItemResponse> eventItems = events.stream()
                .map(e -> new CalendarItemResponse(e.getId(), "EVENT", e.getTitle(), e.getStartDate(), e.getEndDate(), e.getLocation()));
        Stream<CalendarItemResponse> meetingItems = meetings.stream()
                .map(m -> new CalendarItemResponse(m.getId(), "MEETING", m.getTitle(), m.getMeetingDate(), m.getMeetingDate(), m.getLocation()));

        return Stream.concat(eventItems, meetingItems)
                .sorted(Comparator.comparing(CalendarItemResponse::startDate))
                .toList();
    }
}
