package com.memzy.service;

import com.memzy.model.MediaFile;
import com.memzy.model.User;
import com.memzy.model.WatchedFolder;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.WatchedFolderRepository;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@Service
public class FolderScanService {

    private static final Logger logger = LoggerFactory.getLogger(FolderScanService.class);

    @org.springframework.beans.factory.annotation.Value("${memzy.storage.original-path}")
    private String originalPath;

    @Autowired
    private WatchedFolderRepository watchedFolderRepository;

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private ThumbnailService thumbnailService;

    @Autowired
    private MetadataExtractionService metadataExtractionService;

    private final Tika tika = new Tika();

    private static final Set<String> SUPPORTED_IMAGE_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"
    );

    private static final Set<String> SUPPORTED_VIDEO_EXTENSIONS = Set.of(
            "mp4", "avi", "mov", "mkv", "webm", "flv", "wmv"
    );

    @Scheduled(fixedDelay = 300000) // Run every 5 minutes
    @Transactional
    public void scanAllWatchedFolders() {
        logger.info("Starting scheduled folder scan");
        List<WatchedFolder> watchedFolders = watchedFolderRepository.findAll();

        for (WatchedFolder watchedFolder : watchedFolders) {
            if (watchedFolder.getIsActive() && watchedFolder.getAutoImport()) {
                try {
                    scanFolder(watchedFolder);
                } catch (Exception e) {
                    logger.error("Error scanning folder: {}", watchedFolder.getFolderPath(), e);
                }
            }
        }

        logger.info("Scheduled folder scan completed");
    }

    @Transactional
    public int scanFolder(WatchedFolder watchedFolder) throws IOException {
        logger.info("Scanning folder: {}", watchedFolder.getFolderPath());

        Path folderPath = Paths.get(watchedFolder.getFolderPath());
        if (!Files.exists(folderPath) || !Files.isDirectory(folderPath)) {
            logger.warn("Folder does not exist or is not a directory: {}", watchedFolder.getFolderPath());
            return 0;
        }

        int importedCount = 0;
        User user = watchedFolder.getUser();

        try (Stream<Path> paths = watchedFolder.getRecursiveScan()
                ? Files.walk(folderPath)
                : Files.list(folderPath)) {

            List<Path> filePaths = paths
                    .filter(Files::isRegularFile)
                    .filter(this::isSupportedFile)
                    .toList();

            for (Path filePath : filePaths) {
                try {
                    if (importFile(filePath.toFile(), user)) {
                        importedCount++;
                    }
                } catch (Exception e) {
                    logger.error("Error importing file: {}", filePath, e);
                }
            }
        }

        watchedFolder.setLastScan(LocalDateTime.now());
        watchedFolderRepository.save(watchedFolder);

        logger.info("Folder scan completed. Imported {} files from {}", importedCount, watchedFolder.getFolderPath());
        return importedCount;
    }

    private boolean isSupportedFile(Path path) {
        String fileName = path.getFileName().toString().toLowerCase();
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1);
        return SUPPORTED_IMAGE_EXTENSIONS.contains(extension) ||
               SUPPORTED_VIDEO_EXTENSIONS.contains(extension);
    }

    private boolean importFile(File file, User user) throws IOException {
        // Generate file hash
        byte[] fileBytes = Files.readAllBytes(file.toPath());
        String fileHash = generateFileHash(fileBytes);

        // Check if file already exists
        Optional<MediaFile> existing = mediaFileRepository.findByFileHash(fileHash);
        if (existing.isPresent() && !existing.get().getIsDeleted()) {
            logger.debug("File already exists: {}", file.getName());
            return false;
        }

        // Detect MIME type
        String mimeType = tika.detect(fileBytes);
        MediaFile.MediaType mediaType = determineMediaType(mimeType);

        // Copy file to storage
        String originalFileName = file.getName();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String savedFileName = UUID.randomUUID().toString() + fileExtension;
        Path destinationPath = Paths.get(originalPath, savedFileName);
        Files.copy(file.toPath(), destinationPath);

        // Create MediaFile entity
        MediaFile mediaFile = MediaFile.builder()
                .fileName(originalFileName)
                .filePath(destinationPath.toString())
                .fileSize(file.length())
                .mimeType(mimeType)
                .mediaType(mediaType)
                .fileHash(fileHash)
                .owner(user)
                .isFavorite(false)
                .isDeleted(false)
                .viewCount(0L)
                .build();

        // Extract metadata and generate thumbnails
        File savedFile = destinationPath.toFile();

        if (mediaType == MediaFile.MediaType.IMAGE) {
            Map<String, Object> metadata = metadataExtractionService.extractImageMetadata(savedFile);
            applyMetadata(mediaFile, metadata);

            try {
                Map<Integer, String> thumbnails = thumbnailService.generateThumbnails(savedFile, fileHash);
                mediaFile.setThumbnailPath(thumbnails.get(300));
            } catch (IOException e) {
                logger.error("Failed to generate thumbnails for: {}", originalFileName, e);
            }
        } else if (mediaType == MediaFile.MediaType.VIDEO) {
            Map<String, Object> metadata = metadataExtractionService.extractVideoMetadata(savedFile);
            applyMetadata(mediaFile, metadata);

            try {
                String videoThumbnail = thumbnailService.generateVideoThumbnail(savedFile, fileHash);
                mediaFile.setThumbnailPath(videoThumbnail);
            } catch (IOException e) {
                logger.error("Failed to generate video thumbnail for: {}", originalFileName, e);
            }
        }

        mediaFileRepository.save(mediaFile);
        logger.info("Imported file: {}", originalFileName);
        return true;
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
}
