package com.memzy.dto;

import com.memzy.model.Album;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumDto {

    private Long id;
    private String name;
    private String description;
    private String coverImageUrl;
    private Album.AlbumType albumType;
    private Boolean isSmartAlbum;
    private Album.Visibility visibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer mediaCount;
    private List<SimpleAlbumDto> children;
}
