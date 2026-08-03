package com.lias.labmanagement.members.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.members.dto.AffiliationHistoryResponse;
import com.lias.labmanagement.members.dto.ChangeStatusRequest;
import com.lias.labmanagement.members.dto.LeaveAffiliationRequest;
import com.lias.labmanagement.members.dto.MemberPublicResponse;
import com.lias.labmanagement.members.dto.MemberResponse;
import com.lias.labmanagement.members.dto.MemberStatusHistoryResponse;
import com.lias.labmanagement.members.dto.MemberUpdateRequest;
import com.lias.labmanagement.members.dto.ReturnAffiliationRequest;
import com.lias.labmanagement.members.entity.AffiliationHistory;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.entity.MemberStatusHistory;
import com.lias.labmanagement.members.mapper.MemberMapper;
import com.lias.labmanagement.members.repository.AffiliationHistoryRepository;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.members.repository.MemberStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MemberStatusHistoryRepository statusHistoryRepository;
    private final AffiliationHistoryRepository affiliationHistoryRepository;
    private final MemberMapper mapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<MemberResponse> search(MemberStatus status, UUID teamId, String search, Pageable pageable) {
        Page<Member> page = memberRepository.search(status, teamId, search, pageable);
        return PageResponse.from(page, page.getContent().stream().map(mapper::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<MemberPublicResponse> searchPublic(String search, Pageable pageable) {
        Page<Member> page = memberRepository.search(null, null, search, pageable);
        return PageResponse.from(page, page.getContent().stream().map(mapper::toPublicResponse).toList());
    }

    @Transactional(readOnly = true)
    public MemberResponse getById(UUID id) {
        return mapper.toResponse(findMemberOrThrow(id));
    }

    @Transactional(readOnly = true)
    public MemberResponse getByUserId(UUID userId) {
        return mapper.toResponse(memberRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No member profile linked to this account")));
    }

    @Transactional(readOnly = true)
    public MemberPublicResponse getPublicById(UUID id) {
        return mapper.toPublicResponse(findMemberOrThrow(id));
    }

    @Transactional
    public MemberResponse updateProfile(UUID id, MemberUpdateRequest request) {
        Member member = findMemberOrThrow(id);
        String oldSnapshot = member.getFirstName() + " " + member.getLastName();

        member.setFirstName(request.firstName());
        member.setLastName(request.lastName());
        if (request.email() != null) {
            member.setEmail(request.email());
        }
        member.setPhotoUrl(request.photoUrl());
        member.setBirthDate(request.birthDate());
        member.setHomeInstitution(request.homeInstitution());
        member.setHomeLaboratory(request.homeLaboratory());
        member.setBiography(request.biography());
        member.setResearchInterests(request.researchInterests());

        Member saved = memberRepository.save(member);
        auditService.record(AuditAction.UPDATE, "Member", id, oldSnapshot,
                request.firstName() + " " + request.lastName(), "Profile updated");
        return mapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Member member = findMemberOrThrow(id);
        member.markDeleted();
        memberRepository.save(member);
        auditService.record(AuditAction.DELETE, "Member", id, "Member archived (soft delete)");
    }

    @Transactional
    public void restore(UUID id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Member", id));
        member.restore();
        memberRepository.save(member);
        auditService.record(AuditAction.RESTORE, "Member", id, "Member restored");
    }

    @Transactional
    public MemberResponse changeStatus(UUID id, ChangeStatusRequest request) {
        Member member = findMemberOrThrow(id);
        MemberStatus oldStatus = member.getCurrentStatus();

        // Close the currently open status period, if any.
        statusHistoryRepository.findByMemberIdOrderByStartDateDesc(id).stream()
                .filter(h -> h.getEndDate() == null)
                .findFirst()
                .ifPresent(current -> {
                    current.setEndDate(request.effectiveDate());
                    statusHistoryRepository.save(current);
                });

        MemberStatusHistory newEntry = MemberStatusHistory.builder()
                .member(member)
                .status(request.newStatus())
                .startDate(request.effectiveDate())
                .reason(request.reason())
                .createdAt(Instant.now())
                .build();
        statusHistoryRepository.save(newEntry);

        member.setCurrentStatus(request.newStatus());
        Member saved = memberRepository.save(member);

        auditService.record(AuditAction.STATUS_CHANGE, "Member", id, oldStatus, request.newStatus(),
                "Status changed: " + request.reason());
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MemberStatusHistoryResponse> getStatusHistory(UUID memberId) {
        return statusHistoryRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AffiliationHistoryResponse> getAffiliationHistory(UUID memberId) {
        return affiliationHistoryRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .map(mapper::toResponse).toList();
    }

    /** A member leaves the laboratory: closes the current affiliation period. */
    @Transactional
    public void leave(UUID memberId, LeaveAffiliationRequest request) {
        AffiliationHistory active = affiliationHistoryRepository.findByMemberIdAndEndDateIsNull(memberId)
                .orElseThrow(() -> new BadRequestException("Member has no active affiliation period"));
        active.setEndDate(request.leaveDate());
        active.setReason(request.reason());
        affiliationHistoryRepository.save(active);

        Member member = findMemberOrThrow(memberId);
        member.setCurrentStatus(MemberStatus.FORMER);
        memberRepository.save(member);

        auditService.record(AuditAction.STATUS_CHANGE, "Member", memberId,
                "Member left the laboratory: " + request.reason());
    }

    /** A former member returns: opens a brand new affiliation period, preserving the previous one. */
    @Transactional
    public void returnToLab(UUID memberId, ReturnAffiliationRequest request, MemberStatus reinstatedStatus) {
        Member member = findMemberOrThrow(memberId);

        AffiliationHistory newPeriod = AffiliationHistory.builder()
                .member(member)
                .startDate(request.returnDate())
                .createdAt(Instant.now())
                .build();
        affiliationHistoryRepository.save(newPeriod);

        member.setCurrentStatus(reinstatedStatus);
        memberRepository.save(member);

        auditService.record(AuditAction.STATUS_CHANGE, "Member", memberId, "Member returned to the laboratory");
    }

    private Member findMemberOrThrow(UUID id) {
        return memberRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Member", id));
    }
}
