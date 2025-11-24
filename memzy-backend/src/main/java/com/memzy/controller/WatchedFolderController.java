package com.memzy.controller;

import com.memzy.dto.WatchedFolderDto;
import com.memzy.model.WatchedFolder;
import com.memzy.service.WatchedFolderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/watched-folders")
public class WatchedFolderController {

    @Autowired
    private WatchedFolderService watchedFolderService;

    @PostMapping
    public ResponseEntity<WatchedFolderDto> addWatchedFolder(@RequestBody Map<String, Object> request) {
        try {
            String folderPath = (String) request.get("folderPath");
            Boolean recursiveScan = request.containsKey("recursiveScan") ? (Boolean) request.get("recursiveScan") : true;
            Boolean autoImport = request.containsKey("autoImport") ? (Boolean) request.get("autoImport") : true;
            Integer scanIntervalMinutes = request.containsKey("scanIntervalMinutes")
                    ? ((Number) request.get("scanIntervalMinutes")).intValue()
                    : 60;

            WatchedFolder watchedFolder = watchedFolderService.addWatchedFolder(
                    folderPath, recursiveScan, autoImport, scanIntervalMinutes
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDto(watchedFolder));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<WatchedFolderDto>> getUserWatchedFolders() {
        List<WatchedFolder> watchedFolders = watchedFolderService.getUserWatchedFolders();
        List<WatchedFolderDto> dtos = watchedFolders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WatchedFolderDto> getWatchedFolderById(@PathVariable Long id) {
        try {
            WatchedFolder watchedFolder = watchedFolderService.getWatchedFolderById(id);
            return ResponseEntity.ok(convertToDto(watchedFolder));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<WatchedFolderDto> updateWatchedFolder(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        try {
            Boolean isActive = request.containsKey("isActive") ? (Boolean) request.get("isActive") : null;
            Boolean recursiveScan = request.containsKey("recursiveScan") ? (Boolean) request.get("recursiveScan") : null;
            Boolean autoImport = request.containsKey("autoImport") ? (Boolean) request.get("autoImport") : null;
            Integer scanIntervalMinutes = request.containsKey("scanIntervalMinutes")
                    ? ((Number) request.get("scanIntervalMinutes")).intValue()
                    : null;

            WatchedFolder watchedFolder = watchedFolderService.updateWatchedFolder(
                    id, isActive, recursiveScan, autoImport, scanIntervalMinutes
            );

            return ResponseEntity.ok(convertToDto(watchedFolder));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWatchedFolder(@PathVariable Long id) {
        try {
            watchedFolderService.deleteWatchedFolder(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{id}/scan")
    public ResponseEntity<Map<String, Integer>> scanNow(@PathVariable Long id) {
        try {
            int importedCount = watchedFolderService.scanNow(id);
            return ResponseEntity.ok(Map.of("importedCount", importedCount));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    private WatchedFolderDto convertToDto(WatchedFolder watchedFolder) {
        return WatchedFolderDto.builder()
                .id(watchedFolder.getId())
                .folderPath(watchedFolder.getFolderPath())
                .isActive(watchedFolder.getIsActive())
                .recursiveScan(watchedFolder.getRecursiveScan())
                .autoImport(watchedFolder.getAutoImport())
                .lastScan(watchedFolder.getLastScan())
                .scanIntervalMinutes(watchedFolder.getScanIntervalMinutes())
                .createdAt(watchedFolder.getCreatedAt())
                .updatedAt(watchedFolder.getUpdatedAt())
                .build();
    }
}
