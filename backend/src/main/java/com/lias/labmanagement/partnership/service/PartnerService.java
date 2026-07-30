package com.lias.labmanagement.partnership.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.partnership.dto.PartnerRequest;
import com.lias.labmanagement.partnership.dto.PartnerResponse;
import com.lias.labmanagement.partnership.entity.Partner;
import com.lias.labmanagement.partnership.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PartnerService {

    private final PartnerRepository partnerRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<PartnerResponse> search(String query, Pageable pageable) {
        Page<Partner> page = partnerRepository.search(query, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public PartnerResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public PartnerResponse create(PartnerRequest request) {
        Partner partner = Partner.builder()
                .name(request.name())
                .type(request.type())
                .country(request.country())
                .contactInfo(request.contactInfo())
                .build();
        Partner saved = partnerRepository.save(partner);
        auditService.record(AuditAction.CREATE, "Partner", saved.getId(), "Partner added: " + saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public PartnerResponse update(UUID id, PartnerRequest request) {
        Partner partner = findOrThrow(id);
        partner.setName(request.name());
        partner.setType(request.type());
        partner.setCountry(request.country());
        partner.setContactInfo(request.contactInfo());
        Partner saved = partnerRepository.save(partner);
        auditService.record(AuditAction.UPDATE, "Partner", id, "Partner updated");
        return toResponse(saved);
    }

    @Transactional
    public PartnerResponse uploadLogo(UUID id, MultipartFile file) {
        Partner partner = findOrThrow(id);
        StoredFile stored = fileStorageService.store(file, "partner-logos");
        partner.setLogoPath(stored.relativePath());
        Partner saved = partnerRepository.save(partner);
        auditService.record(AuditAction.UPDATE, "Partner", id, "Logo uploaded");
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Partner partner = findOrThrow(id);
        partner.markDeleted();
        partnerRepository.save(partner);
        auditService.record(AuditAction.DELETE, "Partner", id, "Partner soft-deleted");
    }

    private Partner findOrThrow(UUID id) {
        return partnerRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Partner", id));
    }

    private PartnerResponse toResponse(Partner p) {
        return new PartnerResponse(p.getId(), p.getName(), p.getType(), p.getCountry(), p.getContactInfo(), p.getLogoPath());
    }
}
