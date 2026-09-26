package com.lias.labmanagement.administration.service;

import com.lias.labmanagement.administration.dto.GlobalSearchResult;
import com.lias.labmanagement.common.enums.DocumentCategory;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.document.entity.DocumentEntity;
import com.lias.labmanagement.document.repository.DocumentRepository;
import com.lias.labmanagement.equipment.entity.Equipment;
import com.lias.labmanagement.equipment.repository.EquipmentRepository;
import com.lias.labmanagement.event.repository.EventRepository;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.publication.repository.PublicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * CdC §2.2.C closes the internal modules (documents, equipment, meetings) to PhD students.
 * Their controllers enforced it; the search bar did not, and listed their titles to anyone
 * signed in. The rule is now applied here too.
 */
@ExtendWith(MockitoExtension.class)
class GlobalSearchServiceTest {

    @Mock private MemberRepository memberRepository;
    @Mock private PublicationRepository publicationRepository;
    @Mock private EventRepository eventRepository;
    @Mock private DocumentRepository documentRepository;
    @Mock private EquipmentRepository equipmentRepository;

    @InjectMocks private GlobalSearchService service;

    @BeforeEach
    void openModulesAnswerEmpty() {
        when(memberRepository.search(any(), any(), any(), any())).thenReturn(Page.empty());
        when(publicationRepository.search(any(), any(), any(), any(), any())).thenReturn(Page.empty());
        when(eventRepository.search(any(), any(), any())).thenReturn(Page.empty());
    }

    @Test
    void aPhdStudentFindsNothingFromTheInternalModules() {
        List<GlobalSearchResult> results = service.search("budget", RoleName.PHD_STUDENT);

        assertThat(results).isEmpty();
        // Not filtered after the fact: the internal repositories are never even queried.
        verifyNoInteractions(documentRepository, equipmentRepository);
    }

    @Test
    void aMemberWithInternalAccessFindsDocumentsAndEquipment() {
        DocumentEntity document = DocumentEntity.builder().title("Budget 2026").category(DocumentCategory.PROGRAM).build();
        document.setId(UUID.randomUUID());
        Equipment equipment = Equipment.builder().name("GPU budget node").category("Calcul").build();
        equipment.setId(UUID.randomUUID());
        when(documentRepository.search(any(), any(), any())).thenReturn(new PageImpl<>(List.of(document)));
        when(equipmentRepository.search(any(), any())).thenReturn(new PageImpl<>(List.of(equipment)));

        List<GlobalSearchResult> results = service.search("budget", RoleName.PERMANENT_MEMBER);

        assertThat(results).extracting(GlobalSearchResult::entityType).containsExactly("DOCUMENT", "EQUIPMENT");
    }

    @Test
    void anUnknownCallerIsTreatedAsHavingNoInternalAccess() {
        service.search("budget", null);

        verifyNoInteractions(documentRepository, equipmentRepository);
    }
}
