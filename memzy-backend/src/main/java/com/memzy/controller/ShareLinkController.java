package com.memzy.controller;

import com.memzy.dto.ShareLinkDto;
import com.memzy.model.ShareLink;
import com.memzy.service.ShareLinkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/share")
public class ShareLinkController {

    private static final Logger logger = LoggerFactory.getLogger(ShareLinkController.class);

    @Autowired
    private ShareLinkService shareLinkService;

    @Value("${memzy.app.base-url:http://localhost:5173}")
    private String baseUrl;

    @PostMapping("/media/{mediaFileId}")
    public ResponseEntity<?> createMediaShareLink(
            @PathVariable Long mediaFileId,
            @RequestParam(required = false) Integer expirationHours,
            @RequestParam(required = false) Boolean allowDownload,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) Integer maxViews) {
        try {
            ShareLink shareLink = shareLinkService.createMediaShareLink(
                    mediaFileId, expirationHours, allowDownload, password, maxViews
            );

            ShareLinkDto dto = convertToDto(shareLink);

            return ResponseEntity.ok(Map.of(
                    "message", "Share link created successfully",
                    "shareLink", dto
            ));
        } catch (Exception e) {
            logger.error("Failed to create share link", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/album/{albumId}")
    public ResponseEntity<?> createAlbumShareLink(
            @PathVariable Long albumId,
            @RequestParam(required = false) Integer expirationHours,
            @RequestParam(required = false) Boolean allowDownload,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) Integer maxViews) {
        try {
            ShareLink shareLink = shareLinkService.createAlbumShareLink(
                    albumId, expirationHours, allowDownload, password, maxViews
            );

            ShareLinkDto dto = convertToDto(shareLink);

            return ResponseEntity.ok(Map.of(
                    "message", "Share link created successfully",
                    "shareLink", dto
            ));
        } catch (Exception e) {
            logger.error("Failed to create share link", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> getSharedContent(
            @PathVariable String token,
            @RequestParam(required = false) String password) {
        try {
            ShareLink shareLink = shareLinkService.getShareLinkByToken(token);

            // Validate password if required
            if (shareLink.getRequirePassword()) {
                if (password == null || !shareLinkService.validatePassword(token, password)) {
                    return ResponseEntity.status(401).body(Map.of("error", "Invalid password"));
                }
            }

            // Increment view count
            shareLinkService.incrementViewCount(token);

            ShareLinkDto dto = convertToDto(shareLink);

            return ResponseEntity.ok(Map.of(
                    "shareLink", dto
            ));
        } catch (Exception e) {
            logger.error("Failed to get shared content", e);
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-links")
    public ResponseEntity<?> getUserShareLinks() {
        try {
            List<ShareLink> shareLinks = shareLinkService.getUserShareLinks();

            List<ShareLinkDto> dtos = shareLinks.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Failed to get user share links", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{shareLinkId}")
    public ResponseEntity<?> deactivateShareLink(@PathVariable Long shareLinkId) {
        try {
            shareLinkService.deactivateShareLink(shareLinkId);
            return ResponseEntity.ok(Map.of("message", "Share link deactivated successfully"));
        } catch (Exception e) {
            logger.error("Failed to deactivate share link", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private ShareLinkDto convertToDto(ShareLink shareLink) {
        String shareUrl = baseUrl + "/shared/" + shareLink.getShareToken();

        return ShareLinkDto.builder()
                .id(shareLink.getId())
                .shareToken(shareLink.getShareToken())
                .shareUrl(shareUrl)
                .mediaFileId(shareLink.getMediaFile() != null ? shareLink.getMediaFile().getId() : null)
                .mediaFileName(shareLink.getMediaFile() != null ? shareLink.getMediaFile().getFileName() : null)
                .albumId(shareLink.getAlbum() != null ? shareLink.getAlbum().getId() : null)
                .albumName(shareLink.getAlbum() != null ? shareLink.getAlbum().getName() : null)
                .isActive(shareLink.getIsActive())
                .expiresAt(shareLink.getExpiresAt())
                .allowDownload(shareLink.getAllowDownload())
                .requirePassword(shareLink.getRequirePassword())
                .viewCount(shareLink.getViewCount())
                .maxViews(shareLink.getMaxViews())
                .createdAt(shareLink.getCreatedAt())
                .build();
    }
}
