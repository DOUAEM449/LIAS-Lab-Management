package com.lias.labmanagement.meeting.service;

import com.lias.labmanagement.audit.service.AuditService;
import com.lias.labmanagement.common.enums.AuditAction;
import com.lias.labmanagement.common.exception.ResourceNotFoundException;
import com.lias.labmanagement.common.storage.FileDownload;
import com.lias.labmanagement.common.storage.FileStorageService;
import com.lias.labmanagement.common.storage.StoredFile;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.meeting.dto.MeetingMinutesResponse;
import com.lias.labmanagement.meeting.dto.MeetingRequest;
import com.lias.labmanagement.meeting.dto.MeetingResponse;
import com.lias.labmanagement.meeting.entity.Meeting;
import com.lias.labmanagement.meeting.entity.MeetingMinutes;
import com.lias.labmanagement.meeting.repository.MeetingMinutesRepository;
import com.lias.labmanagement.meeting.repository.MeetingRepository;
import com.lias.labmanagement.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingMinutesRepository minutesRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<MeetingResponse> list(Pageable pageable) {
        Page<Meeting> page = meetingRepository.findByOrderByMeetingDateDesc(pageable);
        return PageResponse.from(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public MeetingResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public MeetingResponse create(MeetingRequest request) {
        Meeting meeting = Meeting.builder()
                .title(request.title())
                .meetingDate(request.meetingDate())
                .agenda(request.agenda())
                .type(request.type())
                .location(request.location())
                .build();
        Meeting saved = meetingRepository.save(meeting);
        auditService.record(AuditAction.CREATE, "Meeting", saved.getId(), "Meeting created: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public MeetingResponse update(UUID id, MeetingRequest request) {
        Meeting meeting = findOrThrow(id);
        meeting.setTitle(request.title());
        meeting.setMeetingDate(request.meetingDate());
        meeting.setAgenda(request.agenda());
        meeting.setType(request.type());
        meeting.setLocation(request.location());
        Meeting saved = meetingRepository.save(meeting);
        auditService.record(AuditAction.UPDATE, "Meeting", id, "Meeting updated");
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Meeting meeting = findOrThrow(id);
        meeting.markDeleted();
        meetingRepository.save(meeting);
        auditService.record(AuditAction.DELETE, "Meeting", id, "Meeting soft-deleted");
    }

    @Transactional
    public MeetingMinutesResponse uploadMinutes(UUID meetingId, MultipartFile file) {
        Meeting meeting = findOrThrow(meetingId);
        StoredFile stored = fileStorageService.store(file, "meeting-minutes");
        MeetingMinutes minutes = minutesRepository.save(MeetingMinutes.builder()
                .meeting(meeting)
                .filePath(stored.relativePath())
                .originalFileName(stored.originalFileName())
                .uploadedBy(currentUserId())
                .uploadedAt(Instant.now())
                .build());
        auditService.record(AuditAction.CREATE, "MeetingMinutes", minutes.getId(), "Minutes uploaded for meeting " + meetingId);
        return toMinutesResponse(minutes);
    }

    @Transactional(readOnly = true)
    public List<MeetingMinutesResponse> getMinutes(UUID meetingId) {
        return minutesRepository.findByMeetingIdOrderByUploadedAtDesc(meetingId).stream()
                .map(this::toMinutesResponse).toList();
    }

    /**
     * Streams a stored procès-verbal (CdC §2.17 — the PV archive is only useful if
     * it can be read back). Served through the authenticated API rather than the
     * static {@code /files/**} space, which is public only for {@code public/}.
     */
    @Transactional
    public FileDownload downloadMinutes(UUID minutesId) {
        MeetingMinutes minutes = minutesRepository.findById(minutesId)
                .orElseThrow(() -> ResourceNotFoundException.of("MeetingMinutes", minutesId));
        Path path = fileStorageService.resolve(minutes.getFilePath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Stored file is missing for this procès-verbal");
        }
        auditService.record(AuditAction.FILE_DOWNLOAD, "MeetingMinutes", minutesId, "Minutes downloaded");
        return new FileDownload(minutes.getOriginalFileName(), null, new FileSystemResource(path));
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details.getId();
        }
        return null;
    }

    private Meeting findOrThrow(UUID id) {
        return meetingRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Meeting", id));
    }

    private MeetingResponse toResponse(Meeting m) {
        boolean hasMinutes = !minutesRepository.findByMeetingIdOrderByUploadedAtDesc(m.getId()).isEmpty();
        return new MeetingResponse(m.getId(), m.getTitle(), m.getMeetingDate(), m.getAgenda(), m.getType(),
                m.getLocation(), hasMinutes);
    }

    private MeetingMinutesResponse toMinutesResponse(MeetingMinutes m) {
        return new MeetingMinutesResponse(m.getId(), m.getOriginalFileName(), m.getUploadedBy(), m.getUploadedAt());
    }
}
