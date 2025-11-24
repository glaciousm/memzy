package com.memzy.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @GetMapping("/thumbnails/{size}/{filename}")
    public ResponseEntity<Resource> getThumbnail(
            @PathVariable String size,
            @PathVariable String filename
    ) {
        try {
            Path filePath = Paths.get("./storage/thumbnails", size, filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=31536000")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/original/{filename}")
    public ResponseEntity<Resource> getOriginalFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("./storage/original", filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Detect content type from filename
                String contentType = "application/octet-stream";
                String lowerFilename = filename.toLowerCase();

                if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else if (lowerFilename.endsWith(".png")) {
                    contentType = "image/png";
                } else if (lowerFilename.endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (lowerFilename.endsWith(".webp")) {
                    contentType = "image/webp";
                } else if (lowerFilename.endsWith(".mp4")) {
                    contentType = "video/mp4";
                } else if (lowerFilename.endsWith(".avi")) {
                    contentType = "video/x-msvideo";
                } else if (lowerFilename.endsWith(".mov")) {
                    contentType = "video/quicktime";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=31536000")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
