package com.lias.labmanagement.document.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import com.lias.labmanagement.common.enums.DocumentCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * Centralized document repository entry (funding requests, programs,
 * certificates, reports, agreements, meeting minutes...). Each edit of the
 * file creates a new {@link DocumentVersion} row rather than overwriting
 * the previous file, preserving full history.
 */
@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_documents_category", columnList = "category"),
        @Index(name = "idx_documents_related_event", columnList = "related_event_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class DocumentEntity extends BaseEntity {

    @Column(nullable = false, length = 300)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DocumentCategory category;

    @Column(length = 500)
    private String tags;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "size_bytes")
    private long sizeBytes;

    @Column(name = "related_event_id", columnDefinition = "uuid")
    private UUID relatedEventId;
}
