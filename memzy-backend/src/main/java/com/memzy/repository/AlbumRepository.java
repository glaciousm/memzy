package com.memzy.repository;

import com.memzy.model.Album;
import com.memzy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {

    List<Album> findByOwner(User owner);

    List<Album> findByOwnerAndParentIsNull(User owner);

    List<Album> findByParent(Album parent);

    Optional<Album> findByShareToken(String shareToken);

    @Query("SELECT a FROM Album a WHERE a.owner = :user OR :user MEMBER OF a.sharedWith")
    List<Album> findAccessibleAlbums(@Param("user") User user);

    @Query("SELECT a FROM Album a WHERE a.isSmartAlbum = true AND a.owner = :owner")
    List<Album> findSmartAlbumsByOwner(@Param("owner") User owner);
}
