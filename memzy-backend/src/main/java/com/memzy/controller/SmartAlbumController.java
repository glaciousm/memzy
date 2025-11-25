package com.memzy.controller;

import com.memzy.dto.MediaFileDto;
import com.memzy.dto.SmartAlbumDto;
import com.memzy.dto.SmartAlbumRuleDto;
import com.memzy.model.MediaFile;
import com.memzy.model.SmartAlbum;
import com.memzy.model.SmartAlbumRule;
import com.memzy.service.MediaFileService;
import com.memzy.service.SmartAlbumService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/smart-albums")
public class SmartAlbumController {

    private static final Logger logger = LoggerFactory.getLogger(SmartAlbumController.class);

    @Autowired
    private SmartAlbumService smartAlbumService;

    @Autowired
    private MediaFileService mediaFileService;

    @PostMapping
    public ResponseEntity<?> createSmartAlbum(@RequestBody SmartAlbumDto dto) {
        try {
            List<SmartAlbumRule> rules = dto.getRules().stream()
                    .map(this::convertRuleDtoToEntity)
                    .collect(Collectors.toList());

            SmartAlbum smartAlbum = smartAlbumService.createSmartAlbum(
                    dto.getName(),
                    dto.getDescription(),
                    dto.getMatchType(),
                    rules
            );

            SmartAlbumDto resultDto = convertToDto(smartAlbum);

            return ResponseEntity.ok(Map.of(
                    "message", "Smart album created successfully",
                    "smartAlbum", resultDto
            ));
        } catch (Exception e) {
            logger.error("Failed to create smart album", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserSmartAlbums() {
        try {
            List<SmartAlbum> smartAlbums = smartAlbumService.getUserSmartAlbums();

            List<SmartAlbumDto> dtos = smartAlbums.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Failed to get smart albums", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSmartAlbumById(@PathVariable Long id) {
        try {
            SmartAlbum smartAlbum = smartAlbumService.getSmartAlbumById(id);
            SmartAlbumDto dto = convertToDto(smartAlbum);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to get smart album", e);
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/media")
    public ResponseEntity<?> getSmartAlbumMedia(@PathVariable Long id) {
        try {
            List<MediaFile> mediaFiles = smartAlbumService.getSmartAlbumMedia(id);

            List<MediaFileDto> dtos = mediaFiles.stream()
                    .map(mediaFileService::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Failed to get smart album media", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSmartAlbum(@PathVariable Long id, @RequestBody SmartAlbumDto dto) {
        try {
            List<SmartAlbumRule> rules = dto.getRules().stream()
                    .map(this::convertRuleDtoToEntity)
                    .collect(Collectors.toList());

            SmartAlbum smartAlbum = smartAlbumService.updateSmartAlbum(
                    id,
                    dto.getName(),
                    dto.getDescription(),
                    dto.getMatchType(),
                    rules
            );

            SmartAlbumDto resultDto = convertToDto(smartAlbum);

            return ResponseEntity.ok(Map.of(
                    "message", "Smart album updated successfully",
                    "smartAlbum", resultDto
            ));
        } catch (Exception e) {
            logger.error("Failed to update smart album", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSmartAlbum(@PathVariable Long id) {
        try {
            smartAlbumService.deleteSmartAlbum(id);
            return ResponseEntity.ok(Map.of("message", "Smart album deleted successfully"));
        } catch (Exception e) {
            logger.error("Failed to delete smart album", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private SmartAlbumDto convertToDto(SmartAlbum smartAlbum) {
        List<SmartAlbumRuleDto> ruleDtos = smartAlbum.getRules().stream()
                .map(this::convertRuleToDto)
                .collect(Collectors.toList());

        // Get media count
        int mediaCount = 0;
        try {
            mediaCount = smartAlbumService.getSmartAlbumMedia(smartAlbum.getId()).size();
        } catch (Exception e) {
            logger.warn("Failed to get media count for smart album {}", smartAlbum.getId());
        }

        return SmartAlbumDto.builder()
                .id(smartAlbum.getId())
                .name(smartAlbum.getName())
                .description(smartAlbum.getDescription())
                .isActive(smartAlbum.getIsActive())
                .matchType(smartAlbum.getMatchType())
                .rules(ruleDtos)
                .mediaCount(mediaCount)
                .createdAt(smartAlbum.getCreatedAt())
                .updatedAt(smartAlbum.getUpdatedAt())
                .build();
    }

    private SmartAlbumRuleDto convertRuleToDto(SmartAlbumRule rule) {
        return SmartAlbumRuleDto.builder()
                .id(rule.getId())
                .field(rule.getField())
                .operator(rule.getOperator())
                .value(rule.getValue())
                .value2(rule.getValue2())
                .sortOrder(rule.getSortOrder())
                .build();
    }

    private SmartAlbumRule convertRuleDtoToEntity(SmartAlbumRuleDto dto) {
        return SmartAlbumRule.builder()
                .field(dto.getField())
                .operator(dto.getOperator())
                .value(dto.getValue())
                .value2(dto.getValue2())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();
    }
}
