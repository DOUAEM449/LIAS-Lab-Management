# Security notes — LIAS Laboratory Management

## Secrets & configuration

No credential is hard-coded in tracked source any more. All sensitive values are
read from environment variables:

| Variable | Used by | Notes |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | `application-dev.yml` datasource | required |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Spring Mail | `MAIL_PASSWORD` empty ⇒ no real sending |
| `JWT_SECRET` | `app.jwt.secret` | Base64, ≥ 64 bytes decoded (HS512) |
| `FILE_STORAGE_DIR` | `app.file-storage.base-dir` | absolute path recommended |

Local development loads these from **`backend/.env`** (git-ignored) via
`spring.config.import: optional:file:.env[.properties]` in `application.yml`.
Template: [`backend/.env.example`](backend/.env.example).

In CI / production, set them as real environment variables — `backend/.env` is
absent there and `optional:` makes that a no-op.

## ⚠️ Credentials previously committed to Git history

The Neon PostgreSQL host/user/password and a Gmail address were committed in
`backend/src/main/resources/application-dev.yml`.

- **Introduced in:** commit `85ae166` *("feat(config): integrate Neon Cloud PostgreSQL database with Flyway migration")*
- **Also present in:** every commit after it on `main` and on `feat/finalisation-audit` (the file kept the values until this change).
- **Published:** yes — those commits are on `origin/main`.

Removing the values from the current commit (done) **does not** remove them from
history. Two manual actions are required, in this order:

### 1. Rotate the exposed credentials (do this first — the old values are already public)

- **Neon:** dashboard → project → *Roles* → reset the password for `neondb_owner`
  (or create a new role and drop the old one). Update `DB_PASSWORD` in `backend/.env`.
- **Gmail:** if an App Password was ever used for `MAIL_PASSWORD`, revoke it at
  <https://myaccount.google.com/apppasswords> and issue a new one.

### 2. Purge the values from Git history (destructive — rewrites commit hashes)

Requires a force-push and every collaborator to re-clone or hard-reset. **Not run
automatically.**

Using [`git filter-repo`](https://github.com/newren/git-filter-repo) (recommended).
Fill the placeholders below with the **actual** old values (they are in the
history of `backend/src/main/resources/application-dev.yml` — `git log -p` that
file, or read them from your current `backend/.env`):

```bash
# from a fresh clone
pip install git-filter-repo

cat > /tmp/lias-secrets.txt <<'EOF'
regex:npg_[A-Za-z0-9]+==>DB_PASSWORD_REMOVED
regex:ep-[a-z0-9.-]+\.neon\.tech==>DB_HOST_REMOVED
literal:<OLD_DB_USERNAME>==>DB_USERNAME_REMOVED
EOF

git filter-repo --replace-text /tmp/lias-secrets.txt

git remote add origin https://github.com/DOUAEM449/LIAS-Lab-Management.git
git push --force --all
git push --force --tags
```

Or with [BFG](https://rtyley.github.io/bfg-repo-cleaner/):

```bash
printf '%s\n' "<OLD_DB_PASSWORD>" "<OLD_DB_HOST>" > /tmp/secrets.txt
java -jar bfg.jar --replace-text /tmp/secrets.txt .git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

After the rewrite: rotating again is not needed if step 1 was done, but tell every
collaborator to delete their local clone and clone fresh.

## Authorization model

- Stateless JWT (`Authorization: Bearer`), `@EnableMethodSecurity` + `@PreAuthorize`.
- The JWT `role` claim is **not trusted** for authorization: `JwtAuthenticationFilter`
  reloads `UserDetails` from the database on every request, so a role/status change
  takes effect on the next request without re-login.
- `RETIRED` / `FORMER` accounts are frozen (`CustomUserDetails.isEnabled() == false`)
  and rejected with 401 even with a still-valid token.
- `User.role` is **derived**, never hand-set (except `ADMIN_OVERRIDE`): see
  `UserRoleSyncService` (status vs mandate priority) and the startup
  `UserRoleReconciliationRunner`.
