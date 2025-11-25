package com.memzy.controller;

import com.memzy.dto.AlbumDto;
import com.memzy.dto.MediaFileDto;
import com.memzy.model.MediaFile;
import com.memzy.service.AlbumService;
import com.memzy.service.MediaFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {

    @Autowired
    private AlbumService albumService;

    @Autowired
    private MediaFileService mediaFileService;

    @PostMapping
    public ResponseEntity<AlbumDto> createAlbum(@RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            String description = (String) request.get("description");
            Long parentId = request.containsKey("parentId") ? ((Number) request.get("parentId")).longValue() : null;

            AlbumDto album = albumService.createAlbum(name, description, parentId);
            return ResponseEntity.status(HttpStatus.CREATED).body(album);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<AlbumDto>> getUserAlbums() {
        List<AlbumDto> albums = albumService.getUserAlbums();
        return ResponseEntity.ok(albums);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlbumDto> getAlbumById(@PathVariable Long id) {
        try {
            AlbumDto album = albumService.getAlbumById(id);
            return ResponseEntity.ok(album);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlbumDto> updateAlbum(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        try {
            String name = request.get("name");
            String description = request.get("description");

            AlbumDto album = albumService.updateAlbum(id, name, description);
            return ResponseEntity.ok(album);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlbum(@PathVariable Long id) {
        try {
            albumService.deleteAlbum(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{albumId}/media/{mediaId}")
    public ResponseEntity<AlbumDto> addMediaToAlbum(
            @PathVariable Long albumId,
            @PathVariable Long mediaId
    ) {
        try {
            AlbumDto album = albumService.addMediaToAlbum(albumId, mediaId);
            return ResponseEntity.ok(album);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{albumId}/media/{mediaId}")
    public ResponseEntity<AlbumDto> removeMediaFromAlbum(
            @PathVariable Long albumId,
            @PathVariable Long mediaId
    ) {
        try {
            AlbumDto album = albumService.removeMediaFromAlbum(albumId, mediaId);
            return ResponseEntity.ok(album);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{albumId}/media")
    public ResponseEntity<List<MediaFileDto>> getAlbumMedia(@PathVariable Long albumId) {
        try {
            List<MediaFile> mediaFiles = albumService.getAlbumMedia(albumId);
            List<MediaFileDto> mediaDtos = mediaFiles.stream()
                    .map(mediaFileService::convertToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(mediaDtos);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{albumId}/cover/{mediaId}")
    public ResponseEntity<AlbumDto> setAlbumCover(
            @PathVariable Long albumId,
            @PathVariable Long mediaId
    ) {
        try {
            AlbumDto album = albumService.setAlbumCover(albumId, mediaId);
            return ResponseEntity.ok(album);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{albumId}/cover")
    public ResponseEntity<AlbumDto> removeAlbumCover(@PathVariable Long albumId) {
        try {
            AlbumDto album = albumService.removeAlbumCover(albumId);
            return ResponseEntity.ok(album);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
