package com.lias.labmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point of the LIAS Laboratory Management System backend.
 * <p>
 * The application is organized as a Domain-Driven, modular monolith:
 * each business capability (members, governance, publications, events,
 * documents, equipment, partnerships, meetings, notifications, calendar,
 * reports, administration...) lives in its own top level package with
 * its own entities, DTOs, repositories, services and REST controllers.
 */
@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
@EnableAsync
@EnableScheduling
public class LabManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(LabManagementApplication.class, args);
    }
}
