package com.memzy.controller;

import com.memzy.dto.MediaFileDto;
import com.memzy.service.MediaFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/media")
public class MediaFileController {

    @Autowired
    private MediaFileService mediaFileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaFileDto> uploadMedia(@RequestParam("file") MultipartFile file) {
        try {
            MediaFileDto mediaFile = mediaFileService.uploadMedia(file);
            return ResponseEntity.ok(mediaFile);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    public ResponseEntity<Page<MediaFileDto>> getUserMedia(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<MediaFileDto> mediaFiles = mediaFileService.getUserMedia(pageable);
        return ResponseEntity.ok(mediaFiles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MediaFileDto> getMediaById(@PathVariable Long id) {
        try {
            MediaFileDto mediaFile = mediaFileService.getMediaById(id);
            return ResponseEntity.ok(mediaFile);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedia(@PathVariable Long id) {
        try {
            mediaFileService.deleteMedia(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<MediaFileDto> toggleFavorite(@PathVariable Long id) {
        try {
            MediaFileDto mediaFile = mediaFileService.toggleFavorite(id);
            return ResponseEntity.ok(mediaFile);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStorageStats() {
        try {
            var stats = mediaFileService.getStorageStats();
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/regenerate-video-thumbnails")
    public ResponseEntity<?> regenerateVideoThumbnails() {
        try {
            var result = mediaFileService.regenerateMissingVideoThumbnails();
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
