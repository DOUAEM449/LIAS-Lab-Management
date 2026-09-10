package com.lias.labmanagement.laboratory.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.MandateRoleType;
import com.lias.labmanagement.common.util.SoftDeleteSafe;
import com.lias.labmanagement.governance.entity.Mandate;
import com.lias.labmanagement.governance.repository.MandateRepository;
import com.lias.labmanagement.laboratory.dto.LaboratoryResponse;
import com.lias.labmanagement.laboratory.dto.LaboratoryUpdateRequest;
import com.lias.labmanagement.laboratory.entity.Laboratory;
import com.lias.labmanagement.laboratory.repository.LaboratoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LaboratoryService {

    private final LaboratoryRepository repository;
    private final MandateRepository mandateRepository;
    private final AuditService auditService;

    /**
     * Returns the single logical Laboratory record, creating a minimal default one on
     * first access if none exists yet (defensive fallback — {@code LaboratoryInitializer}
     * already seeds it on startup).
     */
    @Transactional
    public LaboratoryResponse get() {
        return toResponse(getOrCreateSingleton());
    }

    @Transactional
    public LaboratoryResponse update(LaboratoryUpdateRequest request) {
        Laboratory lab = getOrCreateSingleton();
        lab.setName(request.name());
        lab.setFoundingDate(request.foundingDate());
        lab.setDescription(request.description());
        lab.setDirectorMessage(request.directorMessage());
        Laboratory saved = repository.save(lab);
        auditService.record(AuditAction.UPDATE, "Laboratory", saved.getId(), "Laboratory information updated");
        return toResponse(saved);
    }

    private Laboratory getOrCreateSingleton() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(Laboratory.builder()
                        .name("LIAS")
                        .build()));
    }

    private LaboratoryResponse toResponse(Laboratory l) {
        return new LaboratoryResponse(l.getId(), l.getName(), l.getFoundingDate(), l.getDescription(),
                l.getDirectorMessage(), currentDirectorName());
    }

    /** Resolved from the active mandate — never from a stored role (CdC §2.5). */
    private String currentDirectorName() {
        return mandateRepository.findByRoleAndActiveTrueAndEndDateIsNull(MandateRoleType.DIRECTOR)
                .map(Mandate::getMember)
                .filter(java.util.Objects::nonNull)
                .map(m -> SoftDeleteSafe.resolve(m, member -> member.getFirstName() + " " + member.getLastName(), null))
                .orElse(null);
    }
}
