package com.lias.labmanagement.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lias.labmanagement.common.web.ApiError;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    /** Spring-managed mapper (JavaTimeModule registered) — see RestAuthenticationEntryPoint. */
    private final ObjectMapper objectMapper;

    @Override
    public void handle(jakarta.servlet.http.HttpServletRequest request,
                        HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError error = ApiError.of(HttpStatus.FORBIDDEN.value(), "Forbidden",
                "You do not have permission to perform this action", request.getRequestURI());
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
