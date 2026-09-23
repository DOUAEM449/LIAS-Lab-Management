package com.lias.labmanagement.common.config;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.RoleName;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Bootstraps the very first System Administrator account, so that a freshly
 * created database can be opened at all: every administration endpoint is
 * guarded, therefore nobody could grant the first role without it.
 *
 * <p>Three safeguards frame that privilege:
 * <ul>
 *   <li>the component is restricted to the {@code dev} profile, so a production
 *       deployment never gets an account it did not explicitly create;</li>
 *   <li>the password is read from the environment
 *       ({@code BOOTSTRAP_ADMIN_PASSWORD}) and has <em>no</em> fallback value:
 *       without it the seeding is skipped rather than defaulted;</li>
 *   <li>the account is flagged {@code mustChangePassword}, like every other
 *       provisioned account, so the bootstrap secret is meant to be rotated at
 *       first sign-in.</li>
 * </ul>
 *
 * <p>Nothing is ever overwritten: an existing account with that email is left
 * untouched, password included.
 */
@Slf4j
@Component
@Profile("dev")
public class AdminAccountInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@lias.ma";

    /** Below this length a bootstrap secret is refused rather than seeded. */
    static final int MIN_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapPassword;

    public AdminAccountInitializer(UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   @Value("${app.bootstrap.admin-password:}") String bootstrapPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapPassword = bootstrapPassword;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmailIgnoreCase(ADMIN_EMAIL)) {
            return;
        }
        if (bootstrapPassword == null || bootstrapPassword.isBlank()) {
            log.info("No BOOTSTRAP_ADMIN_PASSWORD configured: the {} account is not seeded. "
                    + "Set that variable to bootstrap a fresh database.", ADMIN_EMAIL);
            return;
        }
        if (bootstrapPassword.length() < MIN_PASSWORD_LENGTH) {
            log.error("BOOTSTRAP_ADMIN_PASSWORD is shorter than {} characters: the {} account is "
                    + "not seeded. Provide a stronger secret.", MIN_PASSWORD_LENGTH, ADMIN_EMAIL);
            return;
        }
        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(bootstrapPassword))
                .role(RoleName.SYSTEM_ADMIN)
                .enabled(true)
                .mustChangePassword(true)
                .build();
        userRepository.save(admin);
        log.info("Seeded bootstrap System Administrator account {} (password change required).",
                ADMIN_EMAIL);
    }
}
