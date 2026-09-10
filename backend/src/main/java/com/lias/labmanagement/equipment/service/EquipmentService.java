package com.lias.labmanagement.equipment.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.util.SoftDeleteSafe;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.equipment.dto.DistributionRequest;
import com.lias.labmanagement.equipment.dto.DistributionResponse;
import com.lias.labmanagement.equipment.dto.EquipmentResponse;
import com.lias.labmanagement.equipment.dto.EquipmentUpsertRequest;
import com.lias.labmanagement.equipment.dto.NonRecipientResponse;
import com.lias.labmanagement.equipment.entity.Equipment;
import com.lias.labmanagement.equipment.entity.EquipmentDistribution;
import com.lias.labmanagement.equipment.repository.EquipmentDistributionRepository;
import com.lias.labmanagement.equipment.repository.EquipmentRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentDistributionRepository distributionRepository;
    private final MemberRepository memberRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<EquipmentResponse> search(String query, Pageable pageable) {
        Page<Equipment> page = equipmentRepository.search(query, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public EquipmentResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public EquipmentResponse create(EquipmentUpsertRequest request) {
        Equipment equipment = Equipment.builder()
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .arrivalDate(request.arrivalDate())
                .quantity(request.quantity())
                .availableQuantity(request.quantity())
                .build();
        Equipment saved = equipmentRepository.save(equipment);
        auditService.record(AuditAction.CREATE, "Equipment", saved.getId(), "Equipment added: " + saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public EquipmentResponse update(UUID id, EquipmentUpsertRequest request) {
        Equipment equipment = findOrThrow(id);
        int delta = request.quantity() - equipment.getQuantity();
        equipment.setName(request.name());
        equipment.setDescription(request.description());
        equipment.setCategory(request.category());
        equipment.setArrivalDate(request.arrivalDate());
        equipment.setQuantity(request.quantity());
        equipment.setAvailableQuantity(Math.max(0, equipment.getAvailableQuantity() + delta));
        Equipment saved = equipmentRepository.save(equipment);
        auditService.record(AuditAction.UPDATE, "Equipment", id, "Equipment updated");
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Equipment equipment = findOrThrow(id);
        equipment.markDeleted();
        equipmentRepository.save(equipment);
        auditService.record(AuditAction.DELETE, "Equipment", id, "Equipment soft-deleted");
    }

    @Transactional
    public DistributionResponse distribute(UUID equipmentId, DistributionRequest request) {
        Equipment equipment = findOrThrow(equipmentId);
        if (equipment.getAvailableQuantity() < request.quantity()) {
            throw new BadRequestException("Not enough available quantity for this equipment");
        }
        Member member = memberRepository.findById(request.memberId())
                .orElseThrow(() -> ResourceNotFoundException.of("Member", request.memberId()));

        equipment.setAvailableQuantity(equipment.getAvailableQuantity() - request.quantity());
        equipmentRepository.save(equipment);

        EquipmentDistribution distribution = distributionRepository.save(EquipmentDistribution.builder()
                .equipment(equipment)
                .member(member)
                .distributionDate(request.distributionDate() != null ? request.distributionDate() : LocalDate.now())
                .quantity(request.quantity())
                .build());

        auditService.record(AuditAction.CREATE, "EquipmentDistribution", distribution.getId(),
                "Distributed " + request.quantity() + " of " + equipment.getName() + " to member " + member.getId());
        return toDistributionResponse(distribution);
    }

    @Transactional
    public DistributionResponse returnDistribution(UUID distributionId) {
        EquipmentDistribution distribution = distributionRepository.findById(distributionId)
                .orElseThrow(() -> ResourceNotFoundException.of("EquipmentDistribution", distributionId));
        if (distribution.getReturnedDate() != null) {
            throw new BadRequestException("This distribution has already been returned");
        }
        distribution.setReturnedDate(LocalDate.now());

        Equipment equipment = distribution.getEquipment();
        equipment.setAvailableQuantity(equipment.getAvailableQuantity() + distribution.getQuantity());
        equipmentRepository.save(equipment);

        EquipmentDistribution saved = distributionRepository.save(distribution);
        auditService.record(AuditAction.UPDATE, "EquipmentDistribution", distributionId, "Equipment returned");
        return toDistributionResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DistributionResponse> getDistributionsForEquipment(UUID equipmentId) {
        return distributionRepository.findByEquipmentId(equipmentId).stream().map(this::toDistributionResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DistributionResponse> getDistributionsForMember(UUID memberId) {
        return distributionRepository.findByMemberId(memberId).stream().map(this::toDistributionResponse).toList();
    }

    /** CdC §2.15 — "qui n'a pas reçu" this equipment item, among active members. */
    @Transactional(readOnly = true)
    public List<NonRecipientResponse> getNonRecipients(UUID equipmentId) {
        findOrThrow(equipmentId); // 404 if the equipment itself doesn't exist
        return distributionRepository.findMembersWithoutDistribution(equipmentId).stream()
                .map(m -> new NonRecipientResponse(m.getId(), m.getFirstName() + " " + m.getLastName()))
                .toList();
    }

    private Equipment findOrThrow(UUID id) {
        return equipmentRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Equipment", id));
    }

    private EquipmentResponse toResponse(Equipment e) {
        return new EquipmentResponse(e.getId(), e.getName(), e.getDescription(), e.getCategory(),
                e.getArrivalDate(), e.getQuantity(), e.getAvailableQuantity());
    }

    private DistributionResponse toDistributionResponse(EquipmentDistribution d) {
        return new DistributionResponse(d.getId(), d.getEquipment().getId(),
                SoftDeleteSafe.resolve(d.getEquipment(), Equipment::getName, "Matériel archivé"),
                d.getMember().getId(),
                SoftDeleteSafe.resolve(d.getMember(), m -> m.getFirstName() + " " + m.getLastName(), "Membre archivé"),
                d.getDistributionDate(), d.getQuantity(), d.getReturnedDate());
    }
}
