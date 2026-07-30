package com.lias.labmanagement.notification.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.NotificationType;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.notification.dto.NotificationResponse;
import com.lias.labmanagement.notification.entity.Notification;
import com.lias.labmanagement.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Emits and manages in-app notifications for members. Called from other
 * modules (membership requests, events, equipment...) whenever a
 * cross-cutting notice needs to reach a member's inbox.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;
    private final AuditService auditService;

    @Transactional
    public void notify(UUID recipientMemberId, NotificationType type, String message,
                        String relatedEntityType, UUID relatedEntityId) {
        Member recipient = memberRepository.findById(recipientMemberId).orElse(null);
        if (recipient == null) {
            return;
        }
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .message(message)
                .read(false)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getForMember(UUID memberId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(memberId, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID memberId) {
        return notificationRepository.countByRecipientIdAndReadFalse(memberId);
    }

    @Transactional
    public void markAsRead(UUID id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(UUID memberId) {
        notificationRepository.markAllAsRead(memberId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getMessage(), n.isRead(),
                n.getRelatedEntityType(), n.getRelatedEntityId(), n.getCreatedAt());
    }
}
