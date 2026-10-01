package com.lias.labmanagement.notification.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.common.enums.NotificationType;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.repository.MandateRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.notification.entity.Notification;
import com.lias.labmanagement.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * CdC §2.20 — in-app notifications. Verifies that a real business trigger
 * ("something needs the governance's decision") reaches exactly the current
 * mandate holders, resolved from active mandates rather than a stored role.
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private MandateRepository mandateRepository;
    @Mock private AuditService auditService;

    @InjectMocks private NotificationService service;

    private Member member() {
        Member m = Member.builder().firstName("A").lastName("B").build();
        m.setId(UUID.randomUUID());
        return m;
    }

    @Test
    void notifyPersistsAnUnreadNotificationForAnExistingMember() {
        Member m = member();
        when(memberRepository.findById(m.getId())).thenReturn(Optional.of(m));

        service.notify(m.getId(), NotificationType.DOCUMENT_ADDED, "New document", "Document", UUID.randomUUID());

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getRecipient()).isEqualTo(m);
        assertThat(captor.getValue().isRead()).isFalse();
        assertThat(captor.getValue().getType()).isEqualTo(NotificationType.DOCUMENT_ADDED);
        assertThat(captor.getValue().getMessage()).isEqualTo("New document");
    }

    @Test
    void notifySilentlySkipsAnUnknownRecipient() {
        UUID ghost = UUID.randomUUID();
        when(memberRepository.findById(ghost)).thenReturn(Optional.empty());

        service.notify(ghost, NotificationType.SYSTEM, "x", null, null);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void notifyGovernanceReachesTheCurrentDirectorAndViceDirector() {
        Member director = member();
        Member vice = member();
        when(mandateRepository.findByRoleAndActiveTrueAndEndDateIsNull(MandateRoleType.DIRECTOR))
                .thenReturn(Optional.of(Mandate.builder().role(MandateRoleType.DIRECTOR).member(director).build()));
        when(mandateRepository.findByRoleAndActiveTrueAndEndDateIsNull(MandateRoleType.VICE_DIRECTOR))
                .thenReturn(Optional.of(Mandate.builder().role(MandateRoleType.VICE_DIRECTOR).member(vice).build()));
        when(memberRepository.findById(director.getId())).thenReturn(Optional.of(director));
        when(memberRepository.findById(vice.getId())).thenReturn(Optional.of(vice));

        service.notifyGovernance(NotificationType.EQUIPMENT_REQUEST, "A request awaits validation",
                "EquipmentRequest", UUID.randomUUID());

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(Notification::getRecipient)
                .containsExactlyInAnyOrder(director, vice);
        assertThat(captor.getAllValues()).allMatch(n -> n.getType() == NotificationType.EQUIPMENT_REQUEST);
    }

    @Test
    void notifyGovernanceWithNoMandateHoldersNotifiesNobody() {
        lenient().when(mandateRepository.findByRoleAndActiveTrueAndEndDateIsNull(any()))
                .thenReturn(Optional.empty());

        service.notifyGovernance(NotificationType.MEMBERSHIP_REQUEST, "x", "MembershipRequest", UUID.randomUUID());

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void notifyAllDeduplicatesRecipientIdsAndIgnoresNulls() {
        Member m = member();
        when(memberRepository.findById(m.getId())).thenReturn(Optional.of(m));

        service.notifyAll(java.util.Arrays.asList(m.getId(), m.getId(), null),
                NotificationType.EVENT_CREATED, "New event", "Event", UUID.randomUUID());

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void aMemberCanMarkTheirOwnNotificationAsRead() {
        Member owner = member();
        Notification n = Notification.builder().recipient(owner).read(false).build();
        n.setId(UUID.randomUUID());
        when(notificationRepository.findById(n.getId())).thenReturn(Optional.of(n));

        service.markAsRead(n.getId(), owner.getId());

        assertThat(n.isRead()).isTrue();
        verify(notificationRepository).save(n);
    }

    @Test
    void aMemberCannotMarkSomeoneElsesNotificationAsRead() {
        Member owner = member();
        Notification n = Notification.builder().recipient(owner).read(false).build();
        n.setId(UUID.randomUUID());
        when(notificationRepository.findById(n.getId())).thenReturn(Optional.of(n));

        assertThatThrownBy(() -> service.markAsRead(n.getId(), UUID.randomUUID()))
                .isInstanceOf(AccessDeniedException.class);
        assertThat(n.isRead()).isFalse();
        verify(notificationRepository, never()).save(any());
    }
}
