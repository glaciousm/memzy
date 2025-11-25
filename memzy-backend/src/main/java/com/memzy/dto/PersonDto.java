package com.memzy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonDto {
    private Long id;
    private String name;
    private String description;
    private String thumbnailPath;
    private Long faceCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
