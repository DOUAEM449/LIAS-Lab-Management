# LIAS — Laboratory Management Platform

Web platform of the **Laboratoire d'Intelligence Artificielle et Systèmes** (LIAS), Faculté des
Sciences Ben M'Sik, Université Hassan II de Casablanca. One application, two faces:

- a **public website** — the laboratory, its teams, publications and events, and an online
  membership application;
- an **internal information system** — members and their status history, governance and
  mandates, membership decisions, documents with versioning, equipment and requests, meetings
  and minutes, partnerships, internal discussions and notifications, calendar, global search,
  a yearly activity report in PDF, an audit log and account administration.

Built as the final project of the Java Enterprise Edition module, Master Data Science &
Big Data, 2025–2026 — by Douae Moussaoui, supervised by Pr. Abdessamad Belangour.

---

## The rule that shaped the design

A member's **status** (permanent, associate, PhD student, retired, former), their governance
**mandate** (director, vice-director, team leader) and their application **role** (9 values,
which drive permissions) are three distinct things. The role is never set by hand:
`UserRoleSyncService` derives it from the status and the active mandates, records every
change in a history table, and reconciles every account at start-up. A retired director keeps
no director rights, even if a mandate was left open.

---

## Architecture

```
React 19 single-page app  ──  Axios, JWT sent as "Authorization: Bearer"
        │
        ▼  /api/v1/**  (JSON)
Spring Boot 3.3.4 — one process, modular by business domain
  ├─ Spring Security: JWT filter, rights reloaded from the database on every request
  ├─ 22 REST controllers: method-level @PreAuthorize
  ├─ services: business rules, @Transactional
  └─ Spring Data JPA / Hibernate 6.5: 30 entities
        │
        ▼
PostgreSQL — schema created and versioned by Flyway (V1 → V3)
```

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3.4 (Web, Data JPA, Security, Validation, Mail, Actuator) |
| Security | jjwt 0.12.6 (HS512), BCrypt (cost 12) |
| Data | PostgreSQL (hosted on Neon in development), Flyway, Hibernate 6.5 |
| API docs | springdoc-openapi 2.6 (Swagger UI) |
| Other | OpenPDF (annual report), Lombok |
| Frontend | React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4, lucide-react |
| Tests | JUnit 5, Mockito, Spring Security Test, H2 |

```
backend/     Spring Boot application — one package per business domain
             (members/, governance/, event/, document/…), each with its own
             entity/, dto/, repository/, service/ and controller/
frontend/    React application — pages/, components/, services/ (one per domain)
docs/        specification, project report (PDF + LaTeX sources), defence slides
AUDIT.md     technical audit: findings by priority, what was fixed, what remains
SECURITY.md  secrets handling and credential history
```

---

## Getting started

### Prerequisites

- **JDK 21**
- **Maven 3.9+** — no wrapper in this repository; a Maven 3.9.16 distribution is bundled in
  `backend/.maven/` if you do not have one
- **Node.js 22** or newer
- **PostgreSQL** — hosted (the project uses Neon), local, or through Docker (see below)

### Configuration

Every setting that is a secret or depends on the machine is read from environment variables.
For local development, put them in `backend/.env`, which Git ignores and Spring loads at
start-up:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Purpose |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | yes | database connection |
| `JWT_SECRET` | **yes** | token signing key, Base64 on a single line, at least 64 bytes once decoded. Generate it with `openssl rand -base64 72 \| tr -d '\r\n'` — without the `tr`, openssl splits its output over two lines. **The server refuses to start without it** |
| `FILE_STORAGE_DIR` | recommended | where uploaded files are stored (default `./uploads`) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | no | outgoing e-mail; left empty, nothing is sent |
| `BOOTSTRAP_ADMIN_PASSWORD` | no | creates the first administrator (see below) |

Never write credentials into `application*.yml`: those files are tracked by Git.

The default `dev` profile connects with `sslmode=require`, as Neon expects. For a local
PostgreSQL without TLS, set the environment variable
`SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/lias_lab_db` before starting the
backend: environment variables take precedence over the configuration files.

### Run the backend

```bash
cd backend
mvn spring-boot:run
```

On Windows, with the bundled Maven: `.maven\apache-maven-3.9.16\bin\mvn.cmd spring-boot:run`.

The API listens on `http://localhost:8080`. On first start, Flyway creates the schema.

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The application opens on `http://localhost:5173`. Vite forwards `/api` and `/files` to the
backend; set `VITE_API_TARGET` to point it at another instance.

### First administrator

On an empty database there is no account, and every administration endpoint is protected.
Set `BOOTSTRAP_ADMIN_PASSWORD` (12 characters minimum) before the first start: in the `dev`
profile only, the server then creates `admin@lias.ma` with that password, flagged to be
changed at first sign-in. Without the variable, no account is created. An existing account is
never overwritten.

### With Docker

```bash
JWT_SECRET="$(openssl rand -base64 72 | tr -d '\r\n')" BOOTSTRAP_ADMIN_PASSWORD="choose-a-strong-one" docker compose up --build
```

This starts PostgreSQL 16 and the backend; the frontend is not containerised. Compose stops
with an explicit message if `JWT_SECRET` is missing. Uploaded files are kept inside the
container and do not survive its re-creation (see `AUDIT.md`, P2-8).

---

## Tests and checks

```bash
cd backend && mvn test          # 91 tests
cd frontend && npm run build    # production build
cd frontend && npm run lint     # oxlint
```

The backend suite combines unit tests (Mockito) with integration tests that start the full
Spring context on an in-memory H2 database: they never reach the real database. They cover
role derivation, the authorization matrix of the nine roles, account freezing and archiving,
equipment stock, notification targeting, the audit trail's transactions, request validation,
and the configuration of the signing key and the bootstrap account.

---

## Security in brief

- **Stateless JWT**: access tokens last 1 hour, refresh tokens 7 days, signed HS512.
- **Rights reloaded on every request**: a member who retires, leaves or is archived is
  refused at their next request, whatever tokens they still hold.
- **Two levels of authorization**: the filter chain separates public from authenticated
  routes, then `@PreAuthorize` checks the role on each method.
- **Nothing is deleted**: soft delete, four history tables, and an audit trail written in its
  own transaction, so a failed operation — a failed login above all — still leaves a trace.

Details in [`SECURITY.md`](SECURITY.md). Open issues, by priority, in [`AUDIT.md`](AUDIT.md).

---

## API documentation

Swagger UI: `http://localhost:8080/swagger-ui.html` · OpenAPI description: `/api-docs`.

## Documentation

- [`AUDIT.md`](AUDIT.md) — technical audit
- [`SECURITY.md`](SECURITY.md) — secrets and credential history
- [`docs/report/Rapport_LIAS.pdf`](docs/report/Rapport_LIAS.pdf) — project report (French)
- [`docs/report/Soutenance_LIAS.pptx`](docs/report/Soutenance_LIAS.pptx) — defence slides
- [`docs/specification.md`](docs/specification.md) — functional and technical specification
