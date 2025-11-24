package com.memzy.repository;

import com.memzy.model.Tag;
import com.memzy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByCreatedBy(User user);

    Optional<Tag> findByNameAndCreatedBy(String name, User user);

    List<Tag> findByNameContainingIgnoreCase(String name);
}
