package com.lias.labmanagement.common.storage;

/**
 * Metadata returned after a file has been persisted to disk, to be stored
 * alongside the owning entity (Document, Publication, MeetingMinutes...).
 */
public record StoredFile(
        String storedFileName,
        String originalFileName,
        String contentType,
        long sizeInBytes,
        String relativePath
) {
}
