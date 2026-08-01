# 🔬 LIAS Lab Management System

> A robust, modern RESTful backend API built with Spring Boot 3 to streamline research laboratory workflows, member administration, partnership tracking, and publication management.

---

## 🛠️ Tech Stack & Tools

- **Language:** Java 21
- **Framework:** Spring Boot 3.x
- **Security:** Spring Security & JWT (JSON Web Tokens)
- **Database:** Neon Cloud PostgreSQL (Serverless)
- **Database Migration:** Flyway
- **ORM:** Spring Data JPA / Hibernate
- **API Documentation:** Springdoc OpenAPI v2 (Swagger UI)
- **Build Tool:** Maven

---

## ✨ Key Features & Modules

- **🔒 Authentication & Security:** Role-based access control with secure JWT authentication.
- **👥 Member Management:** Complete workflow for managing lab members, roles, and profiles.
- **📝 Membership Requests:** Workflow for reviewing and approving new member applications.
- **📅 Meetings & Agenda:** Scheduling and management of laboratory meetings.
- **🤝 Partnerships & Agreements:** Tracking research collaborations, agreements, and external partners.
- **📚 Publications & Reports:** Repository for lab research papers, documents, and periodic reports.
- **🔔 Notifications & Audit Logs:** Event tracking, notifications, and system audit logging.
- **⚡ Paginated Responses:** High-performance paginated endpoints for large datasets using custom OpenAPI pageable parameters.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

* **Java JDK 21** or higher
* **Maven 3.8+** (or use the included Maven wrapper `./mvnw`)
* **Neon Cloud PostgreSQL Account / Credentials**

---

### ⚙️ Database Configuration

1. The project uses **Neon Cloud PostgreSQL** for remote database hosting and automated schema management via **Flyway**.
2. Configure your cloud database credentials in `backend/src/main/resources/application-dev.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://<your-neon-host>.neon.tech/<dbname>?sslmode=require
    username: <your-neon-username>
    password: <your-neon-password>