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
public class WatchedFolderDto {

    private Long id;
    private String folderPath;
    private Boolean isActive;
    private Boolean recursiveScan;
    private Boolean autoImport;
    private LocalDateTime lastScan;
    private Integer scanIntervalMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
