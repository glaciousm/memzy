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

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DropboxService {

    private static final Logger logger = LoggerFactory.getLogger(DropboxService.class);
    private static final String DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
    private static final String DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
    private static final String DROPBOX_ACCOUNT_URL = "https://api.dropboxapi.com/2/users/get_current_account";

    @Autowired
    private CloudStorageRepository cloudStorageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${memzy.cloud.dropbox.client-id}")
    private String clientId;

    @Value("${memzy.cloud.dropbox.client-secret}")
    private String clientSecret;

    @Value("${memzy.cloud.dropbox.redirect-uri:http://localhost:8080/api/cloud/dropbox/callback}")
    private String redirectUri;

    public String getAuthorizationUrl() {
        return "https://www.dropbox.com/oauth2/authorize?" +
                "client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&response_type=code" +
                "&token_access_type=offline"; // For refresh token
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
            int expiresIn = Integer.parseInt(tokens.getOrDefault("expires_in", "14400")); // 4 hours default

            // Get user email from Dropbox
            String userEmail = getUserEmail(accessToken);

            // Check if connection already exists
            CloudStorage existing = cloudStorageRepository.findByUserAndProvider(user, "DROPBOX")
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
                        .provider("DROPBOX")
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

            logger.info("Dropbox connected for user: {}", username);
            return cloudStorage;

        } catch (Exception e) {
            logger.error("Failed to handle Dropbox OAuth callback", e);
            throw new RuntimeException("Failed to connect to Dropbox: " + e.getMessage());
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
            ResponseEntity<Map> response = restTemplate.postForEntity(DROPBOX_TOKEN_URL, request, Map.class);
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
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    DROPBOX_ACCOUNT_URL,
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody().get("email").toString();
            }
            return "unknown@email.com";
        } catch (Exception e) {
            logger.warn("Failed to get user email from Dropbox", e);
            return "unknown@email.com";
        }
    }

    @Transactional
    public String uploadFile(Long cloudStorageId, File file, String fileName) throws IOException {
        CloudStorage cloudStorage = cloudStorageRepository.findById(cloudStorageId)
                .orElseThrow(() -> new RuntimeException("Cloud storage not found"));

        String accessToken = getValidAccessToken(cloudStorage);

        try {
            // Dropbox API specific headers
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

            Map<String, Object> apiArgs = new HashMap<>();
            apiArgs.put("path", "/" + fileName);
            apiArgs.put("mode", "add");
            apiArgs.put("autorename", true);
            apiArgs.put("mute", false);

            headers.add("Dropbox-API-Arg", apiArgs.toString());

            // Read file bytes
            byte[] fileBytes = java.nio.file.Files.readAllBytes(file.toPath());

            HttpEntity<byte[]> request = new HttpEntity<>(fileBytes, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    DROPBOX_UPLOAD_URL,
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String fileId = response.getBody().get("id").toString();

                // Update stats
                cloudStorage.setTotalFilesUploaded(cloudStorage.getTotalFilesUploaded() + 1);
                cloudStorage.setLastSyncAt(LocalDateTime.now());
                cloudStorageRepository.save(cloudStorage);

                logger.info("Uploaded file {} to Dropbox, fileId: {}", fileName, fileId);
                return fileId;
            }

            throw new RuntimeException("Failed to upload file to Dropbox");

        } catch (Exception e) {
            logger.error("Error uploading file to Dropbox", e);
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
            ResponseEntity<Map> response = restTemplate.postForEntity(DROPBOX_TOKEN_URL, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String newAccessToken = response.getBody().get("access_token").toString();
                int expiresIn = Integer.parseInt(response.getBody().getOrDefault("expires_in", 14400).toString());

                cloudStorage.setAccessToken(newAccessToken);
                cloudStorage.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
                cloudStorageRepository.save(cloudStorage);

                logger.info("Refreshed Dropbox access token");
                return newAccessToken;
            }

            throw new RuntimeException("Failed to refresh access token");

        } catch (Exception e) {
            logger.error("Error refreshing Dropbox access token", e);
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

        logger.info("Disconnected Dropbox for user: {}", username);
    }
}
