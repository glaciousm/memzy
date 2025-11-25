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
public class FaceDto {
    private Long id;
    private Long mediaId;
    private Long personId;
    private String personName;
    private Integer x;
    private Integer y;
    private Integer width;
    private Integer height;
    private Double confidence;
    private Boolean isVerified;
    private LocalDateTime detectedAt;
}
