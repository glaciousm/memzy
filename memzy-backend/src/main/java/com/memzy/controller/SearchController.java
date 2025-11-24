package com.memzy.controller;

import com.memzy.dto.MediaFileDto;
import com.memzy.model.MediaFile;
import com.memzy.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    @GetMapping
    public ResponseEntity<Page<MediaFileDto>> searchMedia(
            @RequestParam(required = false) MediaFile.MediaType mediaType,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Boolean isFavorite,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<MediaFileDto> results = searchService.searchMedia(
                mediaType, tagIds, startDate, endDate, isFavorite, pageable
        );

        return ResponseEntity.ok(results);
    }

    @GetMapping("/favorites")
    public ResponseEntity<Page<MediaFileDto>> getFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MediaFileDto> favorites = searchService.getFavorites(pageable);
        return ResponseEntity.ok(favorites);
    }

    @GetMapping("/deleted")
    public ResponseEntity<Page<MediaFileDto>> getDeletedMedia(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "deletedAt"));
        Page<MediaFileDto> deleted = searchService.getDeletedMedia(pageable);
        return ResponseEntity.ok(deleted);
    }
}
