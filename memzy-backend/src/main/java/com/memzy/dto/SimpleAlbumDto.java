package com.memzy.dto;

import com.memzy.model.Album;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimpleAlbumDto {

    private Long id;
    private String name;
    private String coverImageUrl;
    private Album.AlbumType albumType;
}
