package com.memzy.service;

import com.memzy.model.MediaFile;
import com.memzy.model.User;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DuplicateFinderService {

    private static final Logger logger = LoggerFactory.getLogger(DuplicateFinderService.class);

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private UserRepository userRepository;

    public Map<String, List<MediaFile>> findDuplicatesByHash() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all user's media files
        List<MediaFile> allMedia = mediaFileRepository.findByOwnerAndIsDeletedFalse(user);

        // Group by file hash
        Map<String, List<MediaFile>> groupedByHash = allMedia.stream()
                .filter(media -> media.getFileHash() != null && !media.getFileHash().isEmpty())
                .collect(Collectors.groupingBy(MediaFile::getFileHash));

        // Filter only duplicates (hash with more than 1 file)
        Map<String, List<MediaFile>> duplicates = groupedByHash.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        logger.info("Found {} duplicate groups for user: {}", duplicates.size(), username);

        return duplicates;
    }

    public Map<String, Object> findDuplicatesBySize() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all user's media files
        List<MediaFile> allMedia = mediaFileRepository.findByOwnerAndIsDeletedFalse(user);

        // Group by file size
        Map<Long, List<MediaFile>> groupedBySize = allMedia.stream()
                .collect(Collectors.groupingBy(MediaFile::getFileSize));

        // Filter only potential duplicates (size with more than 1 file)
        Map<Long, List<MediaFile>> potentialDuplicates = groupedBySize.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        logger.info("Found {} potential duplicate groups by size for user: {}", potentialDuplicates.size(), username);

        return Map.of(
                "message", "Potential duplicates found by file size",
                "duplicateGroups", potentialDuplicates
        );
    }

    public Map<String, Object> findSimilarByName(double similarityThreshold) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all user's media files
        List<MediaFile> allMedia = mediaFileRepository.findByOwnerAndIsDeletedFalse(user);

        // Find similar file names
        List<List<MediaFile>> similarGroups = new ArrayList<>();

        Set<Long> processed = new HashSet<>();

        for (int i = 0; i < allMedia.size(); i++) {
            if (processed.contains(allMedia.get(i).getId())) continue;

            MediaFile current = allMedia.get(i);
            List<MediaFile> similarGroup = new ArrayList<>();
            similarGroup.add(current);
            processed.add(current.getId());

            for (int j = i + 1; j < allMedia.size(); j++) {
                if (processed.contains(allMedia.get(j).getId())) continue;

                MediaFile compare = allMedia.get(j);
                double similarity = calculateNameSimilarity(current.getFileName(), compare.getFileName());

                if (similarity >= similarityThreshold) {
                    similarGroup.add(compare);
                    processed.add(compare.getId());
                }
            }

            if (similarGroup.size() > 1) {
                similarGroups.add(similarGroup);
            }
        }

        logger.info("Found {} similar name groups for user: {}", similarGroups.size(), username);

        return Map.of(
                "message", "Similar files found by name",
                "similarGroups", similarGroups
        );
    }

    public Map<String, Object> findDuplicatesByDimensions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all user's media files with dimensions
        List<MediaFile> allMedia = mediaFileRepository.findByOwnerAndIsDeletedFalse(user).stream()
                .filter(media -> media.getWidth() != null && media.getHeight() != null)
                .collect(Collectors.toList());

        // Group by dimensions
        Map<String, List<MediaFile>> groupedByDimensions = allMedia.stream()
                .collect(Collectors.groupingBy(media -> media.getWidth() + "x" + media.getHeight()));

        // Filter only duplicates (dimensions with more than 1 file and same size)
        Map<String, List<MediaFile>> duplicates = new HashMap<>();

        groupedByDimensions.forEach((dimensions, files) -> {
            if (files.size() > 1) {
                // Further group by file size
                Map<Long, List<MediaFile>> bySize = files.stream()
                        .collect(Collectors.groupingBy(MediaFile::getFileSize));

                bySize.forEach((size, sameFiles) -> {
                    if (sameFiles.size() > 1) {
                        String key = dimensions + "_" + size;
                        duplicates.put(key, sameFiles);
                    }
                });
            }
        });

        logger.info("Found {} duplicate groups by dimensions for user: {}", duplicates.size(), username);

        return Map.of(
                "message", "Duplicates found by dimensions and size",
                "duplicateGroups", duplicates
        );
    }

    public Map<String, Object> getDuplicateStats() {
        Map<String, List<MediaFile>> hashDuplicates = findDuplicatesByHash();

        long totalDuplicateFiles = hashDuplicates.values().stream()
                .mapToLong(list -> list.size() - 1) // Subtract 1 for the original
                .sum();

        long totalWastedSpace = hashDuplicates.values().stream()
                .mapToLong(list -> {
                    if (list.isEmpty()) return 0;
                    long fileSize = list.get(0).getFileSize();
                    return fileSize * (list.size() - 1); // Wasted space = size * (count - 1)
                })
                .sum();

        return Map.of(
                "duplicateGroups", hashDuplicates.size(),
                "totalDuplicateFiles", totalDuplicateFiles,
                "totalWastedSpace", totalWastedSpace,
                "totalWastedSpaceMB", totalWastedSpace / (1024 * 1024)
        );
    }

    private double calculateNameSimilarity(String name1, String name2) {
        // Remove file extensions
        String base1 = name1.substring(0, name1.lastIndexOf('.') > 0 ? name1.lastIndexOf('.') : name1.length());
        String base2 = name2.substring(0, name2.lastIndexOf('.') > 0 ? name2.lastIndexOf('.') : name2.length());

        // Calculate Levenshtein distance
        int distance = levenshteinDistance(base1.toLowerCase(), base2.toLowerCase());
        int maxLength = Math.max(base1.length(), base2.length());

        if (maxLength == 0) return 1.0;

        return 1.0 - ((double) distance / maxLength);
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }
}
