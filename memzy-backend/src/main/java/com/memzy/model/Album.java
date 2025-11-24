package com.memzy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "albums")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Album parent;

    @OneToMany(mappedBy = "parent")
    private Set<Album> children = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "album_media",
        joinColumns = @JoinColumn(name = "album_id"),
        inverseJoinColumns = @JoinColumn(name = "media_id")
    )
    private Set<MediaFile> mediaFiles = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "album_type", nullable = false)
    private AlbumType albumType = AlbumType.REGULAR;

    @Column(name = "is_smart_album")
    private Boolean isSmartAlbum = false;

    @Column(name = "smart_album_rules", length = 2000)  // JSON string of rules
    private String smartAlbumRules;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility")
    private Visibility visibility = Visibility.PRIVATE;

    @ManyToMany
    @JoinTable(
        name = "album_shared_with",
        joinColumns = @JoinColumn(name = "album_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> sharedWith = new HashSet<>();

    @Column(name = "share_token")
    private String shareToken;  // For public sharing links

    @Column(name = "share_expires_at")
    private LocalDateTime shareExpiresAt;

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

    public enum AlbumType {
        REGULAR,
        SMART,
        SHARED,
        FAVORITES
    }

    public enum Visibility {
        PRIVATE,
        SHARED,
        PUBLIC
    }
}
