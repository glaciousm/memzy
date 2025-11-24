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
        Map<Integer, String> thumbnailPaths = new HashMap<>();

        for (Integer size : thumbnailSizes) {
            try {
                String thumbnailFileName = fileHash + "_" + size + ".jpg";
                Path thumbnailDir = Paths.get(thumbnailBasePath, String.valueOf(size));
                Path thumbnailPath = thumbnailDir.resolve(thumbnailFileName);

                // Create thumbnail directory if it doesn't exist
                thumbnailDir.toFile().mkdirs();

                // Use FFmpeg to extract frame at 1 second
                ProcessBuilder processBuilder = new ProcessBuilder(
                        "ffmpeg",
                        "-i", videoFile.getAbsolutePath(),
                        "-ss", "00:00:01.000",
                        "-vframes", "1",
                        "-vf", "scale=" + size + ":" + size + ":force_original_aspect_ratio=decrease",
                        "-y",
                        thumbnailPath.toString()
                );

                processBuilder.redirectErrorStream(true);
                Process process = processBuilder.start();

                int exitCode = process.waitFor();
                if (exitCode == 0) {
                    thumbnailPaths.put(size, thumbnailPath.toString());
                    logger.debug("Generated video thumbnail: {} for size: {}", thumbnailPath, size);
                } else {
                    logger.error("FFmpeg failed with exit code: {} for file: {}", exitCode, videoFile.getName());
                }
            } catch (IOException | InterruptedException e) {
                logger.error("Failed to generate video thumbnail for size: {}", size, e);
                // Continue with other sizes even if one fails
            }
        }

        // Return the 300px thumbnail path as default
        String defaultThumbnailPath = thumbnailPaths.get(300);
        if (defaultThumbnailPath != null) {
            return defaultThumbnailPath;
        }

        // If 300px failed, return any available thumbnail
        return thumbnailPaths.values().stream().findFirst().orElseThrow(() ->
                new IOException("Failed to generate any video thumbnails for: " + videoFile.getName())
        );
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
