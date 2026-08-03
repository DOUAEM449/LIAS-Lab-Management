package com.lias.labmanagement.common.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper around {@link JavaMailSender} used by every module that
 * needs to notify a user by email (password reset, membership decision,
 * event reminders...). Sending is asynchronous so it never blocks the
 * originating HTTP request.
 * <p>
 * When no SMTP credentials are configured ({@code MAIL_USERNAME} unset —
 * the default for local/dev), sending would otherwise silently fail (see
 * the {@code catch} below) and any auto-generated content in the body
 * (e.g. a new member's temporary password) would be lost. In that case the
 * email is logged in full instead, so it stays retrievable during dev/testing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Async
    public void send(String to, String subject, String body) {
        if (StringUtils.isBlank(mailUsername)) {
            log.info("""
                    ===== DEV MAIL FALLBACK (no SMTP credentials configured) =====
                    To: {}
                    Subject: {}

                    {}
                    ===== END EMAIL =====""", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }
}
