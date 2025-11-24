package com.memzy.service;

import com.memzy.model.Album;
import com.memzy.model.MediaFile;
import com.memzy.model.ShareLink;
import com.memzy.model.User;
import com.memzy.repository.AlbumRepository;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.ShareLinkRepository;
import com.memzy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
public class ShareLinkService {

    private static final Logger logger = LoggerFactory.getLogger(ShareLinkService.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private ShareLinkRepository shareLinkRepository;

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public ShareLink createMediaShareLink(Long mediaFileId, Integer expirationHours, Boolean allowDownload,
                                         String password, Integer maxViews) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MediaFile mediaFile = mediaFileRepository.findById(mediaFileId)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        // Check ownership
        if (!mediaFile.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        String shareToken = generateShareToken();

        ShareLink.ShareLinkBuilder builder = ShareLink.builder()
                .shareToken(shareToken)
                .mediaFile(mediaFile)
                .createdBy(user)
                .isActive(true)
                .allowDownload(allowDownload != null ? allowDownload : false)
                .maxViews(maxViews);

        if (expirationHours != null && expirationHours > 0) {
            builder.expiresAt(LocalDateTime.now().plusHours(expirationHours));
        }

        if (password != null && !password.isEmpty()) {
            builder.requirePassword(true);
            builder.password(passwordEncoder.encode(password));
        } else {
            builder.requirePassword(false);
        }

        ShareLink shareLink = builder.build();
        shareLink = shareLinkRepository.save(shareLink);

        logger.info("Created share link for media file ID: {}, token: {}", mediaFileId, shareToken);
        return shareLink;
    }

    @Transactional
    public ShareLink createAlbumShareLink(Long albumId, Integer expirationHours, Boolean allowDownload,
                                         String password, Integer maxViews) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        // Check ownership
        if (!album.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        String shareToken = generateShareToken();

        ShareLink.ShareLinkBuilder builder = ShareLink.builder()
                .shareToken(shareToken)
                .album(album)
                .createdBy(user)
                .isActive(true)
                .allowDownload(allowDownload != null ? allowDownload : false)
                .maxViews(maxViews);

        if (expirationHours != null && expirationHours > 0) {
            builder.expiresAt(LocalDateTime.now().plusHours(expirationHours));
        }

        if (password != null && !password.isEmpty()) {
            builder.requirePassword(true);
            builder.password(passwordEncoder.encode(password));
        } else {
            builder.requirePassword(false);
        }

        ShareLink shareLink = builder.build();
        shareLink = shareLinkRepository.save(shareLink);

        logger.info("Created share link for album ID: {}, token: {}", albumId, shareToken);
        return shareLink;
    }

    public ShareLink getShareLinkByToken(String token) {
        ShareLink shareLink = shareLinkRepository.findByShareToken(token)
                .orElseThrow(() -> new RuntimeException("Share link not found"));

        // Check if expired
        if (shareLink.getExpiresAt() != null && shareLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Share link has expired");
        }

        // Check if reached max views
        if (shareLink.getMaxViews() != null && shareLink.getViewCount() >= shareLink.getMaxViews()) {
            throw new RuntimeException("Share link has reached maximum views");
        }

        // Check if active
        if (!shareLink.getIsActive()) {
            throw new RuntimeException("Share link is not active");
        }

        return shareLink;
    }

    @Transactional
    public boolean validatePassword(String token, String password) {
        ShareLink shareLink = shareLinkRepository.findByShareToken(token)
                .orElseThrow(() -> new RuntimeException("Share link not found"));

        if (!shareLink.getRequirePassword()) {
            return true;
        }

        return passwordEncoder.matches(password, shareLink.getPassword());
    }

    @Transactional
    public void incrementViewCount(String token) {
        ShareLink shareLink = shareLinkRepository.findByShareToken(token)
                .orElseThrow(() -> new RuntimeException("Share link not found"));

        shareLink.setViewCount(shareLink.getViewCount() + 1);
        shareLinkRepository.save(shareLink);
    }

    public List<ShareLink> getUserShareLinks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return shareLinkRepository.findByCreatedByAndIsActiveTrue(user);
    }

    @Transactional
    public void deactivateShareLink(Long shareLinkId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ShareLink shareLink = shareLinkRepository.findById(shareLinkId)
                .orElseThrow(() -> new RuntimeException("Share link not found"));

        // Check ownership
        if (!shareLink.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        shareLink.setIsActive(false);
        shareLinkRepository.save(shareLink);
        logger.info("Deactivated share link ID: {}", shareLinkId);
    }

    @Transactional
    @Scheduled(fixedDelay = 3600000) // Run every hour
    public void cleanupExpiredLinks() {
        List<ShareLink> expiredLinks = shareLinkRepository.findByExpiresAtBeforeAndIsActiveTrue(LocalDateTime.now());

        for (ShareLink link : expiredLinks) {
            link.setIsActive(false);
            shareLinkRepository.save(link);
        }

        if (!expiredLinks.isEmpty()) {
            logger.info("Deactivated {} expired share links", expiredLinks.size());
        }
    }

    private String generateShareToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
