package com.lias.labmanagement.event.controller;

import com.lias.labmanagement.common.enums.EventType;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.event.dto.EventParticipantResponse;
import com.lias.labmanagement.event.dto.EventRequest;
import com.lias.labmanagement.event.dto.EventResponse;
import com.lias.labmanagement.event.service.EventService;
import com.lias.labmanagement.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Scientific Events", description = "Conferences, workshops and seminars, with edition archiving")
public class EventController {

    private final EventService service;

    @GetMapping
    @Operation(summary = "Search / list events (public read access)")
    public ApiResponse<PageResponse<EventResponse>> search(
            @RequestParam(required = false) EventType type,
            @RequestParam(required = false, defaultValue = "") String query,
            @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.search(type, query, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single event (public read access)")
    public ApiResponse<EventResponse> getById(@PathVariable UUID id) {
        return ApiResponse.of(service.getById(id));
    }

    @GetMapping("/editions")
    @Operation(summary = "Get every past edition of a recurring event by its title")
    public ApiResponse<List<EventResponse>> getEditions(@RequestParam String title) {
        return ApiResponse.of(service.getEditionsByTitle(title));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER')")
    @Operation(summary = "Create a new event")
    public ApiResponse<EventResponse> create(@Valid @RequestBody EventRequest request) {
        return ApiResponse.of(service.create(request), "Event created");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER')")
    @Operation(summary = "Update an existing event")
    public ApiResponse<EventResponse> update(@PathVariable UUID id, @Valid @RequestBody EventRequest request) {
        return ApiResponse.of(service.update(id, request), "Event updated");
    }

    @PostMapping(path = "/{id}/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER')")
    @Operation(summary = "Upload the banner image for an event")
    public ApiResponse<EventResponse> uploadBanner(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
        return ApiResponse.of(service.uploadBanner(id, file), "Banner uploaded");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Soft-delete an event")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.message("Event deleted");
    }

    @PostMapping("/{id}/register")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Register the current member as a participant of an event")
    public ApiResponse<EventParticipantResponse> register(@PathVariable UUID id,
                                                            @RequestParam UUID memberId,
                                                            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(service.register(id, memberId), "Registered for event");
    }

    @GetMapping("/{id}/participants")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List the participants of an event")
    public ApiResponse<List<EventParticipantResponse>> getParticipants(@PathVariable UUID id) {
        return ApiResponse.of(service.getParticipants(id));
    }
}
