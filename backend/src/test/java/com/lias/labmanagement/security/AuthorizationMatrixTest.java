package com.lias.labmanagement.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end authorization matrix through the real Spring Security chain
 * (CdC §5 / §2.2.C). For every sensitive endpoint we assert three things:
 * <ul>
 *   <li>anonymous → 401</li>
 *   <li>an insufficient role → 403</li>
 *   <li>an allowed role → anything but 401/403 (200/400/404 are all "authorized")</li>
 * </ul>
 * The RETIRED/FORMER freeze is enforced one layer lower (JwtAuthenticationFilter +
 * CustomUserDetails.isEnabled) and is covered by {@link CustomUserDetailsTest}.
 */
@SpringBootTest(properties = "spring.config.import=")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthorizationMatrixTest {

    @Autowired private MockMvc mvc;

    private static final String UUID0 = "00000000-0000-0000-0000-000000000000";

    private static final String[] INTERNAL = {
            "SYSTEM_ADMIN", "DIRECTOR", "VICE_DIRECTOR", "TEAM_LEADER", "PERMANENT_MEMBER", "ASSOCIATE_MEMBER"
    };
    private static final String[] GOVERNANCE = {"SYSTEM_ADMIN", "DIRECTOR", "VICE_DIRECTOR"};
    private static final String[] ALL_ROLES = {
            "SYSTEM_ADMIN", "DIRECTOR", "VICE_DIRECTOR", "TEAM_LEADER",
            "PERMANENT_MEMBER", "ASSOCIATE_MEMBER", "PHD_STUDENT", "RETIRED_MEMBER"
    };

    private void assertAuthorized(ResultActions ra) throws Exception {
        int s = ra.andReturn().getResponse().getStatus();
        org.assertj.core.api.Assertions.assertThat(s)
                .as("authorized role should not be rejected with 401/403 (got %d)", s)
                .isNotIn(401, 403);
    }

    private String[] complement(String[] allowed) {
        return java.util.Arrays.stream(ALL_ROLES)
                .filter(r -> java.util.Arrays.stream(allowed).noneMatch(r::equals))
                .toArray(String[]::new);
    }

    // ---- public endpoints -------------------------------------------------

    @Test @DisplayName("public endpoints are reachable anonymously")
    void publicEndpointsAnonymous() throws Exception {
        mvc.perform(get("/api/v1/publications")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/events")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/teams")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/partners")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/laboratory")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/members")).andExpect(status().isOk());
    }

    // ---- authenticated-only --------------------------------------------

    @Test @DisplayName("an authenticated-only endpoint: 401 anonymous, ok for any role")
    void membersListRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/v1/members")).andExpect(status().isUnauthorized());
        for (String role : ALL_ROLES) {
            assertAuthorized(mvc.perform(get("/api/v1/members").with(user("u").roles(role))));
        }
    }

    // ---- SYSTEM_ADMIN only --------------------------------------------

    @Test @DisplayName("admin/users: SYSTEM_ADMIN only")
    void adminUsersIsSystemAdminOnly() throws Exception {
        mvc.perform(get("/api/v1/admin/users")).andExpect(status().isUnauthorized());
        for (String role : complement(new String[]{"SYSTEM_ADMIN"})) {
            mvc.perform(get("/api/v1/admin/users").with(user("u").roles(role)))
                    .andExpect(status().isForbidden());
        }
        assertAuthorized(mvc.perform(get("/api/v1/admin/users").with(user("admin").roles("SYSTEM_ADMIN"))));
    }

    // ---- governance (SA / DIR / VD) ----------------------------------

    @Test @DisplayName("admin/audit-logs: SYSTEM_ADMIN + governance only")
    void auditLogIsGovernanceOnly() throws Exception {
        mvc.perform(get("/api/v1/admin/audit-logs")).andExpect(status().isUnauthorized());
        for (String role : complement(GOVERNANCE)) {
            mvc.perform(get("/api/v1/admin/audit-logs").with(user("u").roles(role)))
                    .andExpect(status().isForbidden());
        }
        for (String role : GOVERNANCE) {
            assertAuthorized(mvc.perform(get("/api/v1/admin/audit-logs").with(user("u").roles(role))));
        }
    }

    @Test @DisplayName("reports: SYSTEM_ADMIN + governance only")
    void reportsAreGovernanceOnly() throws Exception {
        mvc.perform(get("/api/v1/reports")).andExpect(status().isUnauthorized());
        for (String role : complement(GOVERNANCE)) {
            mvc.perform(get("/api/v1/reports").with(user("u").roles(role)))
                    .andExpect(status().isForbidden());
        }
        for (String role : GOVERNANCE) {
            assertAuthorized(mvc.perform(get("/api/v1/reports").with(user("u").roles(role))));
        }
    }

    @Test @DisplayName("DELETE team: SYSTEM_ADMIN + DIRECTOR only (VICE_DIRECTOR forbidden)")
    void deleteTeamIsAdminOrDirectorOnly() throws Exception {
        mvc.perform(delete("/api/v1/teams/" + UUID0)).andExpect(status().isUnauthorized());
        for (String role : complement(new String[]{"SYSTEM_ADMIN", "DIRECTOR"})) {
            mvc.perform(delete("/api/v1/teams/" + UUID0).with(user("u").roles(role)))
                    .andExpect(status().isForbidden());
        }
        assertAuthorized(mvc.perform(delete("/api/v1/teams/" + UUID0).with(user("u").roles("DIRECTOR"))));
        assertAuthorized(mvc.perform(delete("/api/v1/teams/" + UUID0).with(user("u").roles("SYSTEM_ADMIN"))));
    }

    @Test @DisplayName("DELETE mandate/publication/event/meeting: governance-tier delete")
    void governanceTierDeletes() throws Exception {
        for (String path : new String[]{
                "/api/v1/publications/" + UUID0,
                "/api/v1/events/" + UUID0,
                "/api/v1/meetings/" + UUID0}) {
            mvc.perform(delete(path)).andExpect(status().isUnauthorized());
            for (String role : complement(GOVERNANCE)) {
                mvc.perform(delete(path).with(user("u").roles(role))).andExpect(status().isForbidden());
            }
            for (String role : GOVERNANCE) {
                assertAuthorized(mvc.perform(delete(path).with(user("u").roles(role))));
            }
        }
    }

    // ---- internal modules: everyone except PHD_STUDENT ---------------

    @Test @DisplayName("documents / equipment / meetings list: closed to PHD_STUDENT")
    void internalModulesExcludePhdStudent() throws Exception {
        for (String path : new String[]{"/api/v1/documents", "/api/v1/equipment", "/api/v1/meetings"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).with(user("u").roles("PHD_STUDENT"))).andExpect(status().isForbidden());
            for (String role : INTERNAL) {
                assertAuthorized(mvc.perform(get(path).with(user("u").roles(role))));
            }
        }
    }

    // ---- publication creation: PHD_STUDENT explicitly allowed --------

    @Test @DisplayName("a PHD_STUDENT can reach publication creation (not 403)")
    void phdStudentMayCreatePublications() throws Exception {
        // empty body ⇒ 400 from bean validation, but crucially NOT 403
        int s = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v1/publications")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content("{}")
                        .with(user("u").roles("PHD_STUDENT")))
                .andReturn().getResponse().getStatus();
        org.assertj.core.api.Assertions.assertThat(s).isNotIn(401, 403);
    }
}
