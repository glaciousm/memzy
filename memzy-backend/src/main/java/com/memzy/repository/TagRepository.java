package com.memzy.repository;

import com.memzy.model.Tag;
import com.memzy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByCreatedBy(User user);

    Optional<Tag> findByNameAndCreatedBy(String name, User user);

    List<Tag> findByNameContainingIgnoreCase(String name);

    @Query(value = "SELECT t.* FROM tags t INNER JOIN media_tags mt ON t.id = mt.tag_id WHERE mt.media_id = :mediaId", nativeQuery = true)
    List<Tag> findTagsByMediaId(@Param("mediaId") Long mediaId);

    @Modifying
    @Query(value = "DELETE FROM media_tags WHERE tag_id = :tagId", nativeQuery = true)
    void deleteMediaTagsByTagId(@Param("tagId") Long tagId);
}
