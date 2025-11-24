package com.memzy.dto;

import com.memzy.model.MediaFile;
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
public class MediaFileDto {

    private Long id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private MediaFile.MediaType mediaType;
    private Integer width;
    private Integer height;
    private Integer duration;
    private String thumbnailPath;
    private LocalDateTime dateTaken;
    private Boolean isFavorite;
    private Double latitude;
    private Double longitude;
    private String locationName;
    private String cameraMake;
    private String cameraModel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long viewCount;
    private List<TagDto> tags;
    private List<SimpleAlbumDto> albums;
}
