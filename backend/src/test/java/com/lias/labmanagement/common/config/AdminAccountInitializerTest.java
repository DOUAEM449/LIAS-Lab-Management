package com.lias.labmanagement.common.config;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.RoleName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The bootstrap administrator is the single most privileged account of the system.
 * These tests pin the three properties that keep it from becoming a back door:
 * no secret means no account, a weak secret means no account, and the account that
 * is created must rotate its password.
 */
@ExtendWith(MockitoExtension.class)
class AdminAccountInitializerTest {

    private static final String STRONG_SECRET = "Rb7!qz2VmT#4wLpX";

    @Mock private UserRepository userRepository;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);

    private AdminAccountInitializer initializer(String password) {
        return new AdminAccountInitializer(userRepository, encoder, password);
    }

    @Test
    void noAccountIsSeededWhenNoBootstrapSecretIsConfigured() {
        when(userRepository.existsByEmailIgnoreCase("admin@lias.ma")).thenReturn(false);

        initializer("").run();

        verify(userRepository, never()).save(any());
    }

    @Test
    void noAccountIsSeededWhenTheBootstrapSecretIsTooWeak() {
        when(userRepository.existsByEmailIgnoreCase("admin@lias.ma")).thenReturn(false);

        initializer("admin123").run();

        verify(userRepository, never()).save(any());
    }

    @Test
    void anExistingAdministratorIsNeverOverwritten() {
        when(userRepository.existsByEmailIgnoreCase("admin@lias.ma")).thenReturn(true);

        initializer(STRONG_SECRET).run();

        verify(userRepository, never()).save(any());
    }

    @Test
    void theSeededAdministratorIsHashedAndMustRotateItsPassword() {
        when(userRepository.existsByEmailIgnoreCase("admin@lias.ma")).thenReturn(false);

        initializer(STRONG_SECRET).run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        User admin = saved.getValue();

        assertThat(admin.getEmail()).isEqualTo("admin@lias.ma");
        assertThat(admin.getRole()).isEqualTo(RoleName.SYSTEM_ADMIN);
        assertThat(admin.isEnabled()).isTrue();
        assertThat(admin.isMustChangePassword()).isTrue();
        // The clear-text secret is never persisted; only a BCrypt digest of it is.
        assertThat(admin.getPasswordHash()).isNotEqualTo(STRONG_SECRET);
        assertThat(encoder.matches(STRONG_SECRET, admin.getPasswordHash())).isTrue();
    }

    /**
     * The profile guard is what keeps a production deployment from ever getting a
     * bootstrap administrator, so it is asserted on the real condition evaluation
     * rather than trusted to the annotation being present.
     */
    @Test
    void theComponentIsRegisteredInDevAndNowhereElse() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> encoder)
                .withUserConfiguration(AdminAccountInitializer.class);

        runner.withPropertyValues("spring.profiles.active=dev")
                .run(ctx -> assertThat(ctx).hasSingleBean(AdminAccountInitializer.class));

        runner.withPropertyValues("spring.profiles.active=prod")
                .run(ctx -> assertThat(ctx).doesNotHaveBean(AdminAccountInitializer.class));
    }
}
