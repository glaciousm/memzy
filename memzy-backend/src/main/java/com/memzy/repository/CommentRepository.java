package com.memzy.repository;

import com.memzy.model.Comment;
import com.memzy.model.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByMediaFileOrderByCreatedAtDesc(MediaFile mediaFile);

    List<Comment> findByMediaFileIdOrderByCreatedAtDesc(Long mediaFileId);

    Long countByMediaFile(MediaFile mediaFile);
}
