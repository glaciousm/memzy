package com.memzy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "smart_albums")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartAlbum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "smartAlbum", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SmartAlbumRule> rules = new ArrayList<>();

    @Column(nullable = false)
    private String matchType = "ALL"; // ALL or ANY

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Helper method
    public void addRule(SmartAlbumRule rule) {
        rules.add(rule);
        rule.setSmartAlbum(this);
    }
}
