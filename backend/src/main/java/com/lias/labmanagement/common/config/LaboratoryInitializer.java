package com.lias.labmanagement.common.config;

import com.lias.labmanagement.laboratory.entity.Laboratory;
import com.lias.labmanagement.laboratory.repository.LaboratoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the single Laboratory record (CdC §4.1) on startup if none exists yet, so
 * SYSTEM_ADMIN only ever needs to edit it, never create it from scratch.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LaboratoryInitializer implements CommandLineRunner {

    private final LaboratoryRepository laboratoryRepository;

    @Override
    public void run(String... args) {
        if (laboratoryRepository.count() > 0) {
            return;
        }
        // foundingDate intentionally left null — SYSTEM_ADMIN sets the real date via
        // PUT /api/v1/laboratory rather than the seed guessing at an institutional fact.
        laboratoryRepository.save(Laboratory.builder()
                .name("LIAS — Laboratoire d'Informatique et Automatique pour les Systèmes")
                .description("Laboratoire de recherche de la Faculté des Sciences Ben M'Sik, Casablanca.")
                .build());
        log.info("Seeded default Laboratory record");
    }
}
