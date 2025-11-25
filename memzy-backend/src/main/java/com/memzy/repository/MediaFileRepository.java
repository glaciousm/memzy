package com.memzy.repository;

import com.memzy.model.MediaFile;
import com.memzy.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {

    Page<MediaFile> findByOwnerAndIsDeletedFalse(User owner, Pageable pageable);

    List<MediaFile> findByOwnerAndIsDeletedFalse(User owner);

    Page<MediaFile> findByOwnerAndMediaTypeAndIsDeletedFalse(User owner, MediaFile.MediaType mediaType, Pageable pageable);

    Optional<MediaFile> findByFileHash(String fileHash);

    @Query("SELECT m FROM MediaFile m WHERE m.owner = :owner AND m.isDeleted = false AND m.isFavorite = true")
    Page<MediaFile> findFavoritesByOwner(@Param("owner") User owner, Pageable pageable);

    @Query("SELECT m FROM MediaFile m WHERE m.owner = :owner AND m.isDeleted = true")
    Page<MediaFile> findDeletedByOwner(@Param("owner") User owner, Pageable pageable);

    @Query("SELECT m FROM MediaFile m JOIN m.tags t WHERE t.id IN :tagIds AND m.owner = :owner AND m.isDeleted = false")
    Page<MediaFile> findByOwnerAndTagIds(@Param("owner") User owner, @Param("tagIds") List<Long> tagIds, Pageable pageable);

    @Query("SELECT m FROM MediaFile m WHERE m.owner = :owner AND m.dateTaken BETWEEN :startDate AND :endDate AND m.isDeleted = false")
    Page<MediaFile> findByOwnerAndDateRange(@Param("owner") User owner, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);

    Long countByOwnerAndIsDeletedFalse(User owner);

    Long countByOwnerAndMediaTypeAndIsDeletedFalse(User owner, MediaFile.MediaType mediaType);

    Long countByOwnerAndIsFavoriteTrueAndIsDeletedFalse(User owner);

    Long countByOwnerAndIsDeletedTrue(User owner);

    @Query("SELECT SUM(m.fileSize) FROM MediaFile m WHERE m.owner = :owner AND m.isDeleted = false")
    Long getTotalStorageSizeByOwner(@Param("owner") User owner);

    @Query("SELECT SUM(m.fileSize) FROM MediaFile m WHERE m.owner = :owner AND m.isDeleted = false")
    Long sumFileSizeByOwnerAndIsDeletedFalse(@Param("owner") User owner);

    List<MediaFile> findByOwnerAndMediaTypeAndThumbnailPathIsNullAndIsDeletedFalse(User owner, MediaFile.MediaType mediaType);

    @Query("SELECT m FROM MediaFile m LEFT JOIN FETCH m.tags LEFT JOIN FETCH m.albums WHERE m.id = :id")
    Optional<MediaFile> findByIdWithTagsAndAlbums(@Param("id") Long id);
}
