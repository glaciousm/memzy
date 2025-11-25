package com.memzy.service;

import com.memzy.model.*;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.SmartAlbumRepository;
import com.memzy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SmartAlbumService {

    private static final Logger logger = LoggerFactory.getLogger(SmartAlbumService.class);

    @Autowired
    private SmartAlbumRepository smartAlbumRepository;

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public SmartAlbum createSmartAlbum(String name, String description, String matchType, List<SmartAlbumRule> rules) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SmartAlbum smartAlbum = SmartAlbum.builder()
                .name(name)
                .description(description)
                .owner(user)
                .isActive(true)
                .matchType(matchType)
                .build();

        // Add rules
        for (SmartAlbumRule rule : rules) {
            smartAlbum.addRule(rule);
        }

        smartAlbum = smartAlbumRepository.save(smartAlbum);
        logger.info("Created smart album: {} with {} rules", name, rules.size());

        return smartAlbum;
    }

    public List<SmartAlbum> getUserSmartAlbums() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return smartAlbumRepository.findByOwnerAndIsActiveTrue(user);
    }

    public SmartAlbum getSmartAlbumById(Long id) {
        SmartAlbum smartAlbum = smartAlbumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Smart album not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!smartAlbum.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        return smartAlbum;
    }

    @Transactional
    public SmartAlbum updateSmartAlbum(Long id, String name, String description, String matchType, List<SmartAlbumRule> rules) {
        SmartAlbum smartAlbum = getSmartAlbumById(id);

        smartAlbum.setName(name);
        smartAlbum.setDescription(description);
        smartAlbum.setMatchType(matchType);

        // Clear existing rules
        smartAlbum.getRules().clear();

        // Add new rules
        for (SmartAlbumRule rule : rules) {
            smartAlbum.addRule(rule);
        }

        smartAlbum = smartAlbumRepository.save(smartAlbum);
        logger.info("Updated smart album: {}", id);

        return smartAlbum;
    }

    @Transactional
    public void deleteSmartAlbum(Long id) {
        SmartAlbum smartAlbum = getSmartAlbumById(id);
        smartAlbum.setIsActive(false);
        smartAlbumRepository.save(smartAlbum);
        logger.info("Deleted smart album: {}", id);
    }

    public List<MediaFile> getSmartAlbumMedia(Long smartAlbumId) {
        SmartAlbum smartAlbum = getSmartAlbumById(smartAlbumId);

        // Get all user's media files
        List<MediaFile> allMedia = mediaFileRepository.findByOwnerAndIsDeletedFalse(smartAlbum.getOwner());

        // Filter by rules
        return filterMediaByRules(allMedia, smartAlbum);
    }

    private List<MediaFile> filterMediaByRules(List<MediaFile> mediaFiles, SmartAlbum smartAlbum) {
        boolean matchAll = "ALL".equalsIgnoreCase(smartAlbum.getMatchType());

        return mediaFiles.stream()
                .filter(media -> {
                    if (matchAll) {
                        // All rules must match
                        return smartAlbum.getRules().stream().allMatch(rule -> evaluateRule(media, rule));
                    } else {
                        // Any rule can match
                        return smartAlbum.getRules().stream().anyMatch(rule -> evaluateRule(media, rule));
                    }
                })
                .collect(Collectors.toList());
    }

    private boolean evaluateRule(MediaFile media, SmartAlbumRule rule) {
        try {
            String field = rule.getField();
            String operator = rule.getOperator();
            String value = rule.getValue();

            switch (field) {
                case "mediaType":
                    return evaluateStringField(media.getMediaType().name(), operator, value);

                case "isFavorite":
                    return evaluateBooleanField(media.getIsFavorite(), operator, value);

                case "dateTaken":
                    if (media.getDateTaken() != null) {
                        return evaluateDateField(media.getDateTaken(), operator, value, rule.getValue2());
                    }
                    return false;

                case "tag":
                    return evaluateTagField(media, operator, value);

                case "cameraMake":
                    if (media.getCameraMake() != null) {
                        return evaluateStringField(media.getCameraMake(), operator, value);
                    }
                    return false;

                case "cameraModel":
                    if (media.getCameraModel() != null) {
                        return evaluateStringField(media.getCameraModel(), operator, value);
                    }
                    return false;

                case "fileSize":
                    return evaluateNumericField(media.getFileSize(), operator, value, rule.getValue2());

                case "width":
                    if (media.getWidth() != null) {
                        return evaluateNumericField(media.getWidth().longValue(), operator, value, rule.getValue2());
                    }
                    return false;

                case "height":
                    if (media.getHeight() != null) {
                        return evaluateNumericField(media.getHeight().longValue(), operator, value, rule.getValue2());
                    }
                    return false;

                default:
                    logger.warn("Unknown field: {}", field);
                    return false;
            }
        } catch (Exception e) {
            logger.error("Error evaluating rule", e);
            return false;
        }
    }

    private boolean evaluateStringField(String fieldValue, String operator, String value) {
        switch (operator) {
            case "equals":
                return fieldValue.equalsIgnoreCase(value);
            case "notEquals":
                return !fieldValue.equalsIgnoreCase(value);
            case "contains":
                return fieldValue.toLowerCase().contains(value.toLowerCase());
            default:
                return false;
        }
    }

    private boolean evaluateBooleanField(Boolean fieldValue, String operator, String value) {
        boolean boolValue = Boolean.parseBoolean(value);
        switch (operator) {
            case "equals":
                return fieldValue == boolValue;
            case "notEquals":
                return fieldValue != boolValue;
            default:
                return false;
        }
    }

    private boolean evaluateDateField(LocalDateTime fieldValue, String operator, String value, String value2) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
            LocalDateTime compareDate = LocalDateTime.parse(value, formatter);

            switch (operator) {
                case "equals":
                    return fieldValue.toLocalDate().equals(compareDate.toLocalDate());
                case "greaterThan":
                    return fieldValue.isAfter(compareDate);
                case "lessThan":
                    return fieldValue.isBefore(compareDate);
                case "between":
                    if (value2 != null) {
                        LocalDateTime endDate = LocalDateTime.parse(value2, formatter);
                        return fieldValue.isAfter(compareDate) && fieldValue.isBefore(endDate);
                    }
                    return false;
                default:
                    return false;
            }
        } catch (Exception e) {
            logger.error("Error parsing date", e);
            return false;
        }
    }

    private boolean evaluateNumericField(Long fieldValue, String operator, String value, String value2) {
        try {
            Long compareValue = Long.parseLong(value);

            switch (operator) {
                case "equals":
                    return fieldValue.equals(compareValue);
                case "notEquals":
                    return !fieldValue.equals(compareValue);
                case "greaterThan":
                    return fieldValue > compareValue;
                case "lessThan":
                    return fieldValue < compareValue;
                case "between":
                    if (value2 != null) {
                        Long endValue = Long.parseLong(value2);
                        return fieldValue >= compareValue && fieldValue <= endValue;
                    }
                    return false;
                default:
                    return false;
            }
        } catch (NumberFormatException e) {
            logger.error("Error parsing number", e);
            return false;
        }
    }

    private boolean evaluateTagField(MediaFile media, String operator, String value) {
        List<String> mediaTagNames = media.getTags().stream()
                .map(Tag::getName)
                .map(String::toLowerCase)
                .collect(Collectors.toList());

        String lowerValue = value.toLowerCase();

        switch (operator) {
            case "contains":
                return mediaTagNames.contains(lowerValue);
            case "notContains":
                return !mediaTagNames.contains(lowerValue);
            default:
                return false;
        }
    }
}
