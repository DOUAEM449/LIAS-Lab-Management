package com.lias.labmanagement.notification.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.common.enums.NotificationType;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.repository.MandateRepository;
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

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Emits and manages in-app notifications for members. Called from other
 * modules (membership requests, events, equipment...) whenever a
 * cross-cutting notice needs to reach a member's inbox.
 * <p>
 * Recipient selection follows CdC §2.20: an event or a document addition
 * reaches the whole active membership / the governance, a request awaiting a
 * decision reaches the people who can actually decide it (§2.6, §2.15).
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;
    private final MandateRepository mandateRepository;
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

    /** Fans a single notice out to several members at once, ignoring nulls and duplicates. */
    @Transactional
    public void notifyAll(Collection<UUID> recipientMemberIds, NotificationType type, String message,
                           String relatedEntityType, UUID relatedEntityId) {
        if (recipientMemberIds == null || recipientMemberIds.isEmpty()) {
            return;
        }
        Set<UUID> unique = new LinkedHashSet<>(recipientMemberIds);
        unique.remove(null);
        unique.forEach(id -> notify(id, type, message, relatedEntityType, relatedEntityId));
    }

    /**
     * Notifies whoever currently holds the laboratory's decision-making mandates
     * (Director and Vice-Director). Used for anything awaiting their validation —
     * membership applications (CdC §2.6) and equipment requests (CdC §2.15).
     * Resolved from active mandates, never from a stored role, so it always
     * follows the current governance.
     */
    @Transactional
    public void notifyGovernance(NotificationType type, String message,
                                  String relatedEntityType, UUID relatedEntityId) {
        List<UUID> recipients = java.util.stream.Stream.of(MandateRoleType.DIRECTOR, MandateRoleType.VICE_DIRECTOR)
                .map(role -> mandateRepository.findByRoleAndActiveTrueAndEndDateIsNull(role).orElse(null))
                .filter(Objects::nonNull)
                .map(Mandate::getMember)
                .filter(Objects::nonNull)
                .map(Member::getId)
                .toList();
        notifyAll(recipients, type, message, relatedEntityType, relatedEntityId);
    }

    /**
     * Notifies every member whose account is still active — frozen (RETIRED) and
     * deactivated (FORMER) members are excluded, since they have no active access
     * to the platform (CdC §2.8).
     */
    @Transactional
    public void notifyActiveMembers(NotificationType type, String message,
                                     String relatedEntityType, UUID relatedEntityId) {
        notifyAll(memberRepository.findActiveMemberIds(), type, message, relatedEntityType, relatedEntityId);
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
