package com.lias.labmanagement.common.storage;

import org.springframework.core.io.Resource;

/**
 * A stored file resolved for download through the authenticated API.
 * <p>
 * Files live under {@code /files/**}, which Spring Security only opens for the
 * {@code public/} subtree; everything else (documents, meeting minutes, reports)
 * therefore cannot be fetched by a plain browser link, because the browser
 * cannot attach the JWT bearer token. Controllers stream those files through a
 * normal authenticated endpoint instead, and this record is what they return.
 */
public record FileDownload(String fileName, String contentType, Resource resource) {
}
