package com.memzy.service;

import net.coobird.thumbnailator.Thumbnails;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
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

        // Extract a frame from the video using JavaCV (bundled FFmpeg)
        BufferedImage frame = extractVideoFrame(videoFile);
        if (frame == null) {
            throw new IOException("Failed to extract frame from video: " + videoFile.getName());
        }

        // Generate thumbnails at all sizes from the extracted frame
        for (Integer size : thumbnailSizes) {
            try {
                String thumbnailFileName = fileHash + "_" + size + ".jpg";
                Path thumbnailDir = Paths.get(thumbnailBasePath, String.valueOf(size));
                Path thumbnailPath = thumbnailDir.resolve(thumbnailFileName);

                // Create thumbnail directory if it doesn't exist
                thumbnailDir.toFile().mkdirs();

                // Use Thumbnailator to resize the frame
                Thumbnails.of(frame)
                        .size(size, size)
                        .outputFormat("jpg")
                        .outputQuality(0.85)
                        .toFile(thumbnailPath.toFile());

                thumbnailPaths.put(size, thumbnailPath.toString());
                logger.debug("Generated video thumbnail: {} for size: {}", thumbnailPath, size);
            } catch (IOException e) {
                logger.error("Failed to generate video thumbnail for size: {}", size, e);
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

    /**
     * Extract a frame from the video at approximately 1 second (or 10% into the video if shorter).
     * Uses JavaCV with bundled FFmpeg - no external FFmpeg installation required.
     */
    private BufferedImage extractVideoFrame(File videoFile) {
        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(videoFile)) {
            grabber.start();

            // Get video duration and calculate target timestamp
            long durationMicros = grabber.getLengthInTime();
            long targetTimestamp;

            if (durationMicros > 1_000_000) {
                // If video is longer than 1 second, grab frame at 1 second
                targetTimestamp = 1_000_000;
            } else {
                // For very short videos, grab frame at 10% of duration
                targetTimestamp = durationMicros / 10;
            }

            // Seek to target timestamp
            grabber.setTimestamp(targetTimestamp);

            // Grab a video frame (skip audio frames)
            Frame frame;
            Java2DFrameConverter converter = new Java2DFrameConverter();

            while ((frame = grabber.grabImage()) != null) {
                if (frame.image != null) {
                    BufferedImage image = converter.convert(frame);
                    if (image != null) {
                        logger.debug("Extracted frame from video: {} at timestamp: {}μs",
                                videoFile.getName(), targetTimestamp);
                        return image;
                    }
                }
            }

            // If seeking didn't work, try grabbing the first frame
            grabber.setTimestamp(0);
            frame = grabber.grabImage();
            if (frame != null && frame.image != null) {
                return converter.convert(frame);
            }

            logger.error("Could not extract any frame from video: {}", videoFile.getName());
            return null;
        } catch (Exception e) {
            logger.error("Error extracting frame from video: {}", videoFile.getName(), e);
            return null;
        }
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
