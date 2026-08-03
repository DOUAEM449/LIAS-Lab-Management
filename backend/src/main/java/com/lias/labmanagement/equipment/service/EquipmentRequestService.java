package com.lias.labmanagement.equipment.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.EquipmentRequestStatus;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.util.SoftDeleteSafe;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.equipment.dto.EquipmentRequestResponse;
import com.lias.labmanagement.equipment.dto.EquipmentRequestSubmission;
import com.lias.labmanagement.equipment.entity.EquipmentRequest;
import com.lias.labmanagement.equipment.repository.EquipmentRequestRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EquipmentRequestService {

    private final EquipmentRequestRepository requestRepository;
    private final MemberRepository memberRepository;
    private final AuditService auditService;

    @Transactional
    public EquipmentRequestResponse submit(UUID requesterId, EquipmentRequestSubmission submission) {
        Member requester = memberRepository.findById(requesterId)
                .orElseThrow(() -> ResourceNotFoundException.of("Member", requesterId));
        EquipmentRequest request = EquipmentRequest.builder()
                .requester(requester)
                .itemName(submission.itemName())
                .description(submission.description())
                .quantity(submission.quantity())
                .status(EquipmentRequestStatus.PENDING)
                .build();
        EquipmentRequest saved = requestRepository.save(request);
        auditService.record(AuditAction.CREATE, "EquipmentRequest", saved.getId(), "Equipment request submitted");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<EquipmentRequestResponse> findByStatus(EquipmentRequestStatus status, Pageable pageable) {
        Page<EquipmentRequest> page = requestRepository.findByStatus(status, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<EquipmentRequestResponse> findByRequester(UUID requesterId, Pageable pageable) {
        Page<EquipmentRequest> page = requestRepository.findByRequesterId(requesterId, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional
    public EquipmentRequestResponse decide(UUID id, UUID decidedBy, EquipmentRequestStatus decision, String note) {
        EquipmentRequest request = requestRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("EquipmentRequest", id));
        if (request.getStatus() != EquipmentRequestStatus.PENDING) {
            throw new BadRequestException("This request has already been decided");
        }
        request.setStatus(decision);
        request.setValidatedBy(decidedBy);
        request.setValidationDate(Instant.now());
        request.setValidationNote(note);
        EquipmentRequest saved = requestRepository.save(request);
        auditService.record(AuditAction.UPDATE, "EquipmentRequest", id, "Request " + decision.name().toLowerCase());
        return toResponse(saved);
    }

    private EquipmentRequestResponse toResponse(EquipmentRequest r) {
        return new EquipmentRequestResponse(r.getId(), r.getRequester().getId(),
                SoftDeleteSafe.resolve(r.getRequester(), m -> m.getFirstName() + " " + m.getLastName(), "Membre archivé"),
                r.getItemName(), r.getDescription(), r.getQuantity(), r.getStatus(), r.getValidatedBy(),
                r.getValidationDate(), r.getValidationNote());
    }
}
