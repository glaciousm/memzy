package com.memzy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "cloud_storage")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloudStorage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String provider; // GOOGLE_DRIVE, DROPBOX, ONEDRIVE

    @Column(nullable = false)
    private String accountEmail;

    @Column(nullable = false, length = 1000)
    private String accessToken;

    @Column(length = 1000)
    private String refreshToken;

    @Column
    private LocalDateTime tokenExpiresAt;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean autoSync = false;

    @Column
    private String syncFolderPath; // Path in cloud storage to sync

    @Column
    private LocalDateTime lastSyncAt;

    @Column
    private Long totalFilesUploaded = 0L;

    @Column
    private Long totalFilesDownloaded = 0L;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
