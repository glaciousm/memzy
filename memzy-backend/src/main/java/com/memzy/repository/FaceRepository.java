package com.memzy.repository;

import com.memzy.model.Face;
import com.memzy.model.MediaFile;
import com.memzy.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaceRepository extends JpaRepository<Face, Long> {

    List<Face> findByMediaFile(MediaFile mediaFile);

    List<Face> findByPerson(Person person);

    List<Face> findByPersonIsNull();

    @Query("SELECT f FROM Face f WHERE f.mediaFile.owner.id = :userId")
    List<Face> findByUserId(@Param("userId") Long userId);

    @Query("SELECT f FROM Face f WHERE f.mediaFile.id = :mediaFileId")
    List<Face> findByMediaFileId(@Param("mediaFileId") Long mediaFileId);

    @Query("SELECT COUNT(f) FROM Face f WHERE f.person.id = :personId")
    Long countByPersonId(@Param("personId") Long personId);

    @Query("SELECT f FROM Face f WHERE f.person IS NULL AND f.mediaFile.owner.id = :userId")
    List<Face> findUnassignedByUserId(@Param("userId") Long userId);
}
