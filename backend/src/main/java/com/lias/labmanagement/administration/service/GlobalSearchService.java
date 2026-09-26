package com.lias.labmanagement.administration.service;

import com.lias.labmanagement.administration.dto.GlobalSearchResult;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.document.repository.DocumentRepository;
import com.lias.labmanagement.equipment.repository.EquipmentRepository;
import com.lias.labmanagement.event.repository.EventRepository;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.publication.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Cross-module keyword search used by the global search bar in the
 * application shell. Queries the most relevant modules (members,
 * publications, events, documents, equipment) and returns a unified,
 * lightweight result list. Open to every authenticated user; each
 * underlying repository query already respects soft-delete rules via
 * {@code @SQLRestriction} on the corresponding entities.
 */
@Service
@RequiredArgsConstructor
public class GlobalSearchService {

    private static final int MAX_RESULTS_PER_MODULE = 5;

    private final MemberRepository memberRepository;
    private final PublicationRepository publicationRepository;
    private final EventRepository eventRepository;
    private final DocumentRepository documentRepository;
    private final EquipmentRepository equipmentRepository;

    /**
     * @param callerRole role of the person searching. Documents and equipment are internal
     *                   modules (CdC §2.2.C): a caller who cannot open those modules must
     *                   not be able to list their content from here either. Null counts as
     *                   no access.
     */
    @Transactional(readOnly = true)
    public List<GlobalSearchResult> search(String query, RoleName callerRole) {
        List<GlobalSearchResult> results = new ArrayList<>();
        if (query == null || query.isBlank()) {
            return results;
        }
        boolean internalModules = callerRole != null && callerRole.canAccessInternalModules();
        var page = PageRequest.of(0, MAX_RESULTS_PER_MODULE);

        memberRepository.search(null, null, query, page).forEach(m ->
                results.add(new GlobalSearchResult("MEMBER", m.getId(), m.getFirstName() + " " + m.getLastName(), m.getEmail())));

        publicationRepository.search(null, null, null, query, page).forEach(p ->
                results.add(new GlobalSearchResult("PUBLICATION", p.getId(), p.getTitle(), "Year " + p.getYear())));

        eventRepository.search(null, query, page).forEach(e ->
                results.add(new GlobalSearchResult("EVENT", e.getId(), e.getTitle(), e.getType().name())));

        if (internalModules) {
            documentRepository.search(null, query, page).forEach(d ->
                    results.add(new GlobalSearchResult("DOCUMENT", d.getId(), d.getTitle(), d.getCategory().name())));

            equipmentRepository.search(query, page).forEach(eq ->
                    results.add(new GlobalSearchResult("EQUIPMENT", eq.getId(), eq.getName(), eq.getCategory())));
        }

        return results;
    }
}
