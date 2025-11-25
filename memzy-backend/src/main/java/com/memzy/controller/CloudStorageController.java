package com.memzy.controller;

import com.memzy.dto.CloudStorageDto;
import com.memzy.model.CloudStorage;
import com.memzy.model.User;
import com.memzy.repository.CloudStorageRepository;
import com.memzy.repository.UserRepository;
import com.memzy.service.GoogleDriveService;
import com.memzy.service.DropboxService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cloud")
public class CloudStorageController {

    private static final Logger logger = LoggerFactory.getLogger(CloudStorageController.class);

    @Autowired
    private GoogleDriveService googleDriveService;

    @Autowired
    private DropboxService dropboxService;

    @Autowired
    private CloudStorageRepository cloudStorageRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/google-drive/auth-url")
    public ResponseEntity<?> getGoogleDriveAuthUrl() {
        try {
            String authUrl = googleDriveService.getAuthorizationUrl();
            return ResponseEntity.ok(Map.of("authUrl", authUrl));
        } catch (Exception e) {
            logger.error("Failed to get Google Drive auth URL", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/google-drive/callback")
    public ResponseEntity<?> handleGoogleDriveCallback(@RequestParam String code) {
        try {
            CloudStorage cloudStorage = googleDriveService.handleOAuthCallback(code);
            CloudStorageDto dto = convertToDto(cloudStorage);

            return ResponseEntity.ok(Map.of(
                    "message", "Successfully connected to Google Drive",
                    "cloudStorage", dto
            ));
        } catch (Exception e) {
            logger.error("Failed to handle Google Drive callback", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dropbox/auth-url")
    public ResponseEntity<?> getDropboxAuthUrl() {
        try {
            String authUrl = dropboxService.getAuthorizationUrl();
            return ResponseEntity.ok(Map.of("authUrl", authUrl));
        } catch (Exception e) {
            logger.error("Failed to get Dropbox auth URL", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dropbox/callback")
    public ResponseEntity<?> handleDropboxCallback(@RequestParam String code) {
        try {
            CloudStorage cloudStorage = dropboxService.handleOAuthCallback(code);
            CloudStorageDto dto = convertToDto(cloudStorage);

            return ResponseEntity.ok(Map.of(
                    "message", "Successfully connected to Dropbox",
                    "cloudStorage", dto
            ));
        } catch (Exception e) {
            logger.error("Failed to handle Dropbox callback", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserCloudStorages() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<CloudStorage> cloudStorages = cloudStorageRepository.findByUserAndIsActiveTrue(user);

            List<CloudStorageDto> dtos = cloudStorages.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Failed to get cloud storages", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> disconnectCloudStorage(@PathVariable Long id) {
        try {
            CloudStorage cloudStorage = cloudStorageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cloud storage not found"));

            String provider = cloudStorage.getProvider();

            if ("GOOGLE_DRIVE".equals(provider)) {
                googleDriveService.disconnect(id);
            } else if ("DROPBOX".equals(provider)) {
                dropboxService.disconnect(id);
            }
            // Add OneDrive here

            return ResponseEntity.ok(Map.of("message", "Successfully disconnected from " + provider));
        } catch (Exception e) {
            logger.error("Failed to disconnect cloud storage", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/auto-sync")
    public ResponseEntity<?> toggleAutoSync(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        try {
            CloudStorage cloudStorage = cloudStorageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cloud storage not found"));

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            if (!cloudStorage.getUser().getUsername().equals(username)) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }

            Boolean autoSync = request.get("autoSync");
            cloudStorage.setAutoSync(autoSync);
            cloudStorage = cloudStorageRepository.save(cloudStorage);

            CloudStorageDto dto = convertToDto(cloudStorage);

            return ResponseEntity.ok(Map.of(
                    "message", "Auto-sync updated",
                    "cloudStorage", dto
            ));
        } catch (Exception e) {
            logger.error("Failed to toggle auto-sync", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private CloudStorageDto convertToDto(CloudStorage cloudStorage) {
        return CloudStorageDto.builder()
                .id(cloudStorage.getId())
                .provider(cloudStorage.getProvider())
                .accountEmail(cloudStorage.getAccountEmail())
                .isActive(cloudStorage.getIsActive())
                .autoSync(cloudStorage.getAutoSync())
                .syncFolderPath(cloudStorage.getSyncFolderPath())
                .lastSyncAt(cloudStorage.getLastSyncAt())
                .totalFilesUploaded(cloudStorage.getTotalFilesUploaded())
                .totalFilesDownloaded(cloudStorage.getTotalFilesDownloaded())
                .createdAt(cloudStorage.getCreatedAt())
                .build();
    }
}
