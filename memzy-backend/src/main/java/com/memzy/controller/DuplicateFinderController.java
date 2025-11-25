package com.memzy.controller;

import com.memzy.dto.MediaFileDto;
import com.memzy.model.MediaFile;
import com.memzy.service.DuplicateFinderService;
import com.memzy.service.MediaFileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/duplicates")
public class DuplicateFinderController {

    private static final Logger logger = LoggerFactory.getLogger(DuplicateFinderController.class);

    @Autowired
    private DuplicateFinderService duplicateFinderService;

    @Autowired
    private MediaFileService mediaFileService;

    @GetMapping("/by-hash")
    public ResponseEntity<?> findDuplicatesByHash() {
        try {
            Map<String, List<MediaFile>> duplicates = duplicateFinderService.findDuplicatesByHash();

            // Convert to DTOs
            Map<String, List<MediaFileDto>> result = duplicates.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            entry -> entry.getValue().stream()
                                    .map(mediaFileService::convertToDto)
                                    .collect(Collectors.toList())
                    ));

            return ResponseEntity.ok(Map.of(
                    "message", "Duplicates found by hash",
                    "duplicateGroups", result,
                    "totalGroups", result.size()
            ));
        } catch (Exception e) {
            logger.error("Failed to find duplicates by hash", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-size")
    public ResponseEntity<?> findDuplicatesBySize() {
        try {
            Map<String, Object> result = duplicateFinderService.findDuplicatesBySize();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Failed to find duplicates by size", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-name")
    public ResponseEntity<?> findSimilarByName(
            @RequestParam(defaultValue = "0.8") double threshold) {
        try {
            Map<String, Object> result = duplicateFinderService.findSimilarByName(threshold);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Failed to find similar files by name", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-dimensions")
    public ResponseEntity<?> findDuplicatesByDimensions() {
        try {
            Map<String, Object> result = duplicateFinderService.findDuplicatesByDimensions();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Failed to find duplicates by dimensions", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDuplicateStats() {
        try {
            Map<String, Object> stats = duplicateFinderService.getDuplicateStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Failed to get duplicate stats", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
