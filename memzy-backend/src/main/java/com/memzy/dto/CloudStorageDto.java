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
public class CloudStorageDto {
    private Long id;
    private String provider;
    private String accountEmail;
    private Boolean isActive;
    private Boolean autoSync;
    private String syncFolderPath;
    private LocalDateTime lastSyncAt;
    private Long totalFilesUploaded;
    private Long totalFilesDownloaded;
    private LocalDateTime createdAt;
}
