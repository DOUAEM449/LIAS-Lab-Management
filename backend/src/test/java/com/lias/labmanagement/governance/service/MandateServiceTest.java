package com.lias.labmanagement.governance.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.governance.dto.MandateResponse;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.mapper.GovernanceMapper;
import com.lias.labmanagement.governance.repository.MandateRepository;
import com.lias.labmanagement.governance.repository.TeamRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Governance read side: an archived member is never presented as an officer in exercise,
 * even if a mandate row was left open by a path that predates the archival rule.
 */
@ExtendWith(MockitoExtension.class)
class MandateServiceTest {

    @Mock private MandateRepository mandateRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private AuditService auditService;
    @Mock private UserRoleSyncService userRoleSyncService;

    private final GovernanceMapper mapper = new GovernanceMapper();

    private MandateService service;

    private Member live;
    private Member archived;

    @BeforeEach
    void setUp() {
        service = new MandateService(mandateRepository, memberRepository, teamRepository,
                mapper, auditService, userRoleSyncService);

        live = member("Amine", "Tazi");
        archived = member("Douae", "Moussaoui");
        archived.markDeleted();
    }

    private Member member(String firstName, String lastName) {
        Member m = Member.builder()
                .firstName(firstName).lastName(lastName)
                .email(firstName.toLowerCase() + "@example.org")
                .currentStatus(MemberStatus.PERMANENT)
                .build();
        m.setId(UUID.randomUUID());
        return m;
    }

    private Mandate mandate(Member holder, MandateRoleType role) {
        Mandate m = Mandate.builder()
                .member(holder).role(role)
                .startDate(LocalDate.of(2023, 1, 1))
                .active(true)
                .createdAt(Instant.now())
                .build();
        m.setId(UUID.randomUUID());
        return m;
    }

    @Test
    void anArchivedMembersMandateIsNotReportedAsInExercise() {
        when(mandateRepository.findByActiveTrueAndEndDateIsNull())
                .thenReturn(List.of(mandate(archived, MandateRoleType.DIRECTOR)));

        assertThat(service.findActive()).isEmpty();
    }

    @Test
    void mandatesOfLiveMembersAreStillReported() {
        when(mandateRepository.findByActiveTrueAndEndDateIsNull())
                .thenReturn(List.of(mandate(live, MandateRoleType.VICE_DIRECTOR),
                        mandate(archived, MandateRoleType.DIRECTOR)));

        List<MandateResponse> active = service.findActive();

        assertThat(active).hasSize(1);
        assertThat(active.get(0).role()).isEqualTo(MandateRoleType.VICE_DIRECTOR);
        assertThat(active.get(0).memberName()).isEqualTo("Amine Tazi");
    }

    @Test
    void endingAllMandatesOfAMemberClosesThemWithoutDeletingThem() {
        Mandate held = mandate(live, MandateRoleType.DIRECTOR);
        when(mandateRepository.findByMemberIdAndActiveTrueAndEndDateIsNull(live.getId()))
                .thenReturn(List.of(held));

        LocalDate effective = LocalDate.of(2026, 9, 12);
        service.endAllActiveMandatesForMember(live.getId(), effective, "member archived");

        assertThat(held.isActive()).isFalse();
        assertThat(held.getEndDate()).isEqualTo(effective);
        // The row is updated, never removed: the governance period stays in the history.
        verify(mandateRepository).save(held);
        verify(mandateRepository, never()).delete(held);
    }
}
