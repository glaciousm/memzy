package com.memzy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "smart_album_rules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartAlbumRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "smart_album_id", nullable = false)
    private SmartAlbum smartAlbum;

    @Column(nullable = false)
    private String field; // mediaType, isFavorite, dateTaken, tag, cameraMake, fileSize, width, height

    @Column(nullable = false)
    private String operator; // equals, notEquals, contains, greaterThan, lessThan, between, in

    @Column(nullable = false, length = 500)
    private String value; // The value to compare against

    @Column
    private String value2; // For 'between' operator (end value)

    @Column(nullable = false)
    private Integer sortOrder = 0;
}
