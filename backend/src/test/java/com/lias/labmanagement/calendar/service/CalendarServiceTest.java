package com.lias.labmanagement.calendar.service;

import com.lias.labmanagement.calendar.dto.CalendarItemResponse;
import com.lias.labmanagement.common.enums.EventType;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.event.entity.Event;
import com.lias.labmanagement.event.repository.EventRepository;
import com.lias.labmanagement.meeting.entity.Meeting;
import com.lias.labmanagement.meeting.repository.MeetingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Meetings belong to an internal module (CdC §2.2.C). The calendar merged them into the
 * timeline of every signed-in user; it now leaves them out for those who cannot open
 * the meetings module.
 */
@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    private static final LocalDateTime FROM = LocalDateTime.of(2026, 9, 1, 0, 0);
    private static final LocalDateTime TO = LocalDateTime.of(2026, 9, 30, 23, 59);

    @Mock private EventRepository eventRepository;
    @Mock private MeetingRepository meetingRepository;

    @InjectMocks private CalendarService service;

    @BeforeEach
    void oneEventInTheRange() {
        Event event = Event.builder().type(EventType.CONFERENCE).title("Journée IA")
                .startDate(FROM.plusDays(3)).endDate(FROM.plusDays(3).plusHours(8)).build();
        event.setId(UUID.randomUUID());
        when(eventRepository.findByStartDateBetweenOrEndDateBetween(any(), any(), any(), any()))
                .thenReturn(List.of(event));
    }

    @Test
    void aPhdStudentSeesEventsButNoMeeting() {
        List<CalendarItemResponse> items = service.getItems(FROM, TO, RoleName.PHD_STUDENT);

        assertThat(items).extracting(CalendarItemResponse::itemType).containsExactly("EVENT");
        verifyNoInteractions(meetingRepository);
    }

    @Test
    void aMemberWithInternalAccessSeesEventsAndMeetings() {
        Meeting meeting = Meeting.builder().title("Conseil de laboratoire").meetingDate(FROM.plusDays(1)).build();
        meeting.setId(UUID.randomUUID());
        when(meetingRepository.findByMeetingDateBetween(FROM, TO)).thenReturn(List.of(meeting));

        List<CalendarItemResponse> items = service.getItems(FROM, TO, RoleName.TEAM_LEADER);

        assertThat(items).extracting(CalendarItemResponse::itemType).containsExactly("MEETING", "EVENT");
    }
}
