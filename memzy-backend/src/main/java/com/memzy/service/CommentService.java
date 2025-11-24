package com.memzy.service;

import com.memzy.dto.CommentDto;
import com.memzy.model.Comment;
import com.memzy.model.MediaFile;
import com.memzy.model.User;
import com.memzy.repository.CommentRepository;
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
public class CommentService {

    private static final Logger logger = LoggerFactory.getLogger(CommentService.class);

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public CommentDto createComment(Long mediaFileId, String content) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MediaFile mediaFile = mediaFileRepository.findById(mediaFileId)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        Comment comment = Comment.builder()
                .mediaFile(mediaFile)
                .user(user)
                .content(content)
                .build();

        comment = commentRepository.save(comment);
        logger.info("Comment created by user: {} on media: {}", username, mediaFileId);

        return convertToDto(comment);
    }

    public List<CommentDto> getMediaComments(Long mediaFileId) {
        List<Comment> comments = commentRepository.findByMediaFileIdOrderByCreatedAtDesc(mediaFileId);
        return comments.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto updateComment(Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!comment.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to update this comment");
        }

        comment.setContent(content);
        comment = commentRepository.save(comment);

        logger.info("Comment updated: {} by user: {}", commentId, username);

        return convertToDto(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!comment.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to delete this comment");
        }

        commentRepository.delete(comment);
        logger.info("Comment deleted: {} by user: {}", commentId, username);
    }

    private CommentDto convertToDto(Comment comment) {
        return CommentDto.builder()
                .id(comment.getId())
                .mediaFileId(comment.getMediaFile().getId())
                .user(CommentDto.UserDto.builder()
                        .id(comment.getUser().getId())
                        .username(comment.getUser().getUsername())
                        .firstName(comment.getUser().getFirstName())
                        .lastName(comment.getUser().getLastName())
                        .avatarUrl(comment.getUser().getAvatarUrl())
                        .build())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
