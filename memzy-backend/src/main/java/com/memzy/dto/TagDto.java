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
public class TagDto {

    private Long id;
    private String name;
    private String colorCode;
    private String description;
    private Long usageCount;
    private LocalDateTime createdAt;
}
