package com.lias.labmanagement.calendar.controller;

import com.lias.labmanagement.calendar.dto.CalendarItemResponse;
import com.lias.labmanagement.calendar.service.CalendarService;
import com.lias.labmanagement.common.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Calendar", description = "Unified timeline aggregating scientific events and internal meetings")
public class CalendarController {

    private final CalendarService service;

    @GetMapping
    @Operation(summary = "Get all calendar items (events + meetings) within a date range")
    public ApiResponse<List<CalendarItemResponse>> getItems(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ApiResponse.of(service.getItems(from, to));
    }
}
