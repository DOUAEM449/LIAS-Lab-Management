package com.lias.labmanagement.common.config;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.RoleName;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default System Administrator account on startup, only when no user
 * with that email exists yet. Local/dev convenience so the API can be
 * exercised (e.g. via Swagger) without a manual SQL insert.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@lias.ma";
    private static final String ADMIN_PASSWORD = "admin123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmailIgnoreCase(ADMIN_EMAIL)) {
            return;
        }
        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                .role(RoleName.SYSTEM_ADMIN)
                .enabled(true)
                .mustChangePassword(false)
                .build();
        userRepository.save(admin);
        log.info("Seeded default System Administrator account: {}", ADMIN_EMAIL);
    }
}
