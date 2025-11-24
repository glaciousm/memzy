package com.memzy.service;

import com.memzy.model.User;
import com.memzy.model.WatchedFolder;
import com.memzy.repository.UserRepository;
import com.memzy.repository.WatchedFolderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class WatchedFolderService {

    private static final Logger logger = LoggerFactory.getLogger(WatchedFolderService.class);

    @Autowired
    private WatchedFolderRepository watchedFolderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FolderScanService folderScanService;

    @Transactional
    public WatchedFolder addWatchedFolder(String folderPath, Boolean recursiveScan, Boolean autoImport, Integer scanIntervalMinutes) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate folder path
        Path path = Paths.get(folderPath);
        if (!Files.exists(path)) {
            throw new RuntimeException("Folder does not exist: " + folderPath);
        }
        if (!Files.isDirectory(path)) {
            throw new RuntimeException("Path is not a directory: " + folderPath);
        }

        WatchedFolder watchedFolder = WatchedFolder.builder()
                .folderPath(folderPath)
                .user(user)
                .isActive(true)
                .recursiveScan(recursiveScan != null ? recursiveScan : true)
                .autoImport(autoImport != null ? autoImport : true)
                .scanIntervalMinutes(scanIntervalMinutes != null ? scanIntervalMinutes : 60)
                .build();

        watchedFolder = watchedFolderRepository.save(watchedFolder);
        logger.info("Added watched folder: {} for user: {}", folderPath, username);

        return watchedFolder;
    }

    public List<WatchedFolder> getUserWatchedFolders() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return watchedFolderRepository.findByUser(user);
    }

    public WatchedFolder getWatchedFolderById(Long id) {
        return watchedFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Watched folder not found"));
    }

    @Transactional
    public WatchedFolder updateWatchedFolder(Long id, Boolean isActive, Boolean recursiveScan, Boolean autoImport, Integer scanIntervalMinutes) {
        WatchedFolder watchedFolder = watchedFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Watched folder not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!watchedFolder.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to update this watched folder");
        }

        if (isActive != null) watchedFolder.setIsActive(isActive);
        if (recursiveScan != null) watchedFolder.setRecursiveScan(recursiveScan);
        if (autoImport != null) watchedFolder.setAutoImport(autoImport);
        if (scanIntervalMinutes != null) watchedFolder.setScanIntervalMinutes(scanIntervalMinutes);

        watchedFolder = watchedFolderRepository.save(watchedFolder);
        return watchedFolder;
    }

    @Transactional
    public void deleteWatchedFolder(Long id) {
        WatchedFolder watchedFolder = watchedFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Watched folder not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!watchedFolder.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to delete this watched folder");
        }

        watchedFolderRepository.delete(watchedFolder);
        logger.info("Deleted watched folder: {} for user: {}", watchedFolder.getFolderPath(), username);
    }

    @Transactional
    public int scanNow(Long id) throws IOException {
        WatchedFolder watchedFolder = watchedFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Watched folder not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!watchedFolder.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to scan this watched folder");
        }

        return folderScanService.scanFolder(watchedFolder);
    }
}
