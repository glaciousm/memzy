package com.memzy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageEditRequest {
    private Long mediaFileId;
    private String editType; // crop, rotate, flip, brightness, contrast, filter, resize

    // Crop parameters
    private Integer cropX;
    private Integer cropY;
    private Integer cropWidth;
    private Integer cropHeight;

    // Rotate parameters
    private Double rotateDegrees;

    // Flip parameters
    private Boolean flipHorizontal;

    // Adjustment parameters
    private Float brightness; // -1.0 to 1.0
    private Float contrast; // -1.0 to 1.0

    // Filter parameters
    private String filterType; // grayscale, sepia

    // Resize parameters
    private Integer resizeWidth;
    private Integer resizeHeight;
}
