package com.memzy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareLinkDto {
    private Long id;
    private String shareToken;
    private String shareUrl;
    private Long mediaFileId;
    private String mediaFileName;
    private Long albumId;
    private String albumName;
    private Boolean isActive;
    private LocalDateTime expiresAt;
    private Boolean allowDownload;
    private Boolean requirePassword;
    private Integer viewCount;
    private Integer maxViews;
    private LocalDateTime createdAt;
}
