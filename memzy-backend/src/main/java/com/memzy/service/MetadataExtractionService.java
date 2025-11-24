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

import java.io.File;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

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

        // TODO: Implement video metadata extraction with FFmpeg or similar
        logger.warn("Video metadata extraction not yet implemented for: {}", file.getName());

        return metadata;
    }
}
