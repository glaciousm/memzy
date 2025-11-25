package com.memzy.service;

import com.memzy.model.CloudStorage;
import com.memzy.model.User;
import com.memzy.repository.CloudStorageRepository;
import com.memzy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class GoogleDriveService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleDriveService.class);
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
    private static final String GOOGLE_DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

    @Autowired
    private CloudStorageRepository cloudStorageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${memzy.cloud.google-drive.client-id}")
    private String clientId;

    @Value("${memzy.cloud.google-drive.client-secret}")
    private String clientSecret;

    @Value("${memzy.cloud.google-drive.redirect-uri:http://localhost:8080/api/cloud/google-drive/callback}")
    private String redirectUri;

    public String getAuthorizationUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&response_type=code" +
                "&scope=https://www.googleapis.com/auth/drive.file" +
                "&access_type=offline" +
                "&prompt=consent";
    }

    @Transactional
    public CloudStorage handleOAuthCallback(String code) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            // Exchange code for tokens
            Map<String, String> tokens = exchangeCodeForTokens(code);

            String accessToken = tokens.get("access_token");
            String refreshToken = tokens.get("refresh_token");
            int expiresIn = Integer.parseInt(tokens.getOrDefault("expires_in", "3600"));

            // Get user email from Google
            String userEmail = getUserEmail(accessToken);

            // Check if connection already exists
            CloudStorage existing = cloudStorageRepository.findByUserAndProvider(user, "GOOGLE_DRIVE")
                    .orElse(null);

            CloudStorage cloudStorage;
            if (existing != null) {
                // Update existing
                existing.setAccessToken(accessToken);
                existing.setRefreshToken(refreshToken);
                existing.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
                existing.setAccountEmail(userEmail);
                existing.setIsActive(true);
                cloudStorage = cloudStorageRepository.save(existing);
            } else {
                // Create new
                cloudStorage = CloudStorage.builder()
                        .user(user)
                        .provider("GOOGLE_DRIVE")
                        .accountEmail(userEmail)
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .tokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn))
                        .isActive(true)
                        .autoSync(false)
                        .totalFilesUploaded(0L)
                        .totalFilesDownloaded(0L)
                        .build();
                cloudStorage = cloudStorageRepository.save(cloudStorage);
            }

            logger.info("Google Drive connected for user: {}", username);
            return cloudStorage;

        } catch (Exception e) {
            logger.error("Failed to handle OAuth callback", e);
            throw new RuntimeException("Failed to connect to Google Drive: " + e.getMessage());
        }
    }

    private Map<String, String> exchangeCodeForTokens(String code) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(GOOGLE_TOKEN_URL, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, String> result = new HashMap<>();
                response.getBody().forEach((key, value) -> result.put(key.toString(), value.toString()));
                return result;
            }
            throw new RuntimeException("Failed to exchange code for tokens");
        } catch (Exception e) {
            logger.error("Error exchanging code for tokens", e);
            throw new RuntimeException("Failed to get access token: " + e.getMessage());
        }
    }

    private String getUserEmail(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    HttpMethod.GET,
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody().get("email").toString();
            }
            return "unknown@email.com";
        } catch (Exception e) {
            logger.warn("Failed to get user email", e);
            return "unknown@email.com";
        }
    }

    @Transactional
    public String uploadFile(Long cloudStorageId, File file, String fileName) throws IOException {
        CloudStorage cloudStorage = cloudStorageRepository.findById(cloudStorageId)
                .orElseThrow(() -> new RuntimeException("Cloud storage not found"));

        String accessToken = getValidAccessToken(cloudStorage);

        try {
            // Create file metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("name", fileName);

            // Upload file
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> metadataRequest = new HttpEntity<>(metadata, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    GOOGLE_DRIVE_UPLOAD_URL + "?uploadType=multipart",
                    metadataRequest,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String fileId = response.getBody().get("id").toString();

                // Update stats
                cloudStorage.setTotalFilesUploaded(cloudStorage.getTotalFilesUploaded() + 1);
                cloudStorage.setLastSyncAt(LocalDateTime.now());
                cloudStorageRepository.save(cloudStorage);

                logger.info("Uploaded file {} to Google Drive, fileId: {}", fileName, fileId);
                return fileId;
            }

            throw new RuntimeException("Failed to upload file to Google Drive");

        } catch (Exception e) {
            logger.error("Error uploading file to Google Drive", e);
            throw new IOException("Failed to upload file: " + e.getMessage());
        }
    }

    private String getValidAccessToken(CloudStorage cloudStorage) {
        // Check if token is expired
        if (cloudStorage.getTokenExpiresAt() != null &&
                cloudStorage.getTokenExpiresAt().isBefore(LocalDateTime.now().plusMinutes(5))) {
            // Refresh token
            return refreshAccessToken(cloudStorage);
        }
        return cloudStorage.getAccessToken();
    }

    private String refreshAccessToken(CloudStorage cloudStorage) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("refresh_token", cloudStorage.getRefreshToken());
        params.add("grant_type", "refresh_token");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(GOOGLE_TOKEN_URL, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String newAccessToken = response.getBody().get("access_token").toString();
                int expiresIn = Integer.parseInt(response.getBody().getOrDefault("expires_in", 3600).toString());

                cloudStorage.setAccessToken(newAccessToken);
                cloudStorage.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
                cloudStorageRepository.save(cloudStorage);

                logger.info("Refreshed Google Drive access token");
                return newAccessToken;
            }

            throw new RuntimeException("Failed to refresh access token");

        } catch (Exception e) {
            logger.error("Error refreshing access token", e);
            throw new RuntimeException("Failed to refresh token: " + e.getMessage());
        }
    }

    @Transactional
    public void disconnect(Long cloudStorageId) {
        CloudStorage cloudStorage = cloudStorageRepository.findById(cloudStorageId)
                .orElseThrow(() -> new RuntimeException("Cloud storage not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!cloudStorage.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        cloudStorage.setIsActive(false);
        cloudStorageRepository.save(cloudStorage);

        logger.info("Disconnected Google Drive for user: {}", username);
    }
}
