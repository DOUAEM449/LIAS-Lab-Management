package com.lias.labmanagement.governance.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.common.enums.RoleChangeSource;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.governance.dto.AssignMandateRequest;
import com.lias.labmanagement.governance.dto.EndMandateRequest;
import com.lias.labmanagement.governance.dto.MandateResponse;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.entity.Team;
import com.lias.labmanagement.governance.mapper.GovernanceMapper;
import com.lias.labmanagement.governance.repository.MandateRepository;
import com.lias.labmanagement.governance.repository.TeamRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Manages historized governance mandates (Director, Vice-Director, Team
 * Leader). Ending a mandate never deletes it: it only sets an end date.
 * At most one active mandate exists at a time for DIRECTOR/VICE_DIRECTOR
 * system-wide, and for TEAM_LEADER per team.
 */
@Service
@RequiredArgsConstructor
public class MandateService {

    private final MandateRepository mandateRepository;
    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final GovernanceMapper mapper;
    private final AuditService auditService;
    private final UserRoleSyncService userRoleSyncService;

    @Transactional(readOnly = true)
    public List<MandateResponse> findActive() {
        return mandateRepository.findByActiveTrueAndEndDateIsNull().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<MandateResponse> findByMember(UUID memberId) {
        return mandateRepository.findByMemberIdOrderByStartDateDesc(memberId).stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public MandateResponse assign(AssignMandateRequest request) {
        Member member = memberRepository.findById(request.memberId())
                .orElseThrow(() -> ResourceNotFoundException.of("Member", request.memberId()));

        Team team = null;
        if (request.role() == MandateRoleType.TEAM_LEADER) {
            if (request.teamId() == null) {
                throw new BadRequestException("teamId is required for a TEAM_LEADER mandate");
            }
            team = teamRepository.findById(request.teamId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Team", request.teamId()));

            mandateRepository.findByRoleAndTeamIdAndActiveTrueAndEndDateIsNull(MandateRoleType.TEAM_LEADER, team.getId())
                    .ifPresent(existing -> endMandateAndSync(existing, request.startDate()));
        } else {
            mandateRepository.findByRoleAndActiveTrueAndEndDateIsNull(request.role())
                    .ifPresent(existing -> endMandateAndSync(existing, request.startDate()));
        }

        Mandate mandate = Mandate.builder()
                .member(member)
                .role(request.role())
                .team(team)
                .startDate(request.startDate())
                .active(true)
                .createdAt(Instant.now())
                .build();
        Mandate saved = mandateRepository.save(mandate);

        // P0.1: the whole point of the mandate — grant the actual Spring Security
        // permissions matching this governance responsibility, immediately.
        userRoleSyncService.syncForMember(member, RoleChangeSource.MANDATE_CHANGE);

        auditService.record(AuditAction.ROLE_CHANGE, "Mandate", saved.getId(),
                "Assigned " + request.role() + " to member " + member.getId());
        return mapper.toResponse(saved);
    }

    @Transactional
    public MandateResponse end(UUID mandateId, EndMandateRequest request) {
        Mandate mandate = mandateRepository.findById(mandateId)
                .orElseThrow(() -> ResourceNotFoundException.of("Mandate", mandateId));
        endMandateAndSync(mandate, request.endDate());
        auditService.record(AuditAction.ROLE_CHANGE, "Mandate", mandateId, "Mandate ended");
        return mapper.toResponse(mandate);
    }

    /**
     * Ends every currently active mandate held by a member (used when their status
     * transitions to RETIRED/FORMER — a frozen account must not keep governance mandates
     * dangling as "active" forever). Role sync is left to the caller (typically
     * {@code MemberService}, which recomputes the role once for the status change itself).
     */
    @Transactional
    public void endAllActiveMandatesForMember(UUID memberId, LocalDate effectiveDate) {
        mandateRepository.findByMemberIdAndActiveTrueAndEndDateIsNull(memberId)
                .forEach(m -> {
                    m.setEndDate(effectiveDate);
                    m.setActive(false);
                    mandateRepository.save(m);
                    auditService.record(AuditAction.ROLE_CHANGE, "Mandate", m.getId(),
                            "Mandate auto-ended: member status became RETIRED/FORMER");
                });
    }

    private void endMandateAndSync(Mandate mandate, LocalDate endDate) {
        mandate.setEndDate(endDate);
        mandate.setActive(false);
        mandateRepository.save(mandate);
        // The member losing this mandate may fall back to a lower-priority mandate,
        // their status-derived role, or nothing — recompute immediately either way.
        userRoleSyncService.syncForMember(mandate.getMember(), RoleChangeSource.MANDATE_CHANGE);
    }
}
