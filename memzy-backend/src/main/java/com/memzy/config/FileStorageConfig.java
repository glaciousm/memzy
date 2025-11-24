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

    @Value("${memzy.storage.thumbnail-path}")
    private String thumbnailPath;

    @Value("${memzy.storage.temp-path}")
    private String tempPath;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(thumbnailPath));
            Files.createDirectories(Paths.get(tempPath));
            Files.createDirectories(Paths.get("./storage/original"));
            Files.createDirectories(Paths.get("./storage/thumbnails/150"));
            Files.createDirectories(Paths.get("./storage/thumbnails/300"));
            Files.createDirectories(Paths.get("./storage/thumbnails/600"));
            Files.createDirectories(Paths.get("./storage/thumbnails/1200"));
        } catch (IOException e) {
            throw new RuntimeException("Could not create storage directories!", e);
        }
    }

    public Path getThumbnailPath() {
        return Paths.get(thumbnailPath);
    }

    public Path getTempPath() {
        return Paths.get(tempPath);
    }
}
