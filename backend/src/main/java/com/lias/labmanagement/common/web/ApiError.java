package com.lias.labmanagement.common.web;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Uniform error envelope returned by the global exception handler.
 */
public record ApiError(
        boolean success,
        int status,
        String error,
        String message,
        String path,
        Instant timestamp,
        List<FieldViolation> fieldErrors
) {
    public record FieldViolation(String field, String message) {}

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(false, status, error, message, path, Instant.now(), null);
    }

    public static ApiError of(int status, String error, String message, String path, List<FieldViolation> fieldErrors) {
        return new ApiError(false, status, error, message, path, Instant.now(), fieldErrors);
    }

    public static ApiError of(int status, String error, String message, String path, Map<String, String> fieldErrors) {
        List<FieldViolation> violations = fieldErrors.entrySet().stream()
                .map(e -> new FieldViolation(e.getKey(), e.getValue()))
                .toList();
        return new ApiError(false, status, error, message, path, Instant.now(), violations);
    }
}
