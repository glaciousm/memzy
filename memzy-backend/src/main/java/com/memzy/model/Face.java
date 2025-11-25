package com.memzy.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "faces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Face {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_file_id", nullable = false)
    private MediaFile mediaFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person;

    @Column(name = "x", nullable = false)
    private Integer x;

    @Column(name = "y", nullable = false)
    private Integer y;

    @Column(name = "width", nullable = false)
    private Integer width;

    @Column(name = "height", nullable = false)
    private Integer height;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "embedding", columnDefinition = "TEXT")
    private String embedding; // Store face embedding as comma-separated values

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
    }
}
