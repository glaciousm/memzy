package com.memzy.service;

import com.memzy.dto.MediaFileDto;
import com.memzy.dto.SimpleAlbumDto;
import com.memzy.dto.TagDto;
import com.memzy.model.MediaFile;
import com.memzy.model.Tag;
import com.memzy.model.User;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.TagRepository;
import com.memzy.repository.UserRepository;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MediaFileService {

    private static final Logger logger = LoggerFactory.getLogger(MediaFileService.class);

    @org.springframework.beans.factory.annotation.Value("${memzy.storage.original-path}")
    private String originalPath;

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ThumbnailService thumbnailService;

    @Autowired
    private MetadataExtractionService metadataExtractionService;

    @Autowired
    private FaceDetectionService faceDetectionService;

    @Autowired
    private TagRepository tagRepository;

    private final Tika tika = new Tika();

    @Transactional
    public MediaFileDto uploadMedia(MultipartFile file) throws IOException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate file hash for duplicate detection
        String fileHash = generateFileHash(file.getBytes());

        // Check for duplicates
        MediaFile existingFile = mediaFileRepository.findByFileHash(fileHash).orElse(null);
        if (existingFile != null && !existingFile.getIsDeleted()) {
            logger.info("Duplicate file detected: {}", file.getOriginalFilename());
            return convertToDto(existingFile);
        }

        // Detect MIME type
        String mimeType = tika.detect(file.getBytes());
        MediaFile.MediaType mediaType = determineMediaType(mimeType);

        // Save original file
        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String savedFileName = UUID.randomUUID().toString() + fileExtension;
        Path originalFilePath = Paths.get(originalPath, savedFileName);
        Files.write(originalFilePath, file.getBytes());

        // Create MediaFile entity
        MediaFile mediaFile = MediaFile.builder()
                .fileName(originalFileName)
                .filePath(originalFilePath.toString())
                .fileSize(file.getSize())
                .mimeType(mimeType)
                .mediaType(mediaType)
                .fileHash(fileHash)
                .owner(user)
                .isFavorite(false)
                .isDeleted(false)
                .viewCount(0L)
                .build();

        // Extract metadata and generate thumbnails based on media type
        File savedFile = originalFilePath.toFile();

        if (mediaType == MediaFile.MediaType.IMAGE) {
            // Extract image metadata
            Map<String, Object> metadata = metadataExtractionService.extractImageMetadata(savedFile);
            applyMetadata(mediaFile, metadata);

            // Generate thumbnails
            try {
                Map<Integer, String> thumbnails = thumbnailService.generateThumbnails(savedFile, fileHash);
                mediaFile.setThumbnailPath(thumbnails.get(300)); // Use 300px as default thumbnail
            } catch (IOException e) {
                logger.error("Failed to generate thumbnails for: {}", originalFileName, e);
            }
        } else if (mediaType == MediaFile.MediaType.VIDEO) {
            // Extract video metadata
            Map<String, Object> metadata = metadataExtractionService.extractVideoMetadata(savedFile);
            applyMetadata(mediaFile, metadata);

            // Generate video thumbnail
            try {
                String videoThumbnail = thumbnailService.generateVideoThumbnail(savedFile, fileHash);
                mediaFile.setThumbnailPath(videoThumbnail);
            } catch (IOException e) {
                logger.error("Failed to generate video thumbnail for: {}", originalFileName, e);
            }
        }

        mediaFile = mediaFileRepository.save(mediaFile);
        logger.info("Media file uploaded: {} by user: {}", originalFileName, username);

        // Trigger face detection for images (async)
        if (mediaType == MediaFile.MediaType.IMAGE) {
            faceDetectionService.detectFaces(mediaFile);
        }

        return convertToDto(mediaFile);
    }

    @Transactional(readOnly = true)
    public Page<MediaFileDto> getUserMedia(Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<MediaFile> mediaFiles = mediaFileRepository.findByOwnerAndIsDeletedFalse(user, pageable);

        // Fetch tags for each media using native query
        return mediaFiles.map(mediaFile -> {
            var tags = tagRepository.findTagsByMediaId(mediaFile.getId());
            return convertToDtoWithTags(mediaFile, tags);
        });
    }

    @Transactional
    public MediaFileDto getMediaById(Long id) {
        MediaFile mediaFile = mediaFileRepository.findByIdWithTagsAndAlbums(id)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        // Increment view count
        mediaFile.setViewCount(mediaFile.getViewCount() + 1);
        mediaFile.setLastViewed(LocalDateTime.now());
        mediaFileRepository.save(mediaFile);

        // Fetch tags using native query as workaround for JPA relationship loading issue
        var tags = tagRepository.findTagsByMediaId(id);
        logger.info("Fetched {} tags for media {} using native query", tags.size(), id);

        return convertToDtoWithTags(mediaFile, tags);
    }

    @Transactional
    public void deleteMedia(Long id) {
        MediaFile mediaFile = mediaFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!mediaFile.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to delete this media");
        }

        // Soft delete
        mediaFile.setIsDeleted(true);
        mediaFile.setDeletedAt(LocalDateTime.now());
        mediaFileRepository.save(mediaFile);

        logger.info("Media file soft deleted: {} by user: {}", mediaFile.getFileName(), username);
    }

    @Transactional
    public MediaFileDto toggleFavorite(Long id) {
        MediaFile mediaFile = mediaFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        mediaFile.setIsFavorite(!mediaFile.getIsFavorite());
        mediaFile = mediaFileRepository.save(mediaFile);

        var tags = tagRepository.findTagsByMediaId(id);
        return convertToDtoWithTags(mediaFile, tags);
    }

    private String generateFileHash(byte[] fileBytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fileBytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            logger.error("Failed to generate file hash", e);
            return UUID.randomUUID().toString();
        }
    }

    private MediaFile.MediaType determineMediaType(String mimeType) {
        if (mimeType.startsWith("image/")) {
            return MediaFile.MediaType.IMAGE;
        } else if (mimeType.startsWith("video/")) {
            return MediaFile.MediaType.VIDEO;
        }
        throw new RuntimeException("Unsupported media type: " + mimeType);
    }

    private void applyMetadata(MediaFile mediaFile, Map<String, Object> metadata) {
        if (metadata.containsKey("width")) {
            mediaFile.setWidth((Integer) metadata.get("width"));
        }
        if (metadata.containsKey("height")) {
            mediaFile.setHeight((Integer) metadata.get("height"));
        }
        if (metadata.containsKey("dateTaken")) {
            mediaFile.setDateTaken((LocalDateTime) metadata.get("dateTaken"));
        }
        if (metadata.containsKey("latitude")) {
            mediaFile.setLatitude((Double) metadata.get("latitude"));
        }
        if (metadata.containsKey("longitude")) {
            mediaFile.setLongitude((Double) metadata.get("longitude"));
        }
        if (metadata.containsKey("cameraMake")) {
            mediaFile.setCameraMake((String) metadata.get("cameraMake"));
        }
        if (metadata.containsKey("cameraModel")) {
            mediaFile.setCameraModel((String) metadata.get("cameraModel"));
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStorageStats() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get total counts and sizes
        long totalFiles = mediaFileRepository.countByOwnerAndIsDeletedFalse(user);
        Long totalSize = mediaFileRepository.sumFileSizeByOwnerAndIsDeletedFalse(user);
        if (totalSize == null) totalSize = 0L;

        long imageCount = mediaFileRepository.countByOwnerAndMediaTypeAndIsDeletedFalse(user, MediaFile.MediaType.IMAGE);
        long videoCount = mediaFileRepository.countByOwnerAndMediaTypeAndIsDeletedFalse(user, MediaFile.MediaType.VIDEO);
        long favoriteCount = mediaFileRepository.countByOwnerAndIsFavoriteTrueAndIsDeletedFalse(user);
        long trashedCount = mediaFileRepository.countByOwnerAndIsDeletedTrue(user);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFiles", totalFiles);
        stats.put("totalSizeBytes", totalSize);
        stats.put("totalSizeFormatted", formatBytes(totalSize));
        stats.put("imageCount", imageCount);
        stats.put("videoCount", videoCount);
        stats.put("favoriteCount", favoriteCount);
        stats.put("trashedCount", trashedCount);

        return stats;
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }

    /**
     * Regenerate thumbnails for videos that are missing them.
     * This is useful after adding JavaCV support for video thumbnail generation.
     */
    @Transactional
    public Map<String, Object> regenerateMissingVideoThumbnails() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find all videos without thumbnails
        var videosWithoutThumbnails = mediaFileRepository.findByOwnerAndMediaTypeAndThumbnailPathIsNullAndIsDeletedFalse(
                user, MediaFile.MediaType.VIDEO);

        int successCount = 0;
        int failCount = 0;

        for (MediaFile video : videosWithoutThumbnails) {
            try {
                File videoFile = new File(video.getFilePath());
                if (videoFile.exists()) {
                    String thumbnailPath = thumbnailService.generateVideoThumbnail(videoFile, video.getFileHash());
                    video.setThumbnailPath(thumbnailPath);
                    mediaFileRepository.save(video);
                    successCount++;
                    logger.info("Generated thumbnail for video: {}", video.getFileName());
                } else {
                    logger.warn("Video file not found: {}", video.getFilePath());
                    failCount++;
                }
            } catch (Exception e) {
                logger.error("Failed to generate thumbnail for video: {}", video.getFileName(), e);
                failCount++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", videosWithoutThumbnails.size());
        result.put("success", successCount);
        result.put("failed", failCount);
        return result;
    }

    public MediaFileDto convertToDto(MediaFile mediaFile) {
        return MediaFileDto.builder()
                .id(mediaFile.getId())
                .fileName(mediaFile.getFileName())
                .filePath(mediaFile.getFilePath())
                .fileSize(mediaFile.getFileSize())
                .mimeType(mediaFile.getMimeType())
                .mediaType(mediaFile.getMediaType())
                .width(mediaFile.getWidth())
                .height(mediaFile.getHeight())
                .duration(mediaFile.getDuration())
                .thumbnailPath(mediaFile.getThumbnailPath())
                .dateTaken(mediaFile.getDateTaken())
                .isFavorite(mediaFile.getIsFavorite())
                .latitude(mediaFile.getLatitude())
                .longitude(mediaFile.getLongitude())
                .locationName(mediaFile.getLocationName())
                .cameraMake(mediaFile.getCameraMake())
                .cameraModel(mediaFile.getCameraModel())
                .createdAt(mediaFile.getCreatedAt())
                .updatedAt(mediaFile.getUpdatedAt())
                .viewCount(mediaFile.getViewCount())
                .tags(mediaFile.getTags().stream()
                        .map(tag -> TagDto.builder()
                                .id(tag.getId())
                                .name(tag.getName())
                                .colorCode(tag.getColorCode())
                                .description(tag.getDescription())
                                .usageCount(tag.getUsageCount())
                                .createdAt(tag.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .albums(mediaFile.getAlbums().stream()
                        .map(album -> SimpleAlbumDto.builder()
                                .id(album.getId())
                                .name(album.getName())
                                .coverImageUrl(album.getCoverImageUrl())
                                .albumType(album.getAlbumType())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    public MediaFileDto convertToDtoWithTags(MediaFile mediaFile, java.util.List<Tag> tags) {
        return MediaFileDto.builder()
                .id(mediaFile.getId())
                .fileName(mediaFile.getFileName())
                .filePath(mediaFile.getFilePath())
                .fileSize(mediaFile.getFileSize())
                .mimeType(mediaFile.getMimeType())
                .mediaType(mediaFile.getMediaType())
                .width(mediaFile.getWidth())
                .height(mediaFile.getHeight())
                .duration(mediaFile.getDuration())
                .thumbnailPath(mediaFile.getThumbnailPath())
                .dateTaken(mediaFile.getDateTaken())
                .isFavorite(mediaFile.getIsFavorite())
                .latitude(mediaFile.getLatitude())
                .longitude(mediaFile.getLongitude())
                .locationName(mediaFile.getLocationName())
                .cameraMake(mediaFile.getCameraMake())
                .cameraModel(mediaFile.getCameraModel())
                .createdAt(mediaFile.getCreatedAt())
                .updatedAt(mediaFile.getUpdatedAt())
                .viewCount(mediaFile.getViewCount())
                .tags(tags.stream()
                        .map(tag -> TagDto.builder()
                                .id(tag.getId())
                                .name(tag.getName())
                                .colorCode(tag.getColorCode())
                                .description(tag.getDescription())
                                .usageCount(tag.getUsageCount())
                                .createdAt(tag.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .albums(mediaFile.getAlbums().stream()
                        .map(album -> SimpleAlbumDto.builder()
                                .id(album.getId())
                                .name(album.getName())
                                .coverImageUrl(album.getCoverImageUrl())
                                .albumType(album.getAlbumType())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
