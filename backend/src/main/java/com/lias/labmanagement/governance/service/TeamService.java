package com.lias.labmanagement.governance.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ConflictException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.governance.dto.TeamRequest;
import com.lias.labmanagement.governance.dto.TeamResponse;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.entity.Team;
import com.lias.labmanagement.governance.mapper.GovernanceMapper;
import com.lias.labmanagement.governance.repository.MandateRepository;
import com.lias.labmanagement.governance.repository.TeamMembershipHistoryRepository;
import com.lias.labmanagement.governance.repository.TeamRepository;
import com.lias.labmanagement.common.enums.MandateRoleType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final MandateRepository mandateRepository;
    private final TeamMembershipHistoryRepository membershipHistoryRepository;
    private final GovernanceMapper mapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<TeamResponse> findAll() {
        return teamRepository.findAll().stream().map(this::toResponseWithLeader).toList();
    }

    @Transactional(readOnly = true)
    public TeamResponse getById(UUID id) {
        return toResponseWithLeader(findOrThrow(id));
    }

    @Transactional
    public TeamResponse create(TeamRequest request) {
        if (teamRepository.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("A team with this name already exists");
        }
        Team team = Team.builder()
                .name(request.name())
                .description(request.description())
                .creationDate(request.creationDate())
                .build();
        Team saved = teamRepository.save(team);
        auditService.record(AuditAction.CREATE, "Team", saved.getId(), "Team created: " + saved.getName());
        return toResponseWithLeader(saved);
    }

    @Transactional
    public TeamResponse update(UUID id, TeamRequest request) {
        Team team = findOrThrow(id);
        team.setName(request.name());
        team.setDescription(request.description());
        team.setCreationDate(request.creationDate());
        Team saved = teamRepository.save(team);
        auditService.record(AuditAction.UPDATE, "Team", id, "Team updated");
        return toResponseWithLeader(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Team team = findOrThrow(id);
        team.markDeleted();
        teamRepository.save(team);
        auditService.record(AuditAction.DELETE, "Team", id, "Team archived");
    }

    private TeamResponse toResponseWithLeader(Team team) {
        Mandate leaderMandate = mandateRepository
                .findByRoleAndTeamIdAndActiveTrueAndEndDateIsNull(MandateRoleType.TEAM_LEADER, team.getId())
                .orElse(null);
        long memberCount = membershipHistoryRepository.findByTeamIdAndEndDateIsNull(team.getId()).size();
        return mapper.toResponse(team,
                leaderMandate != null ? leaderMandate.getMember().getFirstName() + " " + leaderMandate.getMember().getLastName() : null,
                leaderMandate != null ? leaderMandate.getMember().getId() : null,
                memberCount);
    }

    private Team findOrThrow(UUID id) {
        return teamRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Team", id));
    }
}
