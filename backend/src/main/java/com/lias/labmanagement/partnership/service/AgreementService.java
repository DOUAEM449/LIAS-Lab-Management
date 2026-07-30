package com.lias.labmanagement.partnership.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.partnership.dto.AgreementRequest;
import com.lias.labmanagement.partnership.dto.AgreementResponse;
import com.lias.labmanagement.partnership.entity.Agreement;
import com.lias.labmanagement.partnership.entity.Partner;
import com.lias.labmanagement.partnership.repository.AgreementRepository;
import com.lias.labmanagement.partnership.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgreementService {

    private final AgreementRepository agreementRepository;
    private final PartnerRepository partnerRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<AgreementResponse> getByPartner(UUID partnerId) {
        return agreementRepository.findByPartnerId(partnerId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AgreementResponse create(AgreementRequest request) {
        Partner partner = partnerRepository.findById(request.partnerId())
                .orElseThrow(() -> ResourceNotFoundException.of("Partner", request.partnerId()));
        Agreement agreement = Agreement.builder()
                .partner(partner)
                .title(request.title())
                .description(request.description())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();
        Agreement saved = agreementRepository.save(agreement);
        auditService.record(AuditAction.CREATE, "Agreement", saved.getId(), "Agreement created: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public AgreementResponse uploadDocument(UUID id, MultipartFile file) {
        Agreement agreement = findOrThrow(id);
        StoredFile stored = fileStorageService.store(file, "agreements");
        agreement.setDocumentPath(stored.relativePath());
        agreement.setDocumentOriginalName(stored.originalFileName());
        Agreement saved = agreementRepository.save(agreement);
        auditService.record(AuditAction.UPDATE, "Agreement", id, "Document uploaded");
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Agreement agreement = findOrThrow(id);
        agreement.markDeleted();
        agreementRepository.save(agreement);
        auditService.record(AuditAction.DELETE, "Agreement", id, "Agreement soft-deleted");
    }

    private Agreement findOrThrow(UUID id) {
        return agreementRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Agreement", id));
    }

    private AgreementResponse toResponse(Agreement a) {
        return new AgreementResponse(a.getId(), a.getPartner().getId(), a.getPartner().getName(), a.getTitle(),
                a.getDescription(), a.getStartDate(), a.getEndDate(), a.getDocumentOriginalName());
    }
}
