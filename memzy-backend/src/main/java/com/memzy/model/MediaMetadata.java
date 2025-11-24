package com.memzy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "media_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_file_id", nullable = false)
    private MediaFile mediaFile;

    @Column(name = "meta_key", nullable = false)
    private String key;

    @Column(name = "meta_value", length = 2000)
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(name = "value_type")
    private MetadataType type;

    public enum MetadataType {
        STRING,
        NUMBER,
        DATE,
        BOOLEAN,
        JSON
    }
}
