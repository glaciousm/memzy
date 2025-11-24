package com.memzy.service;

import com.memzy.dto.AlbumDto;
import com.memzy.dto.SimpleAlbumDto;
import com.memzy.model.Album;
import com.memzy.model.MediaFile;
import com.memzy.model.User;
import com.memzy.repository.AlbumRepository;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlbumService {

    private static final Logger logger = LoggerFactory.getLogger(AlbumService.class);

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MediaFileRepository mediaFileRepository;


    @Transactional
    public AlbumDto createAlbum(String name, String description, Long parentId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Album album = Album.builder()
                .name(name)
                .description(description)
                .owner(user)
                .albumType(Album.AlbumType.REGULAR)
                .isSmartAlbum(false)
                .visibility(Album.Visibility.PRIVATE)
                .build();

        if (parentId != null) {
            Album parent = albumRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent album not found"));
            album.setParent(parent);
        }

        album = albumRepository.save(album);
        logger.info("Album created: {} by user: {}", name, username);

        return convertToDto(album);
    }

    public List<AlbumDto> getUserAlbums() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Album> albums = albumRepository.findByOwnerAndParentIsNull(user);
        return albums.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public AlbumDto getAlbumById(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        return convertToDto(album);
    }

    @Transactional
    public AlbumDto updateAlbum(Long id, String name, String description) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!album.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to update this album");
        }

        album.setName(name);
        album.setDescription(description);
        album = albumRepository.save(album);

        return convertToDto(album);
    }

    @Transactional
    public void deleteAlbum(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!album.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to delete this album");
        }

        albumRepository.delete(album);
        logger.info("Album deleted: {} by user: {}", album.getName(), username);
    }

    @Transactional
    public AlbumDto addMediaToAlbum(Long albumId, Long mediaId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        MediaFile mediaFile = mediaFileRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        album.getMediaFiles().add(mediaFile);
        album = albumRepository.save(album);

        logger.info("Media added to album: {} - {}", album.getName(), mediaFile.getFileName());

        return convertToDto(album);
    }

    @Transactional
    public AlbumDto removeMediaFromAlbum(Long albumId, Long mediaId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        MediaFile mediaFile = mediaFileRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        album.getMediaFiles().remove(mediaFile);
        album = albumRepository.save(album);

        logger.info("Media removed from album: {} - {}", album.getName(), mediaFile.getFileName());

        return convertToDto(album);
    }

    public List<MediaFile> getAlbumMedia(Long albumId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        return album.getMediaFiles().stream()
                .filter(media -> !media.getIsDeleted())
                .collect(Collectors.toList());
    }

    private AlbumDto convertToDto(Album album) {
        return AlbumDto.builder()
                .id(album.getId())
                .name(album.getName())
                .description(album.getDescription())
                .coverImageUrl(album.getCoverImageUrl())
                .albumType(album.getAlbumType())
                .isSmartAlbum(album.getIsSmartAlbum())
                .visibility(album.getVisibility())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .mediaCount(album.getMediaFiles().size())
                .children(album.getChildren().stream()
                        .map(child -> SimpleAlbumDto.builder()
                                .id(child.getId())
                                .name(child.getName())
                                .coverImageUrl(child.getCoverImageUrl())
                                .albumType(child.getAlbumType())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
