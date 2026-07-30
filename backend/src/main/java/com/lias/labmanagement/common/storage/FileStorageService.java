package com.lias.labmanagement.common.storage;

import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.exception.FileStorageException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Stores uploaded files on local disk under a date-partitioned folder
 * structure (e.g. {@code documents/2026/07/05/<uuid>.pdf}) and returns
 * the metadata that callers persist alongside their own entity
 * (Document, Publication, MeetingMinutes, Agreement...).
 * <p>
 * Kept behind a single abstraction so the storage backend (local disk,
 * S3, etc.) can be swapped later without touching calling modules.
 */
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileStorageProperties properties;

    public StoredFile store(MultipartFile file, String category) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file must not be empty");
        }

        String originalFileName = StringUtils.trimToEmpty(file.getOriginalFilename());
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFileName.substring(dotIndex);
        }

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String storedFileName = UUID.randomUUID() + extension;
        String relativePath = Paths.get(category, datePath, storedFileName).toString().replace("\\", "/");

        Path targetPath = Paths.get(properties.getBaseDir()).resolve(relativePath).normalize();

        try {
            Files.createDirectories(targetPath.getParent());
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + originalFileName, e);
        }

        return new StoredFile(storedFileName, originalFileName, file.getContentType(), file.getSize(), relativePath);
    }

    public Path resolve(String relativePath) {
        return Paths.get(properties.getBaseDir()).resolve(relativePath).normalize();
    }

    public void delete(String relativePath) {
        try {
            Files.deleteIfExists(resolve(relativePath));
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete file: " + relativePath, e);
        }
    }
}
