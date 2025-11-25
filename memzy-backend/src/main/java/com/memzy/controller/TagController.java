package com.memzy.controller;

import com.memzy.dto.TagDto;
import com.memzy.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    @Autowired
    private TagService tagService;

    @PostMapping
    public ResponseEntity<TagDto> createTag(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String colorCode = request.get("colorCode");
            String description = request.get("description");

            TagDto tag = tagService.createTag(name, colorCode, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(tag);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<TagDto>> getUserTags() {
        List<TagDto> tags = tagService.getUserTags();
        return ResponseEntity.ok(tags);
    }

    @GetMapping("/search")
    public ResponseEntity<List<TagDto>> searchTags(@RequestParam String query) {
        List<TagDto> tags = tagService.searchTags(query);
        return ResponseEntity.ok(tags);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TagDto> getTagById(@PathVariable Long id) {
        try {
            TagDto tag = tagService.getTagById(id);
            return ResponseEntity.ok(tag);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagDto> updateTag(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        try {
            String name = request.get("name");
            String colorCode = request.get("colorCode");
            String description = request.get("description");

            TagDto tag = tagService.updateTag(id, name, colorCode, description);
            return ResponseEntity.ok(tag);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        try {
            tagService.deleteTag(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping("/media/{mediaId}")
    public ResponseEntity<List<TagDto>> getTagsForMedia(@PathVariable Long mediaId) {
        try {
            List<TagDto> tags = tagService.getTagsForMedia(mediaId);
            return ResponseEntity.ok(tags);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/media/{mediaId}/tags/{tagId}")
    public ResponseEntity<Void> addTagToMedia(
            @PathVariable Long mediaId,
            @PathVariable Long tagId
    ) {
        try {
            tagService.addTagToMedia(mediaId, tagId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/media/{mediaId}/tags/{tagId}")
    public ResponseEntity<Void> removeTagFromMedia(
            @PathVariable Long mediaId,
            @PathVariable Long tagId
    ) {
        try {
            tagService.removeTagFromMedia(mediaId, tagId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
