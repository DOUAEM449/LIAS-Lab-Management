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
import com.lias.labmanagement.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Keeps {@code User.role} — the single field Spring Security's {@code @PreAuthorize}
 * reads across the whole application — synchronized with the actual governance/membership
 * state, so it stops being an independent, manually-managed field.
 * <p>
 * Effective role resolution (highest priority first):
 * <ol>
 *     <li>RETIRED / FORMER status always wins and freezes the account to the matching
 *         technical role, regardless of any leftover active mandate (a retired Director
 *         must not keep Director permissions).</li>
 *     <li>Otherwise, the highest-priority currently active {@link Mandate}
 *         (DIRECTOR &gt; VICE_DIRECTOR &gt; TEAM_LEADER) wins.</li>
 *     <li>Otherwise, the role derived from {@link MemberStatus} (same mapping used at
 *         account creation in {@code MembershipRequestService}).</li>
 * </ol>
 * Every actual change is recorded in {@link UserRoleHistory} (previous row closed, new
 * row opened) — {@code STATUT}, {@code RÔLE} (Mandate) and the resulting Spring Security
 * role stay three distinct, separately historized concepts; this service only derives the
 * last one from the first two.
 */
@Service
@RequiredArgsConstructor
public class UserRoleSyncService {

    private static final Map<MemberStatus, RoleName> STATUS_TO_ROLE = Map.of(
            MemberStatus.PERMANENT, RoleName.PERMANENT_MEMBER,
            MemberStatus.ASSOCIATE, RoleName.ASSOCIATE_MEMBER,
            MemberStatus.PHD_STUDENT, RoleName.PHD_STUDENT,
            MemberStatus.RETIRED, RoleName.RETIRED_MEMBER,
            MemberStatus.FORMER, RoleName.FORMER_MEMBER
    );

    /** Highest priority first. */
    private static final List<MandateRoleType> MANDATE_PRIORITY =
            List.of(MandateRoleType.DIRECTOR, MandateRoleType.VICE_DIRECTOR, MandateRoleType.TEAM_LEADER);

    private static final Map<MandateRoleType, RoleName> MANDATE_TO_ROLE = Map.of(
            MandateRoleType.DIRECTOR, RoleName.DIRECTOR,
            MandateRoleType.VICE_DIRECTOR, RoleName.VICE_DIRECTOR,
            MandateRoleType.TEAM_LEADER, RoleName.TEAM_LEADER
    );

    private final MemberRepository memberRepository;
    private final MandateRepository mandateRepository;
    private final UserRepository userRepository;
    private final UserRoleHistoryRepository roleHistoryRepository;

    /**
     * Recomputes and, if needed, applies the effective role for the account linked to
     * this member. No-op if the member has no linked technical account (should not
     * happen for real members, but defensive for edge cases).
     */
    @Transactional
    public void syncForMember(Member member, RoleChangeSource source) {
        User user = member.getUser();
        if (user == null) {
            return;
        }
        RoleName effectiveRole = computeEffectiveRole(member);
        applyRole(user, effectiveRole, source, currentActorId());
    }

    /**
     * Directly sets a user's role outside the Member/Mandate model (e.g. granting
     * SYSTEM_ADMIN, or a manual correction). Still historized like any other change.
     * Used by {@code UserAdministrationService}.
     */
    @Transactional
    public void overrideRole(User user, RoleName newRole, UUID changedBy) {
        applyRole(user, newRole, RoleChangeSource.ADMIN_OVERRIDE, changedBy);
    }

    /**
     * One-shot realignment of every non-archived member's {@code User.role} with the role
     * their current status + active mandates actually imply, opening the first
     * {@link UserRoleHistory} row for legacy accounts that never had one.
     * <p>
     * Needed because {@link #syncForMember} only runs on write paths (status change, mandate
     * assign/end, membership approval): an account seeded before the derivation logic existed,
     * with no mutation since, would otherwise keep a stale role forever. Idempotent — a second
     * run is a no-op.
     *
     * @return how many accounts had a genuinely wrong role corrected, and how many only
     *         needed their history backfilled
     */
    @Transactional
    public ReconcileResult reconcileAll() {
        int rolesCorrected = 0;
        int historyBackfilled = 0;
        for (Member member : memberRepository.findAll()) {
            User user = member.getUser();
            if (user == null) {
                continue;
            }
            RoleName effective = computeEffectiveRole(member);
            boolean roleWrong = user.getRole() != effective;
            boolean historyMissing = roleHistoryRepository.findByUserIdAndEndDateIsNull(user.getId()).isEmpty();
            if (roleWrong || historyMissing) {
                applyRole(user, effective, RoleChangeSource.RECONCILIATION, null);
                if (roleWrong) {
                    rolesCorrected++;
                } else {
                    historyBackfilled++;
                }
            }
        }
        return new ReconcileResult(rolesCorrected, historyBackfilled);
    }

    public record ReconcileResult(int rolesCorrected, int historyBackfilled) {
    }

    private RoleName computeEffectiveRole(Member member) {
        MemberStatus status = member.getCurrentStatus();
        if (status == MemberStatus.RETIRED || status == MemberStatus.FORMER) {
            // A frozen/deactivated account never keeps governance permissions,
            // even if a Mandate was never explicitly ended (defense in depth —
            // MemberService also proactively ends active mandates on this transition).
            return STATUS_TO_ROLE.get(status);
        }

        List<Mandate> activeMandates = mandateRepository.findByMemberIdAndActiveTrueAndEndDateIsNull(member.getId());
        for (MandateRoleType type : MANDATE_PRIORITY) {
            boolean holdsIt = activeMandates.stream().anyMatch(m -> m.getRole() == type);
            if (holdsIt) {
                return MANDATE_TO_ROLE.get(type);
            }
        }
        return STATUS_TO_ROLE.getOrDefault(status, RoleName.ASSOCIATE_MEMBER);
    }

    private void applyRole(User user, RoleName newRole, RoleChangeSource source, UUID changedBy) {
        Optional<UserRoleHistory> currentOpen = roleHistoryRepository.findByUserIdAndEndDateIsNull(user.getId());
        if (currentOpen.isPresent() && currentOpen.get().getRole() == newRole) {
            return; // already correct and already recorded — nothing to do
        }

        LocalDate today = LocalDate.now();
        currentOpen.ifPresent(previous -> {
            previous.setEndDate(today);
            roleHistoryRepository.save(previous);
        });

        roleHistoryRepository.save(UserRoleHistory.builder()
                .user(user)
                .role(newRole)
                .source(source)
                .startDate(today)
                .changedBy(changedBy)
                .createdAt(Instant.now())
                .build());

        user.setRole(newRole);
        userRepository.save(user);
    }

    private UUID currentActorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details.getId();
        }
        return null;
    }
}
