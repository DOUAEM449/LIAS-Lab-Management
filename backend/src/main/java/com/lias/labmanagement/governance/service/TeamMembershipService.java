package com.lias.labmanagement.governance.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.governance.dto.TeamMembershipHistoryResponse;
import com.lias.labmanagement.governance.dto.TransferTeamRequest;
import com.lias.labmanagement.governance.entity.Team;
import com.lias.labmanagement.governance.entity.TeamMembershipHistory;
import com.lias.labmanagement.governance.mapper.GovernanceMapper;
import com.lias.labmanagement.governance.repository.TeamMembershipHistoryRepository;
import com.lias.labmanagement.governance.repository.TeamRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamMembershipService {

    private final TeamMembershipHistoryRepository historyRepository;
    private final TeamRepository teamRepository;
    private final MemberRepository memberRepository;
    private final GovernanceMapper mapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<TeamMembershipHistoryResponse> history(UUID memberId) {
        return historyRepository.findByMemberIdOrderByStartDateDesc(memberId).stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public void transfer(TransferTeamRequest request) {
        Member member = memberRepository.findById(request.memberId())
                .orElseThrow(() -> ResourceNotFoundException.of("Member", request.memberId()));
        Team newTeam = teamRepository.findById(request.newTeamId())
                .orElseThrow(() -> ResourceNotFoundException.of("Team", request.newTeamId()));

        historyRepository.findByMemberIdAndEndDateIsNull(member.getId()).ifPresent(current -> {
            current.setEndDate(request.effectiveDate());
            historyRepository.save(current);
        });

        TeamMembershipHistory newEntry = TeamMembershipHistory.builder()
                .member(member)
                .team(newTeam)
                .startDate(request.effectiveDate())
                .createdAt(Instant.now())
                .build();
        historyRepository.save(newEntry);

        member.setCurrentTeam(newTeam);
        memberRepository.save(member);

        auditService.record(AuditAction.UPDATE, "Member", member.getId(),
                "Transferred to team " + newTeam.getName());
    }
}
