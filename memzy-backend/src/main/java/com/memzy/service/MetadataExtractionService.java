package com.memzy.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MetadataExtractionService {

    private static final Logger logger = LoggerFactory.getLogger(MetadataExtractionService.class);

    public Map<String, Object> extractImageMetadata(File file) {
        Map<String, Object> metadata = new HashMap<>();

        try {
            Metadata imageMetadata = ImageMetadataReader.readMetadata(file);

            // Extract camera information
            ExifIFD0Directory exifIFD0 = imageMetadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (exifIFD0 != null) {
                String make = exifIFD0.getString(ExifIFD0Directory.TAG_MAKE);
                String model = exifIFD0.getString(ExifIFD0Directory.TAG_MODEL);

                if (make != null) metadata.put("cameraMake", make.trim());
                if (model != null) metadata.put("cameraModel", model.trim());
            }

            // Extract date taken
            ExifSubIFDDirectory exifSubIFD = imageMetadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (exifSubIFD != null) {
                Date dateTaken = exifSubIFD.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL);
                if (dateTaken != null) {
                    LocalDateTime dateTime = dateTaken.toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDateTime();
                    metadata.put("dateTaken", dateTime);
                }

                // Extract image dimensions
                Integer width = exifSubIFD.getInteger(ExifSubIFDDirectory.TAG_EXIF_IMAGE_WIDTH);
                Integer height = exifSubIFD.getInteger(ExifSubIFDDirectory.TAG_EXIF_IMAGE_HEIGHT);

                if (width != null) metadata.put("width", width);
                if (height != null) metadata.put("height", height);
            }

            // Extract GPS information
            GpsDirectory gpsDirectory = imageMetadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gpsDirectory != null) {
                var geoLocation = gpsDirectory.getGeoLocation();
                if (geoLocation != null) {
                    metadata.put("latitude", geoLocation.getLatitude());
                    metadata.put("longitude", geoLocation.getLongitude());
                }
            }

            // Extract all EXIF tags for additional metadata
            Map<String, String> exifData = new HashMap<>();
            for (Directory directory : imageMetadata.getDirectories()) {
                for (Tag tag : directory.getTags()) {
                    exifData.put(tag.getTagName(), tag.getDescription());
                }
            }
            metadata.put("exifData", exifData);

            logger.debug("Extracted metadata from: {}", file.getName());

        } catch (Exception e) {
            logger.error("Failed to extract metadata from: {}", file.getName(), e);
        }

        return metadata;
    }

    public Map<String, Object> extractVideoMetadata(File file) {
        Map<String, Object> metadata = new HashMap<>();

        try {
            // Use ffprobe to extract video metadata
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "ffprobe",
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_format",
                    "-show_streams",
                    file.getAbsolutePath()
            );

            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                String jsonOutput = output.toString();

                // Parse duration (in seconds)
                Pattern durationPattern = Pattern.compile("\"duration\"\\s*:\\s*\"([0-9.]+)\"");
                Matcher durationMatcher = durationPattern.matcher(jsonOutput);
                if (durationMatcher.find()) {
                    try {
                        double durationSeconds = Double.parseDouble(durationMatcher.group(1));
                        metadata.put("duration", (int) durationSeconds);
                    } catch (NumberFormatException e) {
                        logger.warn("Failed to parse duration for: {}", file.getName());
                    }
                }

                // Parse video dimensions
                Pattern widthPattern = Pattern.compile("\"width\"\\s*:\\s*([0-9]+)");
                Pattern heightPattern = Pattern.compile("\"height\"\\s*:\\s*([0-9]+)");

                Matcher widthMatcher = widthPattern.matcher(jsonOutput);
                Matcher heightMatcher = heightPattern.matcher(jsonOutput);

                if (widthMatcher.find()) {
                    metadata.put("width", Integer.parseInt(widthMatcher.group(1)));
                }
                if (heightMatcher.find()) {
                    metadata.put("height", Integer.parseInt(heightMatcher.group(1)));
                }

                // Parse codec information
                Pattern codecPattern = Pattern.compile("\"codec_name\"\\s*:\\s*\"([^\"]+)\"");
                Matcher codecMatcher = codecPattern.matcher(jsonOutput);
                if (codecMatcher.find()) {
                    metadata.put("codecName", codecMatcher.group(1));
                }

                // Parse bitrate
                Pattern bitratePattern = Pattern.compile("\"bit_rate\"\\s*:\\s*\"([0-9]+)\"");
                Matcher bitrateMatcher = bitratePattern.matcher(jsonOutput);
                if (bitrateMatcher.find()) {
                    try {
                        long bitrate = Long.parseLong(bitrateMatcher.group(1));
                        metadata.put("bitrate", bitrate / 1000); // Convert to kbps
                    } catch (NumberFormatException e) {
                        logger.warn("Failed to parse bitrate for: {}", file.getName());
                    }
                }

                logger.debug("Extracted video metadata from: {}", file.getName());
            } else {
                logger.error("FFprobe failed with exit code: {} for file: {}", exitCode, file.getName());
            }

        } catch (Exception e) {
            logger.error("Failed to extract video metadata from: {}", file.getName(), e);
        }

        return metadata;
    }
}
