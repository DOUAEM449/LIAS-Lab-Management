package com.lias.labmanagement.publication.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.common.util.SoftDeleteSafe;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.governance.entity.Team;
import com.lias.labmanagement.governance.repository.TeamRepository;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.publication.dto.PublicationRequest;
import com.lias.labmanagement.publication.dto.PublicationResponse;
import com.lias.labmanagement.publication.entity.Publication;
import com.lias.labmanagement.publication.entity.PublicationAuthor;
import com.lias.labmanagement.publication.repository.PublicationAuthorRepository;
import com.lias.labmanagement.publication.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final PublicationAuthorRepository authorRepository;
    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<PublicationResponse> search(Integer year, UUID teamId, UUID authorId, String query, Pageable pageable) {
        Page<Publication> page = publicationRepository.search(year, teamId, authorId, query, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public PublicationResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public PublicationResponse create(PublicationRequest request) {
        Publication publication = Publication.builder()
                .title(request.title())
                .abstractText(request.abstractText())
                .keywords(request.keywords())
                .year(request.year())
                .doi(request.doi())
                .team(resolveTeam(request.teamId()))
                .build();
        Publication saved = publicationRepository.save(publication);
        replaceAuthors(saved, request.authorMemberIds());
        auditService.record(AuditAction.CREATE, "Publication", saved.getId(), "Publication created: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public PublicationResponse update(UUID id, PublicationRequest request) {
        Publication publication = findOrThrow(id);
        publication.setTitle(request.title());
        publication.setAbstractText(request.abstractText());
        publication.setKeywords(request.keywords());
        publication.setYear(request.year());
        publication.setDoi(request.doi());
        publication.setTeam(resolveTeam(request.teamId()));
        Publication saved = publicationRepository.save(publication);
        replaceAuthors(saved, request.authorMemberIds());
        auditService.record(AuditAction.UPDATE, "Publication", id, "Publication updated");
        return toResponse(saved);
    }

    @Transactional
    public PublicationResponse uploadPdf(UUID id, MultipartFile file) {
        Publication publication = findOrThrow(id);
        StoredFile stored = fileStorageService.store(file, "publications");
        publication.setPdfPath(stored.relativePath());
        publication.setPdfOriginalName(stored.originalFileName());
        Publication saved = publicationRepository.save(publication);
        auditService.record(AuditAction.UPDATE, "Publication", id, "PDF uploaded: " + stored.originalFileName());
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Publication publication = findOrThrow(id);
        publication.markDeleted();
        publicationRepository.save(publication);
        auditService.record(AuditAction.DELETE, "Publication", id, "Publication soft-deleted");
    }

    private void replaceAuthors(Publication publication, List<UUID> memberIds) {
        authorRepository.deleteByPublicationId(publication.getId());
        int order = 0;
        for (UUID memberId : memberIds) {
            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> ResourceNotFoundException.of("Member", memberId));
            authorRepository.save(PublicationAuthor.builder()
                    .publication(publication)
                    .member(member)
                    .authorOrder(order++)
                    .build());
        }
    }

    private Team resolveTeam(UUID teamId) {
        if (teamId == null) {
            return null;
        }
        return teamRepository.findById(teamId)
                .orElseThrow(() -> ResourceNotFoundException.of("Team", teamId));
    }

    private Publication findOrThrow(UUID id) {
        return publicationRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Publication", id));
    }

    private PublicationResponse toResponse(Publication p) {
        List<PublicationResponse.AuthorSummary> authors = authorRepository.findByPublicationId(p.getId()).stream()
                .sorted(Comparator.comparingInt(PublicationAuthor::getAuthorOrder))
                .map(this::toAuthorSummary)
                .toList();
        Team team = p.getTeam();
        return new PublicationResponse(p.getId(), p.getTitle(), p.getAbstractText(), p.getKeywords(), p.getYear(),
                p.getDoi(), p.getPdfOriginalName(), team != null ? team.getId() : null,
                team != null ? SoftDeleteSafe.resolve(team, Team::getName, "Équipe archivée") : null,
                authors, p.getCreatedAt());
    }

    private PublicationResponse.AuthorSummary toAuthorSummary(PublicationAuthor a) {
        Member member = a.getMember();
        return new PublicationResponse.AuthorSummary(member.getId(),
                SoftDeleteSafe.resolve(member, m -> m.getFirstName() + " " + m.getLastName(), "Membre archivé"));
    }
}
