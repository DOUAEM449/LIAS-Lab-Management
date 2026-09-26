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
import java.util.regex.Pattern;

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

    /** A dot followed by letters and digits only: nothing that can carry a path or a second dot. */
    private static final Pattern SAFE_EXTENSION = Pattern.compile("\\.[A-Za-z0-9]{1,10}");

    private final FileStorageProperties properties;

    /**
     * Stores an upload, keeping the extension of the client's file name when it is a plain
     * one (".pdf", ".docx"...) and dropping it otherwise.
     */
    public StoredFile store(MultipartFile file, String category) {
        String originalFileName = StringUtils.trimToEmpty(file != null ? file.getOriginalFilename() : null);
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex >= 0 && SAFE_EXTENSION.matcher(originalFileName.substring(dotIndex)).matches()) {
            extension = originalFileName.substring(dotIndex);
        }
        return store(file, category, extension);
    }

    /**
     * Stores an upload under an extension chosen by the caller from what the file really
     * is, never from the name the client sent. Required wherever the file is served back
     * without authentication: the extension decides the type the browser is told, and a
     * client-chosen ".html" would be run as a page of the application's own origin.
     */
    public StoredFile store(MultipartFile file, String category, String extension) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file must not be empty");
        }
        if (!extension.isEmpty() && !SAFE_EXTENSION.matcher(extension).matches()) {
            throw new IllegalArgumentException("Unsafe file extension: " + extension);
        }
        String originalFileName = StringUtils.trimToEmpty(file.getOriginalFilename());

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

    /**
     * Stores bytes produced by the application itself (rather than uploaded by a
     * user) using the same date-partitioned layout — e.g. the generated annual
     * report PDF. {@code fileName} is used as-is, so callers control the name.
     */
    public StoredFile storeBytes(byte[] content, String category, String fileName, String contentType) {
        if (content == null || content.length == 0) {
            throw new FileStorageException("Generated file content must not be empty");
        }

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String relativePath = Paths.get(category, datePath, fileName).toString().replace("\\", "/");
        Path targetPath = Paths.get(properties.getBaseDir()).resolve(relativePath).normalize();

        try {
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, content);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store generated file: " + fileName, e);
        }

        return new StoredFile(fileName, fileName, contentType, content.length, relativePath);
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
