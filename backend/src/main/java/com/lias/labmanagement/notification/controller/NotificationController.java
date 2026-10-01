package com.lias.labmanagement.notification.controller;

import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.notification.dto.NotificationResponse;
import com.lias.labmanagement.notification.service.NotificationService;
import com.lias.labmanagement.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Notifications", description = "In-app notifications for the current member")
public class NotificationController {

    private final NotificationService service;
    private final MemberRepository memberRepository;

    @GetMapping
    @Operation(summary = "List notifications for the current member")
    public ApiResponse<PageResponse<NotificationResponse>> list(@AuthenticationPrincipal CustomUserDetails currentUser, @ParameterObject Pageable pageable) {
        UUID memberId = currentMemberId(currentUser);
        return ApiResponse.of(service.getForMember(memberId, pageable));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Count unread notifications for the current member")
    public ApiResponse<Long> unreadCount(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(service.countUnread(currentMemberId(currentUser)));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ApiResponse<Void> markAsRead(@PathVariable UUID id,
                                        @AuthenticationPrincipal CustomUserDetails currentUser) {
        service.markAsRead(id, currentMemberId(currentUser));
        return ApiResponse.message("Notification marked as read");
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for the current member")
    public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal CustomUserDetails currentUser) {
        service.markAllAsRead(currentMemberId(currentUser));
        return ApiResponse.message("All notifications marked as read");
    }

    private UUID currentMemberId(CustomUserDetails currentUser) {
        return memberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new com.lias.labmanagement.common.exception.ResourceNotFoundException("No member profile linked to this account"))
                .getId();
    }
}
