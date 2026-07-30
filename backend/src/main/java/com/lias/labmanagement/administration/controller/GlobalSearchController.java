package com.lias.labmanagement.administration.controller;

import com.lias.labmanagement.administration.dto.GlobalSearchResult;
import com.lias.labmanagement.administration.service.GlobalSearchService;
import com.lias.labmanagement.common.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Global Search", description = "Cross-module keyword search")
public class GlobalSearchController {

    private final GlobalSearchService service;

    @GetMapping
    @Operation(summary = "Search members, publications, events, documents and equipment by keyword")
    public ApiResponse<List<GlobalSearchResult>> search(@RequestParam("q") String query) {
        return ApiResponse.of(service.search(query));
    }
}
