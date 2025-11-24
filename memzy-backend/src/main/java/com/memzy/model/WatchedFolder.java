package com.memzy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "watched_folders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchedFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "folder_path", nullable = false, length = 1000)
    private String folderPath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "recursive_scan")
    private Boolean recursiveScan = true;

    @Column(name = "auto_import")
    private Boolean autoImport = true;

    @Column(name = "last_scan")
    private LocalDateTime lastScan;

    @Column(name = "scan_interval_minutes")
    private Integer scanIntervalMinutes = 60;  // Default: scan every hour

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
