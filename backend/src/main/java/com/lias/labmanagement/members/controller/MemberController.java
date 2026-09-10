package com.lias.labmanagement.members.controller;

import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.web.ApiResponse;
import com.lias.labmanagement.common.web.PageResponse;
import com.lias.labmanagement.members.dto.AffiliationHistoryResponse;
import com.lias.labmanagement.members.dto.ChangeStatusRequest;
import com.lias.labmanagement.members.dto.LeaveAffiliationRequest;
import com.lias.labmanagement.members.dto.MemberPublicResponse;
import com.lias.labmanagement.members.dto.MemberResponse;
import com.lias.labmanagement.members.dto.MemberStatusHistoryResponse;
import com.lias.labmanagement.members.dto.MemberUpdateRequest;
import com.lias.labmanagement.members.dto.ReturnAffiliationRequest;
import com.lias.labmanagement.members.service.MemberService;
import com.lias.labmanagement.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Members", description = "Member profile management, status and affiliation history")
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/api/v1/public/members")
    @Operation(summary = "Public list of laboratory members")
    public ApiResponse<PageResponse<MemberPublicResponse>> listPublic(
            @RequestParam(required = false) String search, @ParameterObject Pageable pageable) {
        return ApiResponse.of(memberService.searchPublic(search, pageable));
    }

    @GetMapping("/api/v1/public/members/{id}")
    @Operation(summary = "Public profile of a single member")
    public ApiResponse<MemberPublicResponse> getPublic(@PathVariable UUID id) {
        return ApiResponse.of(memberService.getPublicById(id));
    }

    @GetMapping("/api/v1/members")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Search/filter/paginate members (internal, full profile)")
    public ApiResponse<PageResponse<MemberResponse>> search(
            @RequestParam(required = false) MemberStatus status,
            @RequestParam(required = false) UUID teamId,
            @RequestParam(required = false) String search,
            @ParameterObject Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(memberService.search(status, teamId, search, pageable, currentUser));
    }

    @GetMapping("/api/v1/members/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get full member profile")
    public ApiResponse<MemberResponse> getById(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(memberService.getById(id, currentUser));
    }

    @GetMapping("/api/v1/members/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get the current authenticated user's own member profile")
    public ApiResponse<MemberResponse> getMyProfile(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(memberService.getByUserId(currentUser.getId()));
    }

    @PutMapping("/api/v1/members/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update member profile (self-service only, or SYSTEM_ADMIN/DIRECTOR/VICE_DIRECTOR for any member)")
    public ApiResponse<MemberResponse> update(@PathVariable UUID id, @Valid @RequestBody MemberUpdateRequest request,
                                               @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(memberService.updateProfile(id, request, currentUser), "Profile updated successfully");
    }

    @PostMapping("/api/v1/members/me/avatar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload/replace the current user's own avatar photo")
    public ApiResponse<MemberResponse> uploadMyAvatar(@AuthenticationPrincipal CustomUserDetails currentUser,
                                                        @RequestParam("file") MultipartFile file) {
        return ApiResponse.of(memberService.uploadAvatar(currentUser.getId(), file), "Avatar updated");
    }

    @DeleteMapping("/api/v1/members/me/avatar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove the current user's own avatar photo, reverting to the default")
    public ApiResponse<MemberResponse> deleteMyAvatar(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return ApiResponse.of(memberService.deleteAvatar(currentUser.getId()), "Avatar removed");
    }

    @DeleteMapping("/api/v1/members/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Archive a member (soft delete, history preserved)")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        memberService.delete(id);
        return ApiResponse.message("Member archived");
    }

    @PostMapping("/api/v1/members/{id}/restore")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Restore a previously archived member")
    public ApiResponse<Void> restore(@PathVariable UUID id) {
        memberService.restore(id);
        return ApiResponse.message("Member restored");
    }

    @PostMapping("/api/v1/members/{id}/status")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR')")
    @Operation(summary = "Change member status (historized)")
    public ApiResponse<MemberResponse> changeStatus(@PathVariable UUID id, @Valid @RequestBody ChangeStatusRequest request) {
        return ApiResponse.of(memberService.changeStatus(id, request), "Status updated");
    }

    @GetMapping("/api/v1/members/{id}/status-history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Full status history of a member")
    public ApiResponse<List<MemberStatusHistoryResponse>> statusHistory(@PathVariable UUID id) {
        return ApiResponse.of(memberService.getStatusHistory(id));
    }

    @GetMapping("/api/v1/members/{id}/affiliation-history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Full affiliation history of a member (all leave/return periods)")
    public ApiResponse<List<AffiliationHistoryResponse>> affiliationHistory(@PathVariable UUID id) {
        return ApiResponse.of(memberService.getAffiliationHistory(id));
    }

    @PostMapping("/api/v1/members/{id}/leave")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Record a member leaving the laboratory")
    public ApiResponse<Void> leave(@PathVariable UUID id, @Valid @RequestBody LeaveAffiliationRequest request) {
        memberService.leave(id, request);
        return ApiResponse.message("Member marked as having left the laboratory");
    }

    @PostMapping("/api/v1/members/{id}/return")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','DIRECTOR')")
    @Operation(summary = "Reactivate a former/retired member: opens a new affiliation period, keeps all history")
    public ApiResponse<MemberResponse> returnToLab(@PathVariable UUID id, @Valid @RequestBody ReturnAffiliationRequest request,
                                                    @AuthenticationPrincipal CustomUserDetails currentUser) {
        memberService.returnToLab(id, request, request.reinstatedStatus());
        return ApiResponse.of(memberService.getById(id, currentUser), "Member reactivated");
    }
}
