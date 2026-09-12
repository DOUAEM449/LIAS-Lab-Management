# LIAS Laboratory Management — Final Readiness Report

_Generated 2026-09-11 · branch `feat/finalisation-audit`_

---

## 1. Before / After

| | Estimate | Basis |
|---|---|---|
| **Before this pass** | ~93 % | End-to-end functional audit (routes, buttons, role matrix) — builds green, 0 automated tests, secrets in tracked config |
| **After this pass** | **~95 %** | + secrets externalised, + 48 automated tests (all green), + 1 real bug fixed, file storage confirmed portable, UML re-verified |

### What changed

1. **Secrets externalised** (Phase 1)
   - `application-dev.yml`: real Neon host/db/user/password and the Gmail address removed → now pure `${DB_HOST}`, `${DB_USERNAME}`, `${DB_PASSWORD}`, `${MAIL_USERNAME}`, `${MAIL_PASSWORD}`.
   - `application.yml`: added `spring.config.import: optional:file:.env[.properties]` — local dev now loads `backend/.env` (git-ignored) automatically, **no run-config change needed**.
   - New `backend/.env` (git-ignored, real values, preserves the existing local setup) and `backend/.env.example` (template).
   - `.gitignore` hardened (`.env`, `.env.*`, `backend/.env`, `application-local.yml`, …; `!.env.example` kept).
   - `SECURITY.md` documents the credentials already in Git history and the exact **manual** purge procedure (not executed).

2. **Bug fixed — malformed JSON on filter-layer 401/403** (found while writing the security tests)
   - `RestAuthenticationEntryPoint` and `RestAccessDeniedHandler` built their JSON with a raw `new ObjectMapper()` (no `JavaTimeModule`) → serialising `ApiError.timestamp` (`Instant`) threw, so an anonymous request to a protected endpoint returned a **401 status with a broken/empty body** and logged a serialization exception on every hit.
   - Fix: inject the Spring-managed `ObjectMapper`. Verified live — anonymous `GET /api/v1/members` now returns a complete `{"success":false,"status":401,…,"timestamp":"…"}` body.

3. **48 automated tests added** (Phase 2) — see §4.

4. **File storage** (Phase 3): already fully env-driven via `app.file-storage.base-dir=${FILE_STORAGE_DIR:./uploads}`; `FileStorageService` / `WebConfig` contain **no hardcoded paths** (repo-wide scan = 0 hits). `backend/.env` now pins `FILE_STORAGE_DIR` so uploads no longer depend on the working directory.

5. **UML** (Phase 6): `02-architecture.mmd` Flyway note updated (`V2` → `V2 + V3 reconciliation source`). All 8 diagrams otherwise re-verified against the code — entity fields, enum values, component counts (22 controllers / 28 services / 30 repositories), relationships, the mandate-assignment sequence and the member-lifecycle states all match. No regeneration.

6. **Test data** (Phase 4): inventoried; nothing deleted — see §6.

---

## 2. Feature status

| Module | Backend | Frontend | Tests | Status |
|---|---|---|---|---|
| Auth (login / refresh / forgot-reset / me) | ✅ | ✅ | ⚪ indirect (security matrix) | Done |
| STATUT ≠ RÔLE ≠ MANDAT sync + reconciliation | ✅ | ✅ | ✅ `UserRoleSyncServiceTest` (17) | Done |
| Account freeze (RETIRED / FORMER) | ✅ | ✅ | ✅ `CustomUserDetailsTest` (5) | Done |
| Members + lifecycle (status / leave / return / archive) | ✅ | ✅ | ✅ status/freeze paths; ⚪ leave/return via state model | Done |
| Governance — mandates | ✅ | ✅ | ✅ derivation + priority + end/transfer effect | Done |
| Governance — teams | ✅ | ✅ (VD gated) | ✅ `AuthorizationMatrixTest` (DELETE team = SA/DIR) | Done |
| Membership requests | ✅ | ✅ | ✅ authz (approve = DIRECTOR only) | Done |
| Events + registration + participants | ✅ | ✅ | ✅ authz tier | Done |
| Meetings + minutes (PV) | ✅ | ✅ | ✅ authz tier | Done |
| Publications | ✅ | ✅ | ✅ authz (create incl. PHD_STUDENT) | Done |
| Calendar (events + meetings) | ✅ | ✅ | ✅ `BadRequestParamTest` (param handling) | Done |
| Documents + versions + download | ✅ | ✅ | ✅ authz (internal module, no PHD) | Done |
| Equipment inventory / distribution / return | ✅ | ✅ | ✅ `EquipmentServiceTest` (8) | Done |
| Equipment requests + validation | ✅ | ✅ | ✅ authz (approve = DIR/VD, not SA) | Done |
| Notifications + triggers | ✅ | ✅ | ✅ `NotificationServiceTest` (5) | Done |
| Discussions (global / team / event) | ✅ | ✅ | ⚪ | Done |
| Partnerships (partners + agreements) | ✅ | ✅ | ⚪ | Done |
| Annual report + PDF (OpenPDF) + scheduler | ✅ | ✅ | ⚪ (manual smoke) | Done |
| Audit trail | ✅ | ✅ | ✅ authz (governance only) | Done |
| Administration (users / roles / laboratory) | ✅ | ✅ | ✅ authz (SYSTEM_ADMIN only) | Done |
| Public portal (landing / apply) | ✅ | ✅ | ✅ public-endpoint reachability | Done |

