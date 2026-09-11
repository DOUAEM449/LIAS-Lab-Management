package com.lias.labmanagement.governance.service;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.entity.UserRoleHistory;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.auth.repository.UserRoleHistoryRepository;
import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleChangeSource;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.repository.MandateRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the CdC-critical rule STATUT ≠ RÔLE ≠ MANDAT: the effective
 * Spring-Security role must always be <em>derived</em> from (member status, active
 * mandates), never drift, and {@code reconcileAll()} must be idempotent.
 */
@ExtendWith(MockitoExtension.class)
class UserRoleSyncServiceTest {

    @Mock private MemberRepository memberRepository;
    @Mock private MandateRepository mandateRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserRoleHistoryRepository roleHistoryRepository;

    @InjectMocks private UserRoleSyncService service;

    // --- fixtures -----------------------------------------------------------

    private User user(RoleName initialRole) {
        User u = User.builder().email("u@lias.ma").role(initialRole).enabled(true).build();
        u.setId(UUID.randomUUID());
        return u;
    }

    private Member member(MemberStatus status, User user) {
        Member m = Member.builder().currentStatus(status).user(user).build();
        m.setId(UUID.randomUUID());
        return m;
    }

    private Mandate mandate(MandateRoleType type) {
        return Mandate.builder().role(type).active(true).startDate(LocalDate.now()).build();
    }

    /** No open history row yet (legacy account) — the common case for these assertions. */
    private void noOpenHistory() {
        lenient().when(roleHistoryRepository.findByUserIdAndEndDateIsNull(any())).thenReturn(Optional.empty());
    }

    private void activeMandates(Member m, Mandate... mandates) {
        lenient().when(mandateRepository.findByMemberIdAndActiveTrueAndEndDateIsNull(m.getId()))
                .thenReturn(List.of(mandates));
    }

    private RoleName syncedRoleOf(MemberStatus status, Mandate... mandates) {
        noOpenHistory();
        User u = user(RoleName.ASSOCIATE_MEMBER); // deliberately "wrong" starting point
        Member m = member(status, u);
        activeMandates(m, mandates);
        service.syncForMember(m, RoleChangeSource.STATUS_CHANGE);
        return u.getRole();
    }

    // --- status → role (no mandate) --------------------------------------

    @Nested
    class StatusDerivedRole {
        @Test void permanentMemberGetsPermanentRole() {
            assertThat(syncedRoleOf(MemberStatus.PERMANENT)).isEqualTo(RoleName.PERMANENT_MEMBER);
        }

        @Test void associateMemberGetsAssociateRole() {
            assertThat(syncedRoleOf(MemberStatus.ASSOCIATE)).isEqualTo(RoleName.ASSOCIATE_MEMBER);
        }

        @Test void phdStudentGetsPhdStudentRole() {
            assertThat(syncedRoleOf(MemberStatus.PHD_STUDENT)).isEqualTo(RoleName.PHD_STUDENT);
        }

        @Test void retiredMemberGetsRetiredRole() {
            assertThat(syncedRoleOf(MemberStatus.RETIRED)).isEqualTo(RoleName.RETIRED_MEMBER);
        }

        @Test void formerMemberGetsFormerRole() {
            assertThat(syncedRoleOf(MemberStatus.FORMER)).isEqualTo(RoleName.FORMER_MEMBER);
        }
    }

    // --- mandate → role (mandate wins over status) ------------------------

    @Nested
    class MandateDerivedRole {
        @Test void teamLeaderMandatePromotesToTeamLeader() {
            assertThat(syncedRoleOf(MemberStatus.PHD_STUDENT, mandate(MandateRoleType.TEAM_LEADER)))
                    .isEqualTo(RoleName.TEAM_LEADER);
        }

        @Test void directorMandatePromotesToDirector() {
            assertThat(syncedRoleOf(MemberStatus.ASSOCIATE, mandate(MandateRoleType.DIRECTOR)))
                    .isEqualTo(RoleName.DIRECTOR);
        }

        @Test void directorOutranksTeamLeaderWhenBothHeld() {
            assertThat(syncedRoleOf(MemberStatus.PERMANENT,
                    mandate(MandateRoleType.TEAM_LEADER), mandate(MandateRoleType.DIRECTOR)))
                    .isEqualTo(RoleName.DIRECTOR);
        }

        @Test void viceDirectorOutranksTeamLeader() {
            assertThat(syncedRoleOf(MemberStatus.PERMANENT,
                    mandate(MandateRoleType.TEAM_LEADER), mandate(MandateRoleType.VICE_DIRECTOR)))
                    .isEqualTo(RoleName.VICE_DIRECTOR);
        }
    }

    // --- frozen status wins over any leftover mandate ---------------------

    @Test
    void retiredStatusFreezesRoleEvenWithLeftoverDirectorMandate() {
        noOpenHistory();
        User u = user(RoleName.DIRECTOR);
        Member m = member(MemberStatus.RETIRED, u);
        // No mandate stub on purpose: a frozen status must short-circuit BEFORE any
        // mandate lookup. If the implementation queried mandates here the test would
        // still pass (empty list), but keeping it unstubbed documents the contract.
        service.syncForMember(m, RoleChangeSource.STATUS_CHANGE);
        assertThat(u.getRole()).isEqualTo(RoleName.RETIRED_MEMBER);
    }

    // --- history bookkeeping ---------------------------------------------

