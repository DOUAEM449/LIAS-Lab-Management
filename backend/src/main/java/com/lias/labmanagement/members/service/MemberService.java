package com.lias.labmanagement.members.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleChangeSource;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
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
import com.lias.labmanagement.governance.service.MandateService;
import com.lias.labmanagement.governance.service.UserRoleSyncService;
import com.lias.labmanagement.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MemberService {

    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final MemberRepository memberRepository;
    private final MemberStatusHistoryRepository statusHistoryRepository;
    private final AffiliationHistoryRepository affiliationHistoryRepository;
    private final MemberMapper mapper;
    private final AuditService auditService;
    private final FileStorageService fileStorageService;
    private final MandateService mandateService;
    private final UserRoleSyncService userRoleSyncService;

    @Transactional(readOnly = true)
    public PageResponse<MemberResponse> search(MemberStatus status, UUID teamId, String search, Pageable pageable,
                                                CustomUserDetails currentUser) {
        Page<Member> page = memberRepository.search(status, teamId, search, pageable);
        return PageResponse.from(page, page.getContent().stream()
                .map(m -> redactBirthDateIfNotAuthorized(m, mapper.toResponse(m), currentUser)).toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<MemberPublicResponse> searchPublic(String search, Pageable pageable) {
        Page<Member> page = memberRepository.search(null, null, search, pageable);
        return PageResponse.from(page, page.getContent().stream().map(mapper::toPublicResponse).toList());
    }

    /**
     * CdC §4.2: birth date is confidential — visible only to the member themselves, or to
     * SYSTEM_ADMIN/DIRECTOR/VICE_DIRECTOR. Redacted (nulled) for everyone else.
     */
    @Transactional(readOnly = true)
    public MemberResponse getById(UUID id, CustomUserDetails currentUser) {
        Member member = findMemberOrThrow(id);
        return redactBirthDateIfNotAuthorized(member, mapper.toResponse(member), currentUser);
    }

    private MemberResponse redactBirthDateIfNotAuthorized(Member member, MemberResponse response, CustomUserDetails currentUser) {
        if (response.birthDate() == null || currentUser == null) {
            return response;
        }
        boolean isSelf = member.getUser() != null && member.getUser().getId().equals(currentUser.getId());
        boolean isAuthorized = isSelf || PROFILE_ADMIN_ROLES.contains(currentUser.getRole());
        if (isAuthorized) {
            return response;
        }
        return new MemberResponse(response.id(), response.firstName(), response.lastName(), response.email(),
                response.photoUrl(), null, response.hireDate(), response.firstAffiliationDate(),
                response.homeInstitution(), response.homeLaboratory(), response.biography(), response.researchInterests(),
                response.currentStatus(), response.currentTeamId(), response.currentTeamName(), response.version());
    }

    @Transactional(readOnly = true)
    public MemberResponse getByUserId(UUID userId) {
        return mapper.toResponse(memberRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No member profile linked to this account")));
    }

    /** Stored under "public/avatars" so the result lands under the already-public /files/public/** URL space. */
    @Transactional
    public MemberResponse uploadAvatar(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file must not be empty");
        }
        if (!ALLOWED_AVATAR_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Avatar must be a JPEG, PNG or WEBP image");
        }
        // The declared type above comes from the client and proves nothing. The stored
        // extension — which decides the type the browser is told when /files/public serves
        // the file, without authentication — is taken from the bytes themselves.
        String extension = imageExtensionFromContent(file);
        Member member = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No member profile linked to this account"));

        StoredFile stored = fileStorageService.store(file, "public/avatars", extension);
        member.setPhotoUrl("/files/" + stored.relativePath());
        Member saved = memberRepository.save(member);
        auditService.record(AuditAction.UPDATE, "Member", saved.getId(), "Avatar updated");
        return mapper.toResponse(saved);
    }

    /** Removes the current user's avatar, reverting their profile to the default (no photo). */
    @Transactional
    public MemberResponse deleteAvatar(UUID userId) {
        Member member = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No member profile linked to this account"));

        String previousPhoto = member.getPhotoUrl();
        member.setPhotoUrl(null);
        Member saved = memberRepository.save(member);

        if (previousPhoto != null && previousPhoto.startsWith("/files/")) {
            fileStorageService.delete(previousPhoto.substring("/files/".length()));
        }

        auditService.record(AuditAction.UPDATE, "Member", saved.getId(), "Avatar removed");
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public MemberPublicResponse getPublicById(UUID id) {
        return mapper.toPublicResponse(findMemberOrThrow(id));
    }

    private static final Set<RoleName> PROFILE_ADMIN_ROLES =
            Set.of(RoleName.SYSTEM_ADMIN, RoleName.DIRECTOR, RoleName.VICE_DIRECTOR);

    /**
     * A member may only edit their own profile. SYSTEM_ADMIN, DIRECTOR and
     * VICE_DIRECTOR (director in active mandate) may edit any profile.
     * CdC: "Un membre peut modifier QUE son propre profil."
     */
    @Transactional
    public MemberResponse updateProfile(UUID id, MemberUpdateRequest request, CustomUserDetails currentUser) {
        Member member = findMemberOrThrow(id);
        boolean isSelf = member.getUser() != null && member.getUser().getId().equals(currentUser.getId());
        boolean isProfileAdmin = PROFILE_ADMIN_ROLES.contains(currentUser.getRole());
        if (!isSelf && !isProfileAdmin) {
            throw new AccessDeniedException("You can only edit your own profile");
        }
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

        // An archived member holds no governance responsibility any more: close their active
        // mandates first, exactly as the RETIRED/FORMER transition does, so no governance
        // screen can still present an archived member as a sitting officer. The mandates are
        // closed (end date set), never deleted -- the governance history stays intact.
        mandateService.endAllActiveMandatesForMember(id, LocalDate.now(), "member archived");
        userRoleSyncService.syncForMember(member, RoleChangeSource.MANDATE_CHANGE);

        member.markDeleted();
        memberRepository.save(member);
        auditService.record(AuditAction.DELETE, "Member", id, "Member archived (soft delete)");
    }

    @Transactional
    public void restore(UUID id) {
        // Not findById: @SQLRestriction("deleted = false") hides archived rows from it, so it
        // could never find the member this method exists to bring back.
        Member member = memberRepository.findByIdIncludingArchived(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Member", id));
        if (!member.isDeleted()) {
            return;
        }
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

        // A member frozen (RETIRED) or deactivated (FORMER) must not keep dangling
        // "active" governance mandates, then recompute their effective role either way
        // (P0.1/P0.2 — Statut change can also promote/demote independently of Mandate).
        if (request.newStatus() == MemberStatus.RETIRED || request.newStatus() == MemberStatus.FORMER) {
            mandateService.endAllActiveMandatesForMember(id, request.effectiveDate(),
                    "member status became " + request.newStatus());
        }
        userRoleSyncService.syncForMember(saved, RoleChangeSource.STATUS_CHANGE);

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
        MemberStatus oldStatus = member.getCurrentStatus();

        statusHistoryRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .filter(h -> h.getEndDate() == null)
                .findFirst()
                .ifPresent(current -> {
                    current.setEndDate(request.leaveDate());
                    statusHistoryRepository.save(current);
                });
        statusHistoryRepository.save(MemberStatusHistory.builder()
                .member(member)
                .status(MemberStatus.FORMER)
                .startDate(request.leaveDate())
                .reason("Member left the laboratory: " + request.reason())
                .createdAt(Instant.now())
                .build());

        member.setCurrentStatus(MemberStatus.FORMER);
        Member saved = memberRepository.save(member);

        mandateService.endAllActiveMandatesForMember(memberId, request.leaveDate(),
                "member left the laboratory");
        userRoleSyncService.syncForMember(saved, RoleChangeSource.STATUS_CHANGE);

        auditService.record(AuditAction.STATUS_CHANGE, "Member", memberId, oldStatus, MemberStatus.FORMER,
                "Member left the laboratory: " + request.reason());
    }

    /** A former member returns: opens a brand new affiliation period, preserving the previous one. */
    @Transactional
    public void returnToLab(UUID memberId, ReturnAffiliationRequest request, MemberStatus reinstatedStatus) {
        Member member = findMemberOrThrow(memberId);

        // Only someone who has actually left may return. Without this guard, calling it on an
        // active member opens a second affiliation period, and leave() then fails at 500
        // because two periods are left open.
        if (member.getCurrentStatus() != MemberStatus.RETIRED && member.getCurrentStatus() != MemberStatus.FORMER) {
            throw new BadRequestException("Only a retired or former member can return to the laboratory");
        }

        AffiliationHistory newPeriod = AffiliationHistory.builder()
                .member(member)
                .startDate(request.returnDate())
                .createdAt(Instant.now())
                .build();
        affiliationHistoryRepository.save(newPeriod);

        // Close the FORMER/RETIRED status period and reopen a fresh one, symmetrically
        // with how leave()/changeStatus() close the previous period.
        statusHistoryRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
                .filter(h -> h.getEndDate() == null)
                .findFirst()
                .ifPresent(current -> {
                    current.setEndDate(request.returnDate());
                    statusHistoryRepository.save(current);
                });
        statusHistoryRepository.save(MemberStatusHistory.builder()
                .member(member)
                .status(reinstatedStatus)
                .startDate(request.returnDate())
                .reason("Member returned to the laboratory")
                .createdAt(Instant.now())
                .build());

        member.setCurrentStatus(reinstatedStatus);
        memberRepository.save(member);

        userRoleSyncService.syncForMember(member, RoleChangeSource.STATUS_CHANGE);

        auditService.record(AuditAction.STATUS_CHANGE, "Member", memberId, "Member returned to the laboratory");
    }

    /**
     * Identifies a JPEG, PNG or WEBP image by its signature (first bytes) and returns the
     * extension to store it under. Anything else is refused, whatever its declared type.
     */
    static String imageExtensionFromContent(MultipartFile file) {
        byte[] head;
        try (InputStream in = file.getInputStream()) {
            head = in.readNBytes(12);
        } catch (IOException e) {
            throw new BadRequestException("Avatar could not be read");
        }
        if (startsWith(head, 0xFF, 0xD8, 0xFF)) {
            return ".jpg";
        }
        if (startsWith(head, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
            return ".png";
        }
        if (startsWith(head, 'R', 'I', 'F', 'F') && head.length >= 12
                && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P') {
            return ".webp";
        }
        throw new BadRequestException("Avatar must be a JPEG, PNG or WEBP image");
    }

    private static boolean startsWith(byte[] data, int... signature) {
        if (data.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((data[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private Member findMemberOrThrow(UUID id) {
        return memberRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Member", id));
    }
}
