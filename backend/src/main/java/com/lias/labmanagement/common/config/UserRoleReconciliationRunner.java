package com.lias.labmanagement.common.config;

import com.lias.labmanagement.governance.service.UserRoleSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * On startup, realigns every member account's {@code User.role} with the role its
 * status and active mandates imply (CdC §2.21 — le rôle effectif est dérivé, jamais
 * incohérent).
 * <p>
 * {@link UserRoleSyncService} keeps roles correct going forward, but only on write
 * paths. Accounts created before that logic existed — or seeded directly — kept
 * whatever {@code users.role} they were given. This runner closes that gap once and
 * is idempotent, so it is safe to leave enabled.
 */
@Slf4j
@Component
@Order(20)
@RequiredArgsConstructor
public class UserRoleReconciliationRunner implements CommandLineRunner {

    private final UserRoleSyncService userRoleSyncService;

    @Override
    public void run(String... args) {
        try {
            UserRoleSyncService.ReconcileResult result = userRoleSyncService.reconcileAll();
            if (result.rolesCorrected() == 0 && result.historyBackfilled() == 0) {
                log.info("User role reconciliation: all accounts already consistent");
            } else {
                log.warn("User role reconciliation: {} account(s) had an inconsistent role corrected, "
                        + "{} account(s) had their role history backfilled",
                        result.rolesCorrected(), result.historyBackfilled());
            }
        } catch (Exception ex) {
            // Never block startup on this; the forward-path sync still applies.
            log.error("User role reconciliation failed: {}", ex.getMessage(), ex);
        }
    }
}
