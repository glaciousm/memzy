package com.memzy.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    @Value("${memzy.storage.original-path}")
    private String originalPath;

    @Value("${memzy.storage.thumbnail-path}")
    private String thumbnailPath;

    @Value("${memzy.storage.temp-path}")
    private String tempPath;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(originalPath));
            Files.createDirectories(Paths.get(thumbnailPath));
            Files.createDirectories(Paths.get(tempPath));
            Files.createDirectories(Paths.get(thumbnailPath, "150"));
            Files.createDirectories(Paths.get(thumbnailPath, "300"));
            Files.createDirectories(Paths.get(thumbnailPath, "600"));
            Files.createDirectories(Paths.get(thumbnailPath, "1200"));
        } catch (IOException e) {
            throw new RuntimeException("Could not create storage directories!", e);
        }
    }

    public Path getOriginalPath() {
        return Paths.get(originalPath);
    }

    public Path getThumbnailPath() {
        return Paths.get(thumbnailPath);
    }

    public Path getTempPath() {
        return Paths.get(tempPath);
    }
}
