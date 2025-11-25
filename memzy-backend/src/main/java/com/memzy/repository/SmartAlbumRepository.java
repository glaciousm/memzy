package com.memzy.repository;

import com.memzy.model.SmartAlbum;
import com.memzy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmartAlbumRepository extends JpaRepository<SmartAlbum, Long> {
    List<SmartAlbum> findByOwnerAndIsActiveTrue(User owner);
    List<SmartAlbum> findByOwner(User owner);
}
