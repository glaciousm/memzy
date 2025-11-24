package com.memzy.controller;

import com.memzy.dto.ImageEditRequest;
import com.memzy.dto.MediaFileDto;
import com.memzy.model.MediaFile;
import com.memzy.model.User;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.UserRepository;
import com.memzy.service.ImageEditingService;
import com.memzy.service.MediaFileService;
import com.memzy.service.MetadataExtractionService;
import com.memzy.service.ThumbnailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/image-editing")
public class ImageEditingController {

    private static final Logger logger = LoggerFactory.getLogger(ImageEditingController.class);

    @Autowired
    private ImageEditingService imageEditingService;

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ThumbnailService thumbnailService;

    @Autowired
    private MetadataExtractionService metadataExtractionService;

    @Autowired
    private MediaFileService mediaFileService;

    @PostMapping("/edit")
    public ResponseEntity<?> editImage(@RequestBody ImageEditRequest request) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get original media file
            MediaFile originalMedia = mediaFileRepository.findById(request.getMediaFileId())
                    .orElseThrow(() -> new RuntimeException("Media file not found"));

            // Check ownership
            if (!originalMedia.getOwner().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }

            // Get original file
            File originalFile = new File(originalMedia.getFilePath());
            if (!originalFile.exists()) {
                return ResponseEntity.status(404).body(Map.of("error", "Original file not found"));
            }

            File editedFile = null;

            // Apply requested edit
            switch (request.getEditType().toLowerCase()) {
                case "crop":
                    editedFile = imageEditingService.cropImage(
                            originalFile,
                            request.getCropX(),
                            request.getCropY(),
                            request.getCropWidth(),
                            request.getCropHeight()
                    );
                    break;

                case "rotate":
                    editedFile = imageEditingService.rotateImage(
                            originalFile,
                            request.getRotateDegrees()
                    );
                    break;

                case "flip":
                    editedFile = imageEditingService.flipImage(
                            originalFile,
                            request.getFlipHorizontal()
                    );
                    break;

                case "brightness":
                    editedFile = imageEditingService.adjustBrightness(
                            originalFile,
                            request.getBrightness()
                    );
                    break;

                case "contrast":
                    editedFile = imageEditingService.adjustContrast(
                            originalFile,
                            request.getContrast()
                    );
                    break;

                case "filter":
                    if ("grayscale".equalsIgnoreCase(request.getFilterType())) {
                        editedFile = imageEditingService.applyGrayscaleFilter(originalFile);
                    } else if ("sepia".equalsIgnoreCase(request.getFilterType())) {
                        editedFile = imageEditingService.applySepiaFilter(originalFile);
                    } else {
                        return ResponseEntity.badRequest().body(Map.of("error", "Unknown filter type"));
                    }
                    break;

                case "resize":
                    editedFile = imageEditingService.resizeImage(
                            originalFile,
                            request.getResizeWidth(),
                            request.getResizeHeight()
                    );
                    break;

                default:
                    return ResponseEntity.badRequest().body(Map.of("error", "Unknown edit type"));
            }

            // Generate file hash
            byte[] fileBytes = Files.readAllBytes(editedFile.toPath());
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(fileBytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String fileHash = hexString.toString();

            // Create new media file entry
            MediaFile newMedia = MediaFile.builder()
                    .fileName("edited_" + originalMedia.getFileName())
                    .filePath(editedFile.getAbsolutePath())
                    .fileSize(editedFile.length())
                    .mimeType("image/jpeg")
                    .mediaType(MediaFile.MediaType.IMAGE)
                    .fileHash(fileHash)
                    .owner(user)
                    .isFavorite(false)
                    .isDeleted(false)
                    .viewCount(0)
                    .build();

            // Generate thumbnails
            Map<Integer, String> thumbnails = thumbnailService.generateThumbnails(editedFile, fileHash);
            if (!thumbnails.isEmpty()) {
                newMedia.setThumbnailPath(fileHash);
            }

            // Extract metadata
            Map<String, Object> metadata = metadataExtractionService.extractImageMetadata(editedFile);
            if (metadata.containsKey("width")) {
                newMedia.setWidth((Integer) metadata.get("width"));
            }
            if (metadata.containsKey("height")) {
                newMedia.setHeight((Integer) metadata.get("height"));
            }

            // Save to database
            newMedia = mediaFileRepository.save(newMedia);

            // Convert to DTO
            MediaFileDto dto = mediaFileService.convertToDto(newMedia);

            return ResponseEntity.ok(Map.of(
                    "message", "Image edited successfully",
                    "mediaFile", dto
            ));

        } catch (Exception e) {
            logger.error("Failed to edit image", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
