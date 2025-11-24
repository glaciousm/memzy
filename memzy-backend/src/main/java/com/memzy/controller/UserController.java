package com.memzy.controller;

import com.memzy.model.User;
import com.memzy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (updates.containsKey("firstName")) {
                user.setFirstName(updates.get("firstName"));
            }

            if (updates.containsKey("lastName")) {
                user.setLastName(updates.get("lastName"));
            }

            if (updates.containsKey("avatarUrl")) {
                user.setAvatarUrl(updates.get("avatarUrl"));
            }

            user = userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Profile updated successfully",
                    "user", Map.of(
                            "id", user.getId(),
                            "username", user.getUsername(),
                            "email", user.getEmail(),
                            "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                            "lastName", user.getLastName() != null ? user.getLastName() : "",
                            "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
                    )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> passwordData) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Current password and new password are required"));
            }

            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
            }

            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                    "lastName", user.getLastName() != null ? user.getLastName() : "",
                    "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                    "createdAt", user.getCreatedAt()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
