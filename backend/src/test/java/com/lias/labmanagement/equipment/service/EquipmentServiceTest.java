package com.lias.labmanagement.equipment.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.equipment.dto.DistributionRequest;
import com.lias.labmanagement.equipment.dto.EquipmentUpsertRequest;
import com.lias.labmanagement.equipment.entity.Equipment;
import com.lias.labmanagement.equipment.entity.EquipmentDistribution;
import com.lias.labmanagement.equipment.repository.EquipmentDistributionRepository;
import com.lias.labmanagement.equipment.repository.EquipmentRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * CdC §2.15 — equipment distribution / return. The stock invariant
 * ({@code 0 <= availableQuantity <= quantity}) must hold across every operation
 * and a distribution can never exceed what is available.
 */
@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock private EquipmentRepository equipmentRepository;
    @Mock private EquipmentDistributionRepository distributionRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private AuditService auditService;

    @InjectMocks private EquipmentService service;

    private Equipment equipment;
    private Member member;

    @BeforeEach
    void setUp() {
        equipment = Equipment.builder().name("Oscilloscope").category("MEASUREMENT")
                .quantity(10).availableQuantity(10).build();
        equipment.setId(UUID.randomUUID());
        member = Member.builder().firstName("Amine").lastName("Tazi").build();
        member.setId(UUID.randomUUID());
        lenient().when(distributionRepository.save(any(EquipmentDistribution.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private DistributionRequest distReq(int qty) {
        return new DistributionRequest(member.getId(), qty, LocalDate.now());
    }

    // --- distribute -------------------------------------------------------

    @Test
    void distributionReducesAvailableQuantityByTheDistributedAmount() {
        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));

        service.distribute(equipment.getId(), distReq(3));

        assertThat(equipment.getAvailableQuantity()).isEqualTo(7);
        assertThat(equipment.getQuantity()).isEqualTo(10); // total stock untouched
        verify(equipmentRepository).save(equipment);
        verify(distributionRepository).save(any(EquipmentDistribution.class));
    }

    @Test
    void distributingExactlyTheRemainingStockIsAllowedAndDrainsItToZero() {
        equipment.setAvailableQuantity(4);
        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));

        service.distribute(equipment.getId(), distReq(4));

        assertThat(equipment.getAvailableQuantity()).isZero();
    }

    @Test
    void distributionAboveAvailableStockIsRejectedAndChangesNothing() {
        equipment.setAvailableQuantity(2);
        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));

        assertThatThrownBy(() -> service.distribute(equipment.getId(), distReq(3)))
                .isInstanceOf(BadRequestException.class);

        assertThat(equipment.getAvailableQuantity()).isEqualTo(2);
        verify(equipmentRepository, never()).save(any());
        verify(distributionRepository, never()).save(any());
    }

    // --- return ---------------------------------------------------------

    @Test
    void returningADistributionPutsTheQuantityBackInStock() {
        EquipmentDistribution dist = EquipmentDistribution.builder()
                .equipment(equipment).member(member).quantity(3)
                .distributionDate(LocalDate.now().minusDays(5)).build();
        dist.setId(UUID.randomUUID());
        equipment.setAvailableQuantity(7); // 3 are out
        when(distributionRepository.findById(dist.getId())).thenReturn(Optional.of(dist));

        service.returnDistribution(dist.getId());

        assertThat(dist.getReturnedDate()).isEqualTo(LocalDate.now());
        assertThat(equipment.getAvailableQuantity()).isEqualTo(10);
    }

    @Test
    void returningAnAlreadyReturnedDistributionIsRejected() {
        EquipmentDistribution dist = EquipmentDistribution.builder()
                .equipment(equipment).member(member).quantity(3)
                .returnedDate(LocalDate.now().minusDays(1)).build();
        dist.setId(UUID.randomUUID());
        when(distributionRepository.findById(dist.getId())).thenReturn(Optional.of(dist));

        assertThatThrownBy(() -> service.returnDistribution(dist.getId()))
                .isInstanceOf(BadRequestException.class);
        assertThat(equipment.getAvailableQuantity()).isEqualTo(10); // unchanged
    }

    // --- a full round-trip: distribute then return is stock-neutral ------

    @Test
    void distributeThenReturnLeavesStockExactlyAsItStarted() {
        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));

        // capture the distribution the service creates
        var created = new EquipmentDistribution[1];
        when(distributionRepository.save(any(EquipmentDistribution.class))).thenAnswer(inv -> {
            created[0] = inv.getArgument(0);
            if (created[0].getId() == null) created[0].setId(UUID.randomUUID());
            return created[0];
        });

        service.distribute(equipment.getId(), distReq(6));
        assertThat(equipment.getAvailableQuantity()).isEqualTo(4);

        when(distributionRepository.findById(created[0].getId())).thenReturn(Optional.of(created[0]));
        service.returnDistribution(created[0].getId());

        assertThat(equipment.getAvailableQuantity()).isEqualTo(10);
    }

    // --- update: quantity change re-balances availability ----------------

    @Test
    void raisingTotalQuantityRaisesAvailabilityByTheSameDelta() {
        equipment.setQuantity(10);
        equipment.setAvailableQuantity(4); // 6 out on loan
        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.update(equipment.getId(), new EquipmentUpsertRequest(
                "Oscilloscope", null, "MEASUREMENT", null, 13));

        assertThat(equipment.getQuantity()).isEqualTo(13);
        assertThat(equipment.getAvailableQuantity()).isEqualTo(7); // 4 + (13-10)
    }

    @Test
    void loweringTotalQuantityNeverPushesAvailabilityBelowZero() {
        equipment.setQuantity(10);
        equipment.setAvailableQuantity(2);
        when(equipmentRepository.findById(equipment.getId())).thenReturn(Optional.of(equipment));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.update(equipment.getId(), new EquipmentUpsertRequest(
                "Oscilloscope", null, "MEASUREMENT", null, 5));

        assertThat(equipment.getQuantity()).isEqualTo(5);
        assertThat(equipment.getAvailableQuantity()).isZero(); // max(0, 2 + (5-10))
    }
}
