package com.memzy.controller;

import com.memzy.dto.CommentDto;
import com.memzy.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentDto> createComment(@RequestBody Map<String, Object> request) {
        try {
            Long mediaFileId = ((Number) request.get("mediaFileId")).longValue();
            String content = (String) request.get("content");

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            CommentDto comment = commentService.createComment(mediaFileId, content);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/media/{mediaFileId}")
    public ResponseEntity<List<CommentDto>> getMediaComments(@PathVariable Long mediaFileId) {
        try {
            List<CommentDto> comments = commentService.getMediaComments(mediaFileId);
            return ResponseEntity.ok(comments);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> request
    ) {
        try {
            String content = request.get("content");

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            CommentDto comment = commentService.updateComment(commentId, content);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
