package com.lias.labmanagement.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

/**
 * {@code /files/public/**} is served without authentication and, through the Vite proxy, on
 * the same origin as the application. Whatever ends up there must never run as a page of that
 * origin: a sandboxed response has no scripts and no access to the application's storage,
 * where the access token lives.
 */
@SpringBootTest(properties = "spring.config.import=")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicFilesHeaderTest {

    @Autowired private MockMvc mvc;

    @Test
    void publicFilesAreServedInASandboxThatCannotRunScripts() throws Exception {
        mvc.perform(get("/files/public/avatars/2026/09/26/anything.html"))
                .andExpect(header().string("Content-Security-Policy", "sandbox"));
    }
}
