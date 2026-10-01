package com.lias.labmanagement.membershiprequest.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.NotificationType;
import com.lias.labmanagement.common.enums.RequestStatus;
import com.lias.labmanagement.common.enums.RoleChangeSource;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ConflictException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.mail.MailService;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.governance.service.UserRoleSyncService;
import com.lias.labmanagement.membershiprequest.dto.MembershipRequestResponse;
import com.lias.labmanagement.membershiprequest.dto.MembershipRequestSubmission;
import com.lias.labmanagement.membershiprequest.entity.MembershipRequest;
import com.lias.labmanagement.membershiprequest.repository.MembershipRequestRepository;
import com.lias.labmanagement.members.entity.AffiliationHistory;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.entity.MemberStatusHistory;
import com.lias.labmanagement.members.repository.AffiliationHistoryRepository;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.members.repository.MemberStatusHistoryRepository;
import com.lias.labmanagement.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MembershipRequestService {

    private static final Map<MemberStatus, RoleName> STATUS_TO_ROLE = Map.of(
            MemberStatus.PERMANENT, RoleName.PERMANENT_MEMBER,
            MemberStatus.ASSOCIATE, RoleName.ASSOCIATE_MEMBER,
            MemberStatus.PHD_STUDENT, RoleName.PHD_STUDENT,
            MemberStatus.RETIRED, RoleName.RETIRED_MEMBER,
            MemberStatus.FORMER, RoleName.FORMER_MEMBER
    );

    private final MembershipRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final MemberStatusHistoryRepository statusHistoryRepository;
    private final AffiliationHistoryRepository affiliationHistoryRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final AuditService auditService;
    private final UserRoleSyncService userRoleSyncService;
    private final NotificationService notificationService;

    @Transactional
    /**
     * The CV is uploaded by an anonymous applicant. It is restricted to a real PDF — checked
     * by its signature ({@code %PDF-}), not the client-declared type — so the public
     * submission endpoint cannot be used to plant arbitrary files.
     */
    private static void requirePdf(MultipartFile cv) {
        byte[] head;
        try (java.io.InputStream in = cv.getInputStream()) {
            head = in.readNBytes(5);
        } catch (java.io.IOException e) {
            throw new BadRequestException("CV could not be read");
        }
        if (head.length < 5 || head[0] != '%' || head[1] != 'P' || head[2] != 'D'
                || head[3] != 'F' || head[4] != '-') {
            throw new BadRequestException("The CV must be a PDF file");
        }
    }

    public MembershipRequestResponse submit(MembershipRequestSubmission submission, MultipartFile cv) {
        if (userRepository.existsByEmailIgnoreCase(submission.email())) {
            throw new ConflictException("An account already exists with this email");
        }
        if (requestRepository.existsByEmailIgnoreCaseAndStatus(submission.email(), RequestStatus.PENDING)) {
            throw new BadRequestException("Une demande d'adhésion est déjà en cours pour cet email.");
        }

        MembershipRequest.MembershipRequestBuilder<?, ?> builder = MembershipRequest.builder()
                .firstName(submission.firstName())
                .lastName(submission.lastName())
                .email(submission.email())
                .requestedStatus(submission.requestedStatus())
                .homeInstitution(submission.homeInstitution())
                .motivationLetter(submission.motivationLetter())
                .status(RequestStatus.PENDING)
                .submittedAt(Instant.now());

        MembershipRequest request = builder.build();

        if (cv != null && !cv.isEmpty()) {
            requirePdf(cv);
            StoredFile stored = fileStorageService.store(cv, "membership-cv");
            request.setCvPath(stored.relativePath());
            request.setCvOriginalName(stored.originalFileName());
        }

        MembershipRequest saved = requestRepository.save(request);

        // CdC §2.6/§2.20: the application is decided by the acting Director — tell the
        // governance in-app that something is waiting for their validation.
        notificationService.notifyGovernance(NotificationType.MEMBERSHIP_REQUEST,
                "Nouvelle demande d'adhésion de " + saved.getFirstName() + " " + saved.getLastName()
                        + " (" + saved.getRequestedStatus() + ") à valider.",
                "MembershipRequest", saved.getId());

        auditService.record(AuditAction.CREATE, "MembershipRequest", saved.getId(), "New membership application submitted");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<MembershipRequestResponse> findByStatus(RequestStatus status, Pageable pageable) {
        Page<MembershipRequest> page = requestRepository.findByStatus(status, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public MembershipRequestResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    /**
     * Approve a pending application: creates the User account and Member
     * profile, opens the first affiliation and status history period, and
     * notifies the applicant by email. Restricted to the acting Director /
     * Vice-Director (enforced at the controller level).
     */
    @Transactional
    public MembershipRequestResponse approve(UUID id, UUID decidedBy, String decisionNote) {
        MembershipRequest request = findOrThrow(id);
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been decided");
        }

        String temporaryPassword = generateTemporaryPassword();
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(temporaryPassword))
                .role(STATUS_TO_ROLE.getOrDefault(request.getRequestedStatus(), RoleName.ASSOCIATE_MEMBER))
                .enabled(true)
                .mustChangePassword(true)
                .build();
        User savedUser = userRepository.save(user);

        LocalDate today = LocalDate.now();
        Member member = Member.builder()
                .user(savedUser)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .homeInstitution(request.getHomeInstitution())
                .firstAffiliationDate(today)
                .currentStatus(request.getRequestedStatus())
                .build();
        Member savedMember = memberRepository.save(member);
        // Records the very first row of this account's role history (P0.1) — from
        // this point on, UserRoleSyncService is the single place that ever changes User.role.
        userRoleSyncService.syncForMember(savedMember, RoleChangeSource.STATUS_CHANGE);

        statusHistoryRepository.save(MemberStatusHistory.builder()
                .member(savedMember)
                .status(request.getRequestedStatus())
                .startDate(today)
                .reason("Initial status from approved membership request")
                .createdAt(Instant.now())
                .build());

        affiliationHistoryRepository.save(AffiliationHistory.builder()
                .member(savedMember)
                .startDate(today)
                .createdAt(Instant.now())
                .build());

        request.setStatus(RequestStatus.APPROVED);
        request.setDecidedBy(decidedBy);
        request.setDecisionDate(Instant.now());
        request.setDecisionNote(decisionNote);
        MembershipRequest saved = requestRepository.save(request);

        mailService.send(request.getEmail(), "LIAS Laboratory - Membership Approved",
                "Congratulations! Your membership application has been approved.\n\n"
                        + "Your account has been created:\nEmail: " + request.getEmail()
                        + "\nTemporary password: " + temporaryPassword
                        + "\n\nYou will be asked to change this password on first login.");

        notificationService.notify(savedMember.getId(), NotificationType.MEMBERSHIP_DECISION,
                "Votre demande d'adhésion a été approuvée. Bienvenue au LIAS !",
                "MembershipRequest", saved.getId());

        auditService.record(AuditAction.APPROVE, "MembershipRequest", id,
                "Approved, account created for member " + savedMember.getId());
        return toResponse(saved);
    }

    @Transactional
    public MembershipRequestResponse reject(UUID id, UUID decidedBy, String decisionNote) {
        MembershipRequest request = findOrThrow(id);
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been decided");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setDecidedBy(decidedBy);
        request.setDecisionDate(Instant.now());
        request.setDecisionNote(decisionNote);
        MembershipRequest saved = requestRepository.save(request);

        // No in-app Notification here: a rejected applicant never gets a User/Member
        // account, so there is no recipient to notify in-app — email is the only channel.
        mailService.send(request.getEmail(), "LIAS Laboratory - Membership Application Update",
                "We regret to inform you that your membership application was not approved."
                        + (decisionNote != null ? "\n\nReason: " + decisionNote : ""));

        auditService.record(AuditAction.REJECT, "MembershipRequest", id, "Application rejected");
        return toResponse(saved);
    }

    private String generateTemporaryPassword() {
        SecureRandom random = new SecureRandom();
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private MembershipRequest findOrThrow(UUID id) {
        return requestRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("MembershipRequest", id));
    }

    private MembershipRequestResponse toResponse(MembershipRequest r) {
        return new MembershipRequestResponse(r.getId(), r.getFirstName(), r.getLastName(), r.getEmail(),
                r.getRequestedStatus(), r.getHomeInstitution(), r.getMotivationLetter(), r.getCvOriginalName(),
                r.getStatus(), r.getSubmittedAt(), r.getDecidedBy(), r.getDecisionDate(), r.getDecisionNote());
    }
}
