package com.memzy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartAlbumRuleDto {
    private Long id;
    private String field;
    private String operator;
    private String value;
    private String value2;
    private Integer sortOrder;
}
