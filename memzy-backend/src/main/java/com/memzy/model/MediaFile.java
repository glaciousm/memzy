package com.memzy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "media_files", indexes = {
    @Index(name = "idx_media_type", columnList = "media_type"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_file_path", columnList = "file_path"),
    @Index(name = "idx_owner_id", columnList = "owner_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type")
    private String mimeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false)
    private MediaType mediaType;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "duration")  // For videos, in seconds
    private Integer duration;

    @Column(name = "thumbnail_path", length = 1000)
    private String thumbnailPath;

    @Column(name = "file_hash")  // For duplicate detection
    private String fileHash;

    @Column(name = "date_taken")
    private LocalDateTime dateTaken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToMany
    @JoinTable(
        name = "media_tags",
        joinColumns = @JoinColumn(name = "media_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @ManyToMany(mappedBy = "mediaFiles")
    private Set<Album> albums = new HashSet<>();

    @OneToMany(mappedBy = "mediaFile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MediaMetadata> metadata = new ArrayList<>();

    @OneToMany(mappedBy = "mediaFile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @Column(name = "is_favorite")
    private Boolean isFavorite = false;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "camera_make")
    private String cameraMake;

    @Column(name = "camera_model")
    private String cameraModel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "view_count")
    private Long viewCount = 0L;

    @Column(name = "last_viewed")
    private LocalDateTime lastViewed;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum MediaType {
        IMAGE,
        VIDEO
    }
}
