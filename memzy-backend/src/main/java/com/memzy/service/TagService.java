package com.memzy.service;

import com.memzy.dto.TagDto;
import com.memzy.model.MediaFile;
import com.memzy.model.Tag;
import com.memzy.model.User;
import com.memzy.repository.MediaFileRepository;
import com.memzy.repository.TagRepository;
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
public class TagService {

    private static final Logger logger = LoggerFactory.getLogger(TagService.class);

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Transactional
    public TagDto createTag(String name, String colorCode, String description) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if tag with same name already exists for this user
        tagRepository.findByNameAndCreatedBy(name, user).ifPresent(existing -> {
            throw new RuntimeException("Tag with this name already exists");
        });

        Tag tag = Tag.builder()
                .name(name)
                .colorCode(colorCode)
                .description(description)
                .createdBy(user)
                .usageCount(0L)
                .build();

        tag = tagRepository.save(tag);
        logger.info("Tag created: {} by user: {}", name, username);

        return convertToDto(tag);
    }

    public List<TagDto> getUserTags() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Tag> tags = tagRepository.findByCreatedBy(user);
        return tags.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public TagDto getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        return convertToDto(tag);
    }

    @Transactional
    public TagDto updateTag(Long id, String name, String colorCode, String description) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!tag.getCreatedBy().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to update this tag");
        }

        tag.setName(name);
        tag.setColorCode(colorCode);
        tag.setDescription(description);
        tag = tagRepository.save(tag);

        return convertToDto(tag);
    }

    @Transactional
    public void deleteTag(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!tag.getCreatedBy().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized to delete this tag");
        }

        tagRepository.delete(tag);
        logger.info("Tag deleted: {} by user: {}", tag.getName(), username);
    }

    @Transactional
    public void addTagToMedia(Long mediaId, Long tagId) {
        MediaFile mediaFile = mediaFileRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        mediaFile.getTags().add(tag);
        tag.setUsageCount(tag.getUsageCount() + 1);

        mediaFileRepository.save(mediaFile);
        tagRepository.save(tag);

        logger.info("Tag {} added to media {}", tag.getName(), mediaFile.getFileName());
    }

    @Transactional
    public void removeTagFromMedia(Long mediaId, Long tagId) {
        MediaFile mediaFile = mediaFileRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Media file not found"));

        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        mediaFile.getTags().remove(tag);
        tag.setUsageCount(Math.max(0, tag.getUsageCount() - 1));

        mediaFileRepository.save(mediaFile);
        tagRepository.save(tag);

        logger.info("Tag {} removed from media {}", tag.getName(), mediaFile.getFileName());
    }

    public List<TagDto> searchTags(String query) {
        List<Tag> tags = tagRepository.findByNameContainingIgnoreCase(query);
        return tags.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private TagDto convertToDto(Tag tag) {
        return TagDto.builder()
                .id(tag.getId())
                .name(tag.getName())
                .colorCode(tag.getColorCode())
                .description(tag.getDescription())
                .usageCount(tag.getUsageCount())
                .createdAt(tag.getCreatedAt())
                .build();
    }
}
