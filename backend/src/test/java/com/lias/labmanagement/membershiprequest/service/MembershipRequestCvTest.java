package com.lias.labmanagement.membershiprequest.service;

import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.exception.BadRequestException;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.membershiprequest.dto.MembershipRequestSubmission;
import com.lias.labmanagement.membershiprequest.entity.MembershipRequest;
import com.lias.labmanagement.membershiprequest.repository.MembershipRequestRepository;
import com.lias.labmanagement.notification.service.NotificationService;
import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * The membership form is anonymous, so its CV upload is a public write path. The CV is
 * restricted to a real PDF (checked by signature, not the declared type) so the endpoint
 * cannot be used to store arbitrary files.
 */
@ExtendWith(MockitoExtension.class)
class MembershipRequestCvTest {

    @Mock private MembershipRequestRepository requestRepository;
    @Mock private UserRepository userRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    @InjectMocks private MembershipRequestService service;

    private MembershipRequestSubmission submission() {
        return new MembershipRequestSubmission("Sara", "Idrissi", "sara@example.org",
                MemberStatus.PHD_STUDENT, "ENSA", "Je souhaite rejoindre le laboratoire.");
    }

    @BeforeEach
    void noExistingAccountOrRequest() {
        lenient().when(userRepository.existsByEmailIgnoreCase(any())).thenReturn(false);
        lenient().when(requestRepository.existsByEmailIgnoreCaseAndStatus(any(), any())).thenReturn(false);
    }

    @Test
    void aCvThatIsNotAPdfIsRejected() {
        MockMultipartFile fakeCv = new MockMultipartFile("cv", "cv.pdf", "application/pdf",
                "<html>not a pdf</html>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.submit(submission(), fakeCv))
                .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void aRealPdfCvIsAccepted() {
        MockMultipartFile realCv = new MockMultipartFile("cv", "cv.pdf", "application/pdf",
                "%PDF-1.7\n...binary...".getBytes(StandardCharsets.ISO_8859_1));
        when(fileStorageService.store(any(), any())).thenReturn(
                new StoredFile("x.pdf", "cv.pdf", "application/pdf", 10, "membership-cv/x.pdf"));
        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0, MembershipRequest.class));

        service.submit(submission(), realCv);
        // no exception: a real PDF is accepted and stored
    }
}
