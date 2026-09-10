package com.lias.labmanagement.event.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.EventType;
import com.lias.labmanagement.common.enums.NotificationType;
import com.lias.labmanagement.common.exception.ConflictException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.common.util.SoftDeleteSafe;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.event.dto.EventParticipantResponse;
import com.lias.labmanagement.event.dto.EventRequest;
import com.lias.labmanagement.event.dto.EventResponse;
import com.lias.labmanagement.event.entity.Event;
import com.lias.labmanagement.event.entity.EventOrganizer;
import com.lias.labmanagement.event.entity.EventParticipant;
import com.lias.labmanagement.event.repository.EventOrganizerRepository;
import com.lias.labmanagement.event.repository.EventParticipantRepository;
import com.lias.labmanagement.event.repository.EventRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventOrganizerRepository organizerRepository;
    private final EventParticipantRepository participantRepository;
    private final MemberRepository memberRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> search(EventType type, String query, Pageable pageable) {
        Page<Event> page = eventRepository.search(type, query, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public EventResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getEditionsByTitle(String title) {
        return eventRepository.findByTitleIgnoreCaseOrderByEditionNumberDesc(title).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public EventResponse create(EventRequest request) {
        Event event = Event.builder()
                .type(request.type())
                .title(request.title())
                .description(request.description())
                .editionNumber(request.editionNumber())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .location(request.location())
                .build();
        Event saved = eventRepository.save(event);
        replaceOrganizers(saved, request.organizerMemberIds());

        // CdC §2.20 lists "Événements" as a notification trigger: a new scientific event
        // concerns the whole laboratory, so every active member is informed. The assigned
        // organizers get a more specific notice about their own responsibility instead.
        List<UUID> organizerIds = request.organizerMemberIds() != null ? request.organizerMemberIds() : List.of();
        organizerIds.forEach(memberId ->
                notificationService.notify(memberId, NotificationType.EVENT_CREATED,
                        "Vous avez été désigné organisateur de l'événement \"" + saved.getTitle() + "\".",
                        "Event", saved.getId()));

        memberRepository.findActiveMemberIds().stream()
                .filter(id -> !organizerIds.contains(id))
                .forEach(id -> notificationService.notify(id, NotificationType.EVENT_CREATED,
                        "Nouvel événement : " + saved.getTitle() + " ("
                                + saved.getType() + ") le "
                                + saved.getStartDate().toLocalDate() + ".",
                        "Event", saved.getId()));

        auditService.record(AuditAction.CREATE, "Event", saved.getId(), "Event created: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public EventResponse update(UUID id, EventRequest request) {
        Event event = findOrThrow(id);
        event.setType(request.type());
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setEditionNumber(request.editionNumber());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setLocation(request.location());
        Event saved = eventRepository.save(event);
        replaceOrganizers(saved, request.organizerMemberIds());
        auditService.record(AuditAction.UPDATE, "Event", id, "Event updated");
        return toResponse(saved);
    }

    @Transactional
    public EventResponse uploadBanner(UUID id, MultipartFile file) {
        Event event = findOrThrow(id);
        StoredFile stored = fileStorageService.store(file, "events");
        event.setBannerImagePath(stored.relativePath());
        Event saved = eventRepository.save(event);
        auditService.record(AuditAction.UPDATE, "Event", id, "Banner image uploaded");
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Event event = findOrThrow(id);
        event.markDeleted();
        eventRepository.save(event);
        auditService.record(AuditAction.DELETE, "Event", id, "Event soft-deleted");
    }

    @Transactional
    public EventParticipantResponse register(UUID eventId, UUID memberId) {
        Event event = findOrThrow(eventId);
        if (participantRepository.findByEventIdAndMemberId(eventId, memberId).isPresent()) {
            throw new ConflictException("This member is already registered for this event");
        }
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> ResourceNotFoundException.of("Member", memberId));
        EventParticipant participant = participantRepository.save(EventParticipant.builder()
                .event(event)
                .member(member)
                .registeredAt(Instant.now())
                .build());
        auditService.record(AuditAction.CREATE, "EventParticipant", participant.getId(),
                "Member " + memberId + " registered for event " + eventId);
        return toParticipantResponse(participant);
    }

    @Transactional(readOnly = true)
    public List<EventParticipantResponse> getParticipants(UUID eventId) {
        return participantRepository.findByEventId(eventId).stream().map(this::toParticipantResponse).toList();
    }

    private void replaceOrganizers(Event event, List<UUID> memberIds) {
        organizerRepository.deleteByEventId(event.getId());
        if (memberIds == null) {
            return;
        }
        for (UUID memberId : memberIds) {
            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> ResourceNotFoundException.of("Member", memberId));
            organizerRepository.save(EventOrganizer.builder().event(event).member(member).build());
        }
    }

    private Event findOrThrow(UUID id) {
        return eventRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Event", id));
    }

    private EventResponse toResponse(Event e) {
        List<EventResponse.OrganizerSummary> organizers = organizerRepository.findByEventId(e.getId()).stream()
                .map(o -> new EventResponse.OrganizerSummary(o.getMember().getId(),
                        SoftDeleteSafe.resolve(o.getMember(), m -> m.getFirstName() + " " + m.getLastName(), "Membre archivé")))
                .toList();
        long participantCount = participantRepository.countByEventId(e.getId());
        return new EventResponse(e.getId(), e.getType(), e.getTitle(), e.getDescription(), e.getEditionNumber(),
                e.getStartDate(), e.getEndDate(), e.getLocation(), e.getBannerImagePath(), participantCount, organizers);
    }

    private EventParticipantResponse toParticipantResponse(EventParticipant p) {
        return new EventParticipantResponse(p.getId(), p.getMember().getId(),
                SoftDeleteSafe.resolve(p.getMember(), m -> m.getFirstName() + " " + m.getLastName(), "Membre archivé"),
                p.getRegisteredAt());
    }
}
