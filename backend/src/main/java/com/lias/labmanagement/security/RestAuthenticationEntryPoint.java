package com.lias.labmanagement.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lias.labmanagement.common.web.ApiError;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns a consistent JSON 401 payload (instead of the default Spring
 * Security HTML login redirect) whenever an unauthenticated request hits
 * a protected endpoint.
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    /** The Spring-managed mapper (JavaTimeModule registered) — a raw {@code new ObjectMapper()}
        would fail to serialize {@link ApiError}'s {@code Instant} timestamp. */
    private final ObjectMapper objectMapper;

    @Override
    public void commence(jakarta.servlet.http.HttpServletRequest request,
                          HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError error = ApiError.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                "Authentication is required to access this resource", request.getRequestURI());
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
