package com.lias.labmanagement.event.service;

import com.lias.labmanagement.common.enums.EventType;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.event.dto.EventRequest;
import com.lias.labmanagement.event.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * An event must not end before it starts. The check runs before any persistence, so a bad
 * request is rejected without touching the repository.
 */
@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock private EventRepository eventRepository;
    @InjectMocks private EventService service;

    private EventRequest withDates(LocalDateTime start, LocalDateTime end) {
        return new EventRequest(EventType.CONFERENCE, "Journée IA", null, null, start, end, "Amphi", null);
    }

    @Test
    void anEventEndingBeforeItStartsIsRejectedOnCreate() {
        LocalDateTime start = LocalDateTime.of(2026, 10, 10, 9, 0);
        assertThatThrownBy(() -> service.create(withDates(start, start.minusHours(1))))
                .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(eventRepository);
    }

    @Test
    void anEventEndingBeforeItStartsIsRejectedOnUpdate() {
        LocalDateTime start = LocalDateTime.of(2026, 10, 10, 9, 0);
        assertThatThrownBy(() -> service.update(java.util.UUID.randomUUID(), withDates(start, start.minusHours(1))))
                .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(eventRepository);
    }
}
