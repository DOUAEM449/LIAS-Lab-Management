package com.lias.labmanagement.document.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.enums.DocumentCategory;
import com.lias.labmanagement.common.enums.NotificationType;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileDownload;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.document.dto.DocumentMetadataRequest;
import com.lias.labmanagement.document.dto.DocumentResponse;
import com.lias.labmanagement.document.dto.DocumentVersionResponse;
import com.lias.labmanagement.document.entity.DocumentEntity;
import com.lias.labmanagement.document.entity.DocumentVersion;
import com.lias.labmanagement.document.repository.DocumentRepository;
import com.lias.labmanagement.document.repository.DocumentVersionRepository;
import com.lias.labmanagement.event.repository.EventOrganizerRepository;
import com.lias.labmanagement.notification.service.NotificationService;
import com.lias.labmanagement.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final EventOrganizerRepository eventOrganizerRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<DocumentResponse> search(DocumentCategory category, String query, Pageable pageable) {
        Page<DocumentEntity> page = documentRepository.search(category, query, pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public DocumentResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public DocumentResponse upload(DocumentMetadataRequest metadata, MultipartFile file) {
        StoredFile stored = fileStorageService.store(file, "documents");
        DocumentEntity document = DocumentEntity.builder()
                .title(metadata.title())
                .category(metadata.category())
                .tags(metadata.tags())
                .filePath(stored.relativePath())
                .originalFileName(stored.originalFileName())
                .contentType(stored.contentType())
                .sizeBytes(stored.sizeInBytes())
                .relatedEventId(metadata.relatedEventId())
                .build();
        DocumentEntity saved = documentRepository.save(document);

        versionRepository.save(DocumentVersion.builder()
                .document(saved)
                .versionNumber(1)
                .filePath(stored.relativePath())
                .originalFileName(stored.originalFileName())
                .uploadedBy(currentUserId())
                .uploadedAt(Instant.now())
                .build());

        // CdC §2.20 lists "Ajouts de documents" as a notification trigger. A document
        // attached to an event goes to that event's organizers; every archived document
        // is additionally signalled to the governance, which owns the documentary archive
        // (CdC §2.10). Kept deliberately narrow so the inbox stays meaningful.
        if (saved.getRelatedEventId() != null) {
            eventOrganizerRepository.findByEventId(saved.getRelatedEventId()).forEach(organizer ->
                    notificationService.notify(organizer.getMember().getId(), NotificationType.DOCUMENT_ADDED,
                            "Un nouveau document a été ajouté à votre événement : " + saved.getTitle(),
                            "Document", saved.getId()));
        }
        notificationService.notifyGovernance(NotificationType.DOCUMENT_ADDED,
                "Nouveau document archivé : " + saved.getTitle() + " (" + saved.getCategory() + ").",
                "Document", saved.getId());

        auditService.record(AuditAction.CREATE, "Document", saved.getId(), "Document uploaded: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public DocumentResponse uploadNewVersion(UUID id, MultipartFile file) {
        DocumentEntity document = findOrThrow(id);
        StoredFile stored = fileStorageService.store(file, "documents");

        int nextVersion = (int) versionRepository.countByDocumentId(id) + 1;
        versionRepository.save(DocumentVersion.builder()
                .document(document)
                .versionNumber(nextVersion)
                .filePath(stored.relativePath())
                .originalFileName(stored.originalFileName())
                .uploadedBy(currentUserId())
                .uploadedAt(Instant.now())
                .build());

        document.setFilePath(stored.relativePath());
        document.setOriginalFileName(stored.originalFileName());
        document.setContentType(stored.contentType());
        document.setSizeBytes(stored.sizeInBytes());
        DocumentEntity saved = documentRepository.save(document);

        auditService.record(AuditAction.UPDATE, "Document", id, "New version uploaded (v" + nextVersion + ")");
        return toResponse(saved);
    }

    @Transactional
    public DocumentResponse updateMetadata(UUID id, DocumentMetadataRequest metadata) {
        DocumentEntity document = findOrThrow(id);
        document.setTitle(metadata.title());
        document.setCategory(metadata.category());
        document.setTags(metadata.tags());
        document.setRelatedEventId(metadata.relatedEventId());
        DocumentEntity saved = documentRepository.save(document);
        auditService.record(AuditAction.UPDATE, "Document", id, "Metadata updated");
        return toResponse(saved);
    }

    /**
     * Streams the current file of a document (CdC §2.10 — "Téléchargement").
     * Every download is audited, so the archive keeps a trace of who read what.
     */
    @Transactional
    public FileDownload download(UUID id) {
        DocumentEntity document = findOrThrow(id);
        Resource resource = resolveExisting(document.getFilePath(), document.getTitle());
        auditService.record(AuditAction.FILE_DOWNLOAD, "Document", id,
                "Document downloaded: " + document.getTitle());
        return new FileDownload(
                document.getOriginalFileName() != null ? document.getOriginalFileName() : document.getTitle(),
                document.getContentType(), resource);
    }

    /** Streams one specific historical version of a document (CdC §2.10 — "Historisation"). */
    @Transactional
    public FileDownload downloadVersion(UUID versionId) {
        DocumentVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> ResourceNotFoundException.of("DocumentVersion", versionId));
        Resource resource = resolveExisting(version.getFilePath(), version.getOriginalFileName());
        auditService.record(AuditAction.FILE_DOWNLOAD, "DocumentVersion", versionId,
                "Document version v" + version.getVersionNumber() + " downloaded");
        return new FileDownload(version.getOriginalFileName(), null, resource);
    }

    private Resource resolveExisting(String relativePath, String label) {
        if (relativePath == null) {
            throw new ResourceNotFoundException("No file stored for " + label);
        }
        Path path = fileStorageService.resolve(relativePath);
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Stored file is missing for " + label);
        }
        return new FileSystemResource(path);
    }

    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getVersions(UUID documentId) {
        return versionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId).stream()
                .map(v -> new DocumentVersionResponse(v.getId(), v.getVersionNumber(), v.getOriginalFileName(),
                        v.getUploadedBy(), v.getUploadedAt()))
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        DocumentEntity document = findOrThrow(id);
        document.markDeleted();
        documentRepository.save(document);
        auditService.record(AuditAction.DELETE, "Document", id, "Document soft-deleted");
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details.getId();
        }
        return null;
    }

    private DocumentEntity findOrThrow(UUID id) {
        return documentRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Document", id));
    }

    private DocumentResponse toResponse(DocumentEntity d) {
        int currentVersion = (int) versionRepository.countByDocumentId(d.getId());
        return new DocumentResponse(d.getId(), d.getTitle(), d.getCategory(), d.getTags(), d.getOriginalFileName(),
                d.getContentType(), d.getSizeBytes(), d.getRelatedEventId(), currentVersion, d.getCreatedAt(), d.getUpdatedAt());
    }
}
