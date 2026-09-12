package com.lias.labmanagement.common.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression lock for the audit fix: a missing required query parameter, or a
 * query/path value that cannot be bound to its target type, must produce 400 —
 * not the catch-all 500 that {@code GlobalExceptionHandler.handleGeneric} used
 * to return before dedicated handlers were added.
 *
 * <p>Same {@code properties=} block as {@code AuthorizationMatrixTest} so both
 * share a single cached Spring context.
 */
@SpringBootTest(properties = "spring.config.import=")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BadRequestParamTest {

    @Autowired private MockMvc mvc;

    @Test
    void calendarWithoutRequiredFromToParamsIs400NotServerError() throws Exception {
        mvc.perform(get("/api/v1/calendar").with(user("u").roles("ASSOCIATE_MEMBER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void discussionsWithAnUnknownScopeEnumIs400NotServerError() throws Exception {
        mvc.perform(get("/api/v1/discussions").param("scope", "NOT_A_SCOPE")
                        .with(user("u").roles("ASSOCIATE_MEMBER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aMalformedUuidPathVariableIs400NotServerError() throws Exception {
        mvc.perform(get("/api/v1/members/not-a-uuid").with(user("u").roles("ASSOCIATE_MEMBER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aNonNumericYearPathVariableIs400NotServerError() throws Exception {
        mvc.perform(get("/api/v1/reports/not-a-year/pdf").with(user("u").roles("DIRECTOR")))
                .andExpect(status().isBadRequest());
    }
}
