package com.memzy.service;

import com.memzy.dto.MediaFileDto;
import com.memzy.model.MediaFile;
import com.memzy.model.User;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SearchService {

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MediaFileService mediaFileService;

    public Page<MediaFileDto> searchMedia(
            MediaFile.MediaType mediaType,
            List<Long> tagIds,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Boolean isFavorite,
            Pageable pageable
    ) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<MediaFile> results;

        // Apply filters based on provided criteria
        if (tagIds != null && !tagIds.isEmpty()) {
            results = mediaFileRepository.findByOwnerAndTagIds(user, tagIds, pageable);
        } else if (startDate != null && endDate != null) {
            results = mediaFileRepository.findByOwnerAndDateRange(user, startDate, endDate, pageable);
        } else if (Boolean.TRUE.equals(isFavorite)) {
            results = mediaFileRepository.findFavoritesByOwner(user, pageable);
        } else if (mediaType != null) {
            results = mediaFileRepository.findByOwnerAndMediaTypeAndIsDeletedFalse(user, mediaType, pageable);
        } else {
            results = mediaFileRepository.findByOwnerAndIsDeletedFalse(user, pageable);
        }

        return results.map(mediaFile -> {
            // Using a simplified conversion to avoid circular dependencies
            return mediaFileService.getMediaById(mediaFile.getId());
        });
    }

    public Page<MediaFileDto> getFavorites(Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<MediaFile> favorites = mediaFileRepository.findFavoritesByOwner(user, pageable);
        return favorites.map(mediaFile -> mediaFileService.getMediaById(mediaFile.getId()));
    }

    public Page<MediaFileDto> getDeletedMedia(Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<MediaFile> deleted = mediaFileRepository.findDeletedByOwner(user, pageable);
        return deleted.map(mediaFile -> mediaFileService.getMediaById(mediaFile.getId()));
    }
}
