package com.memzy.service;

import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ThumbnailService {

    private static final Logger logger = LoggerFactory.getLogger(ThumbnailService.class);

    @Value("${memzy.storage.thumbnail-path}")
    private String thumbnailBasePath;

    @Value("${memzy.media.thumbnail-sizes}")
    private List<Integer> thumbnailSizes;

    public Map<Integer, String> generateThumbnails(File sourceFile, String fileHash) throws IOException {
        Map<Integer, String> thumbnailPaths = new HashMap<>();

        for (Integer size : thumbnailSizes) {
            try {
                String thumbnailFileName = fileHash + "_" + size + ".jpg";
                Path thumbnailDir = Paths.get(thumbnailBasePath, String.valueOf(size));
                Path thumbnailPath = thumbnailDir.resolve(thumbnailFileName);

                Thumbnails.of(sourceFile)
                        .size(size, size)
                        .outputFormat("jpg")
                        .outputQuality(0.85)
                        .toFile(thumbnailPath.toFile());

                thumbnailPaths.put(size, thumbnailPath.toString());
                logger.debug("Generated thumbnail: {} for size: {}", thumbnailPath, size);
            } catch (IOException e) {
                logger.error("Failed to generate thumbnail for size: {}", size, e);
                throw e;
            }
        }

        return thumbnailPaths;
    }

    public String generateVideoThumbnail(File videoFile, String fileHash) throws IOException {
        // For now, return a placeholder path
        // TODO: Implement FFmpeg integration for video thumbnail extraction
        String thumbnailFileName = fileHash + "_video_thumb.jpg";
        Path thumbnailPath = Paths.get(thumbnailBasePath, "300", thumbnailFileName);

        // Placeholder implementation - will be replaced with FFmpeg
        logger.warn("Video thumbnail generation not yet implemented for: {}", videoFile.getName());

        return thumbnailPath.toString();
    }

    public void deleteThumbnails(String fileHash) {
        for (Integer size : thumbnailSizes) {
            try {
                String thumbnailFileName = fileHash + "_" + size + ".jpg";
                Path thumbnailPath = Paths.get(thumbnailBasePath, String.valueOf(size), thumbnailFileName);
                File thumbnailFile = thumbnailPath.toFile();

                if (thumbnailFile.exists()) {
                    thumbnailFile.delete();
                    logger.debug("Deleted thumbnail: {}", thumbnailPath);
                }
            } catch (Exception e) {
                logger.error("Failed to delete thumbnail for hash: {} and size: {}", fileHash, size, e);
            }
        }
    }
}
