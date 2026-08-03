package com.lias.labmanagement.members.mapper;

import com.lias.labmanagement.common.util.SoftDeleteSafe;
import com.lias.labmanagement.governance.entity.Team;
import com.lias.labmanagement.members.dto.AffiliationHistoryResponse;
import com.lias.labmanagement.members.dto.MemberPublicResponse;
import com.lias.labmanagement.members.dto.MemberResponse;
import com.lias.labmanagement.members.dto.MemberStatusHistoryResponse;
import com.lias.labmanagement.members.entity.AffiliationHistory;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.entity.MemberStatusHistory;
import org.springframework.stereotype.Component;

@Component
public class MemberMapper {

    public MemberResponse toResponse(Member m) {
        Team team = m.getCurrentTeam();
        return new MemberResponse(
                m.getId(), m.getFirstName(), m.getLastName(), m.getEmail(), m.getPhotoUrl(),
                m.getBirthDate(), m.getHireDate(), m.getFirstAffiliationDate(),
                m.getHomeInstitution(), m.getHomeLaboratory(), m.getBiography(), m.getResearchInterests(),
                m.getCurrentStatus(), team != null ? team.getId() : null,
                team != null ? SoftDeleteSafe.resolve(team, Team::getName, "Équipe archivée") : null,
                m.getVersion()
        );
    }

    public MemberPublicResponse toPublicResponse(Member m) {
        Team team = m.getCurrentTeam();
        return new MemberPublicResponse(
                m.getId(), m.getFirstName(), m.getLastName(), m.getPhotoUrl(),
                m.getBiography(), m.getResearchInterests(), m.getCurrentStatus(),
                team != null ? team.getId() : null,
                team != null ? SoftDeleteSafe.resolve(team, Team::getName, "Équipe archivée") : null
        );
    }

    public MemberStatusHistoryResponse toResponse(MemberStatusHistory h) {
        return new MemberStatusHistoryResponse(h.getId(), h.getStatus(), h.getStartDate(), h.getEndDate(),
                h.getReason(), h.getCreatedAt());
    }

    public AffiliationHistoryResponse toResponse(AffiliationHistory a) {
        return new AffiliationHistoryResponse(a.getId(), a.getStartDate(), a.getEndDate(), a.getReason());
    }
}