Legend: ✅ implemented & verified · ⚪ no dedicated automated test (covered by manual E2E / smoke).

---

## 3. Security

| Aspect | State |
|---|---|
| **Authentication** | Stateless JWT (jjwt 0.12.6, HS512). `JwtAuthenticationFilter` reloads `UserDetails` from DB every request — role/status changes take effect without re-login. Verified live + `CustomUserDetailsTest`. |
| **Authorization** | `@EnableMethodSecurity` + `@PreAuthorize` per endpoint. Full matrix (anonymous→401, wrong-role→403, allowed→success, public→open) checked for the 9 roles, both live and in `AuthorizationMatrixTest`. Frontend route guards + in-page gating mirror the backend (incl. the VICE_DIRECTOR / governance-structure fix from the previous pass). |
| **Role / mandate synchronization** | `User.role` is derived (`UserRoleSyncService`), never hand-set except `ADMIN_OVERRIDE`. Startup `UserRoleReconciliationRunner` = idempotent (log: "all accounts already consistent"). **0 role drift** across all active members. `douaamoussaoui2@gmail.com` = ASSOCIATE / ASSOCIATE_MEMBER / no mandate — confirmed after restart. |
| **Secrets (code)** | ✅ No credential in tracked source. All via env vars (`DB_*`, `MAIL_*`, `JWT_SECRET`, `FILE_STORAGE_DIR`). |
| **Secrets (Git history)** | Old Neon credentials remain in history (commit `85ae166` onward, 8 commits, on `origin/main`) — but the password was **rotated on 2026-09-11** and verified revoked, so it is a **dead credential**. Purging history is optional hygiene before publishing/archiving the repo; procedure in `SECURITY.md`. |
| **Audit trail** | Every sensitive action recorded via `AuditService` (`REQUIRES_NEW`). LOGIN rows now name the actor (previous-pass fix). |
| **Error responses** | Filter-layer 401/403 bodies fixed (this pass). `@PreAuthorize` denials → clean 403 via `@RestControllerAdvice`. Malformed params → 400 (previous-pass fix, now regression-locked). |

---

## 4. Tests

| Suite | Tests | Focus |
|---|---:|---|
| `UserRoleSyncServiceTest` | 17 | status→role, mandate→role, DIRECTOR>VICE>TEAM_LEADER priority, RETIRED/FORMER precedence over leftover mandate, history row + source, no-write-when-consistent, `overrideRole` (ADMIN_OVERRIDE), `reconcileAll` corrects drift / is idempotent / backfills history, no-op for user-less member |
| `CustomUserDetailsTest` | 5 | active member enabled + `ROLE_*` authority, RETIRED frozen, FORMER frozen, technical account (no member) usable, admin-disabled not enabled |
| `EquipmentServiceTest` | 8 | distribution reduces `availableQuantity`, exact-stock allowed (→0), over-stock rejected + no mutation, return restores stock, double-return rejected, distribute+return is stock-neutral, quantity raise re-balances availability, quantity drop floors at 0 |
| `NotificationServiceTest` | 5 | trigger persists an unread notification, unknown recipient skipped silently, `notifyGovernance` reaches the current DIRECTOR + VICE_DIRECTOR (resolved from active mandates), no mandate holders → nobody, `notifyAll` dedups + ignores nulls |
| `AuthorizationMatrixTest` (`@SpringBootTest`, H2) | 9 | public endpoints anonymous → 200; authenticated-only → 401 anon / ok all roles; `admin/users` SYSTEM_ADMIN-only; `audit-logs` + `reports` governance-only; **DELETE team = SA/DIR only (VICE_DIRECTOR → 403)**; governance-tier deletes; internal modules closed to PHD_STUDENT; PHD_STUDENT may reach publication creation |
| `BadRequestParamTest` (`@SpringBootTest`, H2) | 4 | missing `from`/`to` on `/calendar` → 400; unknown `scope` enum → 400; malformed UUID path var → 400; non-numeric `{year}` → 400 |
| **Total** | **48** | |

```
mvn test  →  Tests run: 48, Failures: 0, Errors: 0, Skipped: 0   BUILD SUCCESS
```

Isolation: unit suites use Mockito (no context, no DB). The two `@SpringBootTest` suites run the real Spring Security chain on an in-memory H2 (`MODE=PostgreSQL`, `NON_KEYWORDS=YEAR,…`), Flyway off, schema from entities, `.env` import disabled — **never touch the Neon database**.

