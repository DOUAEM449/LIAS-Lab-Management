package com.lias.labmanagement.governance.mapper;

import com.lias.labmanagement.governance.dto.MandateResponse;
import com.lias.labmanagement.governance.dto.TeamMembershipHistoryResponse;
import com.lias.labmanagement.governance.dto.TeamResponse;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.entity.Team;
import com.lias.labmanagement.governance.entity.TeamMembershipHistory;
import org.springframework.stereotype.Component;

@Component
public class GovernanceMapper {

    public TeamResponse toResponse(Team t, String leaderName, java.util.UUID leaderId, long memberCount) {
        return new TeamResponse(t.getId(), t.getName(), t.getDescription(), t.getCreationDate(),
                leaderName, leaderId, memberCount, t.getVersion());
    }

    public MandateResponse toResponse(Mandate m) {
        return new MandateResponse(
                m.getId(),
                m.getMember().getId(),
                m.getMember().getFirstName() + " " + m.getMember().getLastName(),
                m.getRole(),
                m.getTeam() != null ? m.getTeam().getId() : null,
                m.getTeam() != null ? m.getTeam().getName() : null,
                m.getStartDate(), m.getEndDate(), m.isActive(), m.getCreatedAt()
        );
    }

    public TeamMembershipHistoryResponse toResponse(TeamMembershipHistory h) {
        return new TeamMembershipHistoryResponse(h.getId(), h.getTeam().getId(), h.getTeam().getName(),
                h.getStartDate(), h.getEndDate(), h.getCreatedAt());
    }
}
