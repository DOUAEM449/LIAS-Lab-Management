package com.lias.labmanagement.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The API answers credentialed cross-origin requests, so its allowed origins must be an
 * explicit list from configuration — never "*", which would let any site read authenticated
 * responses.
 */
class CorsConfigTest {

    private CorsConfiguration configFor(String property) {
        // The four collaborators are unused by the CORS bean; nulls are fine here.
        SecurityConfig config = new SecurityConfig(null, null, null, null);
        ReflectionTestUtils.setField(config, "allowedOrigins", property);
        CorsConfigurationSource source = config.corsConfigurationSource();
        return source.getCorsConfiguration(new org.springframework.mock.web.MockHttpServletRequest());
    }

    @Test
    void allowedOriginsComeFromConfigurationAndNeverUseWildcard() {
        CorsConfiguration cfg = configFor("https://lias.example, http://localhost:5173");

        assertThat(cfg.getAllowedOrigins()).containsExactly("https://lias.example", "http://localhost:5173");
        assertThat(cfg.getAllowedOrigins()).doesNotContain("*");
        assertThat(cfg.getAllowCredentials()).isTrue();
    }
}