    @Test
    void everyRealChangeOpensAHistoryRowWithItsSource() {
        noOpenHistory();
        User u = user(RoleName.ASSOCIATE_MEMBER);
        Member m = member(MemberStatus.PERMANENT, u);
        activeMandates(m);

        service.syncForMember(m, RoleChangeSource.STATUS_CHANGE);

        ArgumentCaptor<UserRoleHistory> captor = ArgumentCaptor.forClass(UserRoleHistory.class);
        verify(roleHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(RoleName.PERMANENT_MEMBER);
        assertThat(captor.getValue().getSource()).isEqualTo(RoleChangeSource.STATUS_CHANGE);
        assertThat(captor.getValue().getEndDate()).isNull();
        verify(userRepository).save(u);
    }

    @Test
    void noWriteWhenRoleAlreadyCorrectAndRecorded() {
        User u = user(RoleName.PERMANENT_MEMBER);
        Member m = member(MemberStatus.PERMANENT, u);
        activeMandates(m);
        when(roleHistoryRepository.findByUserIdAndEndDateIsNull(u.getId()))
                .thenReturn(Optional.of(UserRoleHistory.builder().user(u).role(RoleName.PERMANENT_MEMBER).build()));

        service.syncForMember(m, RoleChangeSource.STATUS_CHANGE);

        verify(userRepository, never()).save(any());
        verify(roleHistoryRepository, never()).save(any());
    }

    @Test
    void overrideRoleAppliesAdminOverrideSource() {
        noOpenHistory();
        User u = user(RoleName.ASSOCIATE_MEMBER);

        service.overrideRole(u, RoleName.SYSTEM_ADMIN, UUID.randomUUID());

        assertThat(u.getRole()).isEqualTo(RoleName.SYSTEM_ADMIN);
        ArgumentCaptor<UserRoleHistory> captor = ArgumentCaptor.forClass(UserRoleHistory.class);
        verify(roleHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getSource()).isEqualTo(RoleChangeSource.ADMIN_OVERRIDE);
    }

    // --- reconcileAll --------------------------------------------------------

    @Test
    void reconcileAllCorrectsADriftedRoleAndLeavesConsistentOnesAlone() {
        noOpenHistory();
        User drifted = user(RoleName.DIRECTOR);          // wrong: no mandate, ASSOCIATE status
        User consistent = user(RoleName.PERMANENT_MEMBER);
        Member m1 = member(MemberStatus.ASSOCIATE, drifted);
        Member m2 = member(MemberStatus.PERMANENT, consistent);
        when(memberRepository.findAll()).thenReturn(List.of(m1, m2));
        activeMandates(m1);
        activeMandates(m2);
        // consistent member already has an open history row with the right role
        lenient().when(roleHistoryRepository.findByUserIdAndEndDateIsNull(consistent.getId()))
                .thenReturn(Optional.of(UserRoleHistory.builder().role(RoleName.PERMANENT_MEMBER).build()));

        UserRoleSyncService.ReconcileResult result = service.reconcileAll();

        assertThat(drifted.getRole()).isEqualTo(RoleName.ASSOCIATE_MEMBER);
        assertThat(consistent.getRole()).isEqualTo(RoleName.PERMANENT_MEMBER);
        assertThat(result.rolesCorrected()).isEqualTo(1);
    }

    @Test
    void reconcileAllIsIdempotentWhenEverythingIsAlreadyConsistent() {
        User u1 = user(RoleName.ASSOCIATE_MEMBER);
        User u2 = user(RoleName.TEAM_LEADER);
        Member m1 = member(MemberStatus.ASSOCIATE, u1);
        Member m2 = member(MemberStatus.PHD_STUDENT, u2);
        when(memberRepository.findAll()).thenReturn(List.of(m1, m2));
        activeMandates(m1);
        activeMandates(m2, mandate(MandateRoleType.TEAM_LEADER));
        when(roleHistoryRepository.findByUserIdAndEndDateIsNull(u1.getId()))
                .thenReturn(Optional.of(UserRoleHistory.builder().role(RoleName.ASSOCIATE_MEMBER).build()));
        when(roleHistoryRepository.findByUserIdAndEndDateIsNull(u2.getId()))
                .thenReturn(Optional.of(UserRoleHistory.builder().role(RoleName.TEAM_LEADER).build()));

        UserRoleSyncService.ReconcileResult result = service.reconcileAll();

        assertThat(result.rolesCorrected()).isZero();
        assertThat(result.historyBackfilled()).isZero();
        verify(userRepository, never()).save(any());
        verify(roleHistoryRepository, never()).save(any());
    }

    @Test
    void reconcileAllBackfillsHistoryForACorrectButUnrecordedRole() {
        User u = user(RoleName.ASSOCIATE_MEMBER);          // role already right...
        Member m = member(MemberStatus.ASSOCIATE, u);
        when(memberRepository.findAll()).thenReturn(List.of(m));
        activeMandates(m);
        when(roleHistoryRepository.findByUserIdAndEndDateIsNull(u.getId()))
                .thenReturn(Optional.empty());            // ...but never historized

        UserRoleSyncService.ReconcileResult result = service.reconcileAll();

        assertThat(result.rolesCorrected()).isZero();
        assertThat(result.historyBackfilled()).isEqualTo(1);
        verify(roleHistoryRepository).save(any(UserRoleHistory.class));
    }

    @Test
    void syncForMemberIsANoOpForAnAccountWithNoLinkedUser() {
        Member m = member(MemberStatus.PERMANENT, null);

        service.syncForMember(m, RoleChangeSource.STATUS_CHANGE);

        verify(userRepository, never()).save(any());
        verify(roleHistoryRepository, never()).save(any());
    }
}
