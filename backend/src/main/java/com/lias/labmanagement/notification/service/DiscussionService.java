package com.lias.labmanagement.notification.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.util.SoftDeleteSafe;
import com.lias.labmanagement.event.repository.EventRepository;
import com.lias.labmanagement.governance.repository.TeamRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.notification.dto.DiscussionRequest;
import com.lias.labmanagement.notification.dto.DiscussionResponse;
import com.lias.labmanagement.notification.dto.MessageRequest;
import com.lias.labmanagement.notification.dto.MessageResponse;
import com.lias.labmanagement.notification.entity.Discussion;
import com.lias.labmanagement.notification.entity.DiscussionScope;
import com.lias.labmanagement.notification.entity.Message;
import com.lias.labmanagement.notification.repository.DiscussionRepository;
import com.lias.labmanagement.notification.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final MessageRepository messageRepository;
    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final EventRepository eventRepository;
    private final AuditService auditService;

    @Transactional
    public DiscussionResponse create(UUID creatorMemberId, DiscussionRequest request) {
        Member creator = memberRepository.findById(creatorMemberId)
                .orElseThrow(() -> ResourceNotFoundException.of("Member", creatorMemberId));
        Discussion.DiscussionBuilder<?, ?> builder = Discussion.builder()
                .title(request.title())
                .scope(request.scope())
                .createdByMember(creator);
        if (request.scope() == DiscussionScope.TEAM && request.teamId() != null) {
            builder.team(teamRepository.findById(request.teamId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Team", request.teamId())));
        }
        if (request.scope() == DiscussionScope.EVENT && request.eventId() != null) {
            builder.event(eventRepository.findById(request.eventId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Event", request.eventId())));
        }
        Discussion saved = discussionRepository.save(builder.build());
        auditService.record(AuditAction.CREATE, "Discussion", saved.getId(), "Discussion created: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public com.lias.labmanagement.common.web.PageResponse<DiscussionResponse> findByScope(DiscussionScope scope, Pageable pageable) {
        Page<Discussion> page = discussionRepository.findByScope(scope, pageable);
        return com.lias.labmanagement.common.web.PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public List<DiscussionResponse> findByTeam(UUID teamId) {
        return discussionRepository.findByTeamId(teamId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DiscussionResponse> findByEvent(UUID eventId) {
        return discussionRepository.findByEventId(eventId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public MessageResponse postMessage(UUID discussionId, UUID senderMemberId, MessageRequest request) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> ResourceNotFoundException.of("Discussion", discussionId));
        Member sender = memberRepository.findById(senderMemberId)
                .orElseThrow(() -> ResourceNotFoundException.of("Member", senderMemberId));
        Message message = messageRepository.save(Message.builder()
                .discussion(discussion)
                .sender(sender)
                .content(request.content())
                .timestamp(Instant.now())
                .build());
        return toMessageResponse(message);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID discussionId) {
        return messageRepository.findByDiscussionIdOrderByTimestampAsc(discussionId).stream()
                .map(this::toMessageResponse).toList();
    }

    private DiscussionResponse toResponse(Discussion d) {
        return new DiscussionResponse(d.getId(), d.getTitle(), d.getScope(),
                d.getTeam() != null ? d.getTeam().getId() : null,
                d.getEvent() != null ? d.getEvent().getId() : null,
                d.getCreatedByMember().getId(),
                SoftDeleteSafe.resolve(d.getCreatedByMember(), m -> m.getFirstName() + " " + m.getLastName(), "Membre archivé"),
                d.getCreatedAt());
    }

    private MessageResponse toMessageResponse(Message m) {
        return new MessageResponse(m.getId(), m.getDiscussion().getId(), m.getSender().getId(),
                SoftDeleteSafe.resolve(m.getSender(), s -> s.getFirstName() + " " + s.getLastName(), "Membre archivé"),
                m.getContent(), m.getTimestamp());
    }
}
