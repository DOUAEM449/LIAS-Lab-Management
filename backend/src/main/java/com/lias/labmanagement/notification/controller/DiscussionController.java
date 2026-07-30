package com.lias.labmanagement.notification.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.notification.dto.DiscussionRequest;
import com.lias.labmanagement.notification.dto.DiscussionResponse;
import com.lias.labmanagement.notification.dto.MessageRequest;
import com.lias.labmanagement.notification.dto.MessageResponse;
import com.lias.labmanagement.notification.entity.DiscussionScope;
import com.lias.labmanagement.notification.service.DiscussionService;
import com.lias.labmanagement.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discussions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Discussions", description = "Internal team/event/global discussion threads")
public class DiscussionController {

    private final DiscussionService service;
    private final MemberRepository memberRepository;

    @GetMapping
    @Operation(summary = "List discussions filtered by scope")
    public ApiResponse<PageResponse<DiscussionResponse>> findByScope(@RequestParam DiscussionScope scope, @ParameterObject Pageable pageable) {
        return ApiResponse.of(service.findByScope(scope, pageable));
    }

    @GetMapping("/by-team/{teamId}")
    @Operation(summary = "List discussions for a given team")
    public ApiResponse<List<DiscussionResponse>> findByTeam(@PathVariable UUID teamId) {
        return ApiResponse.of(service.findByTeam(teamId));
    }

    @GetMapping("/by-event/{eventId}")
    @Operation(summary = "List discussions for a given event")
    public ApiResponse<List<DiscussionResponse>> findByEvent(@PathVariable UUID eventId) {
        return ApiResponse.of(service.findByEvent(eventId));
    }

    @PostMapping
    @Operation(summary = "Create a new discussion thread")
    public ApiResponse<DiscussionResponse> create(@Valid @RequestBody DiscussionRequest request,
                                                   @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(service.create(currentMemberId(currentUser), request), "Discussion created");
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Post a message to a discussion thread")
    public ApiResponse<MessageResponse> postMessage(@PathVariable UUID id, @Valid @RequestBody MessageRequest request,
                                                     @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(service.postMessage(id, currentMemberId(currentUser), request), "Message posted");
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "List all messages of a discussion thread")
    public ApiResponse<List<MessageResponse>> getMessages(@PathVariable UUID id) {
        return ApiResponse.of(service.getMessages(id));
    }

    private UUID currentMemberId(CustomUserDetails currentUser) {
        return memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new com.lias.labmanagement.common.exception.ResourceNotFoundException("No member profile linked to this account"))
                .getId();
    }
}
