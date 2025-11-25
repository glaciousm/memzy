package com.memzy.dto;

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
public class SmartAlbumDto {
    private Long id;
    private String name;
    private String description;
    private Boolean isActive;
    private String matchType; // ALL or ANY
    private List<SmartAlbumRuleDto> rules;
    private Integer mediaCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