Coverage: not measured (no JaCoCo configured). The suites target the CdC-critical logic (role derivation, freeze, stock arithmetic, notification fan-out, the full authorization matrix) rather than line coverage.

---

## 5. Build

| Command | Result |
|---|---|
| `mvn clean compile` (backend, JDK 21) | ✅ BUILD SUCCESS |
| `mvn test` (backend) | ✅ **48 run / 0 fail / 0 error / 0 skip** |
| `npm run build` (frontend, Vite 8) | ✅ built — `dist/assets/index-CVRkviCh.js` 572 kB (gzip 160 kB) |
| `npx oxlint` (frontend) | ✅ 0 errors — 6 pre-existing `react(only-export-components)` warnings (Badge/Toast/DocumentFormModal), unchanged |
| Flyway V1→V3 | ✅ validated on startup · Hibernate `ddl-auto: validate` ✅ |
| Live smoke (`:8081`, Neon) | ✅ auth, role matrix, param-400, calendar, equipment, meetings, notifications, discussions, reports, public portal, reconciliation idempotent |

---

## 6. Remaining issues

### P0 — none

The previous P0 (exposed Neon credentials) is **closed**: the password was rotated
by the owner on 2026-09-11 and verified from this repository — the new credential
connects, the old one is rejected. No blocking item remains.

### P1 — important
- **Purge the dead credential from Git history** (optional but recommended before the repo is made public or archived). Destructive rewrite + force-push; procedure in `SECURITY.md`. Not urgent: the value no longer opens anything.
- **`test.notif.audit@example.com`** is an *active* test member (ASSOCIATE). Kept, per the "don't delete real/demo data" rule — but you may want to archive it before the defence so it doesn't show in member lists. One click (archive) in the Members page, or `UPDATE members SET deleted=true WHERE email='test.notif.audit@example.com';`.
- **6 soft-deleted `*@test.invalid` accounts** from the earlier audit remain in `users` (`deleted=true`). They are invisible to every query/screen and cannot log in. A hard purge also needs 6 `audit_logs` rows removed (FK), so it is left to you — SQL in §"Commands for you to run".

### P2 — improvement
- Frontend ships one 572 kB JS bundle (no code-splitting) — fine for a university project, a `manualChunks` split would be the polish.
- `GET /notifications` / `/members/me` return **404** for a technical account with no linked `Member` (SYSTEM_ADMIN). The frontend already guards this (empty state, no error shown); returning an empty page instead of 404 would be cleaner.
- Dark mode not implemented (CdC: secondary).
- No silent JWT refresh on the frontend (a 401 bounces to login); acceptable with a 1 h token.

### P3 — cosmetic
- Startup WARN `InitializeUserDetailsManagerConfigurer` — benign Spring Boot 3 message (an `AuthenticationProvider` bean is defined explicitly).
- Wrong-role **+ malformed body** on a `POST` → 400 (bean validation) instead of 403 (method security runs after argument binding). No mutation, no data exposure.

---

## 7. Final verdict

| | Verdict | Why |
|---|---|---|
| **READY FOR REPORT** | ✅ YES | All CdC modules implemented and verified; UML faithful to the code; 48 tests green; realistic completion ~95 % with the remaining items documented and classified. |
| **READY FOR PRESENTATION (PPT)** | ✅ YES | The STATUT ≠ RÔLE ≠ MANDAT story, the governance/authorization matrix, the reconciliation mechanism and the architecture are all demonstrable and backed by tests and diagrams. |
| **READY FOR DEMO** | ✅ YES | Full click-through works for every role with no broken buttons, wrong permissions or dead links (previous E2E pass); builds green; live smoke green; the app runs on the rotated database credential. No caveat. |

---

## Commands for you to run (need your credentials / a force-push)

**1. Rotate the exposed DB password** — ✅ **DONE (2026-09-11).** Verified: the new
credential in `backend/.env` connects, the old one is rejected. Nothing left to do.

**2. Purge the secret from Git history** — see `SECURITY.md` for the full
`git filter-repo` / BFG recipe (fill the placeholders with the old values from the
history of `application-dev.yml`). Then `git push --force --all` and every
collaborator must re-clone.

**3. (Optional) Hard-purge the technical test accounts** from the shared DB:
```sql
BEGIN;
DELETE FROM audit_logs   WHERE actor_id IN (SELECT id FROM users WHERE email LIKE '%@test.invalid');
DELETE FROM users        WHERE email LIKE '%@test.invalid';         -- 6 soft-deleted rows
DELETE FROM members      WHERE deleted = true AND email IN
  ('doaamoussaoui15@gmail.com','youssef.elalem2@example.com','youssef.elalem3@example.com');
COMMIT;
```

**4. (Optional) Hide the active test member from the demo:**
```sql
UPDATE members SET deleted = true, deleted_at = now() WHERE email = 'test.notif.audit@example.com';
```
