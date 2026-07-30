package com.lias.labmanagement.meeting.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.meeting.dto.MeetingMinutesResponse;
import com.lias.labmanagement.meeting.dto.MeetingRequest;
import com.lias.labmanagement.meeting.dto.MeetingResponse;
import com.lias.labmanagement.meeting.service.MeetingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/meetings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Meetings", description = "Internal laboratory meetings with archived minutes")
public class MeetingController {

    private final MeetingService service;

    @GetMapping
    @Operation(summary = "List meetings, most recent first")
    public ApiResponse<PageResponse<MeetingResponse>> list(@ParameterObject Pageable pageable) {
        return ApiResponse.of(service.list(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single meeting")
    public ApiResponse<MeetingResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER')")
    @Operation(summary = "Schedule a new meeting")
    public ApiResponse<MeetingResponse> create(@Valid @RequestBody MeetingRequest request) {
        return ApiResponse.of(service.create(request), "Meeting created");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER')")
    @Operation(summary = "Update a meeting")
    public ApiResponse<MeetingResponse> update(@PathVariable UUID id, @Valid @RequestBody MeetingRequest request) {
        return ApiResponse.of(service.update(id, request), "Meeting updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Soft-delete a meeting")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Meeting deleted");
    }

    @PostMapping(path = "/{id}/minutes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER')")
    @Operation(summary = "Upload the minutes document for a meeting")
    public ApiResponse<MeetingMinutesResponse> uploadMinutes(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(service.uploadMinutes(id, file), "Minutes uploaded");
    }

    @GetMapping("/{id}/minutes")
    @Operation(summary = "List the minutes documents for a meeting")
    public ApiResponse<List<MeetingMinutesResponse>> getMinutes(@PathVariable UUID id) {
        return ApiResponse.of(service.getMinutes(id));
    }
}
