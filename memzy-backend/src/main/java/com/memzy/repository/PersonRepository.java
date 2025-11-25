package com.memzy.repository;

import com.memzy.model.Person;
import com.memzy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {

    List<Person> findByUser(User user);

    Optional<Person> findByUserAndName(User user, String name);

    @Query("SELECT p FROM Person p WHERE p.user.id = :userId ORDER BY p.faceCount DESC")
    List<Person> findByUserIdOrderByFaceCountDesc(@Param("userId") Long userId);

    @Query("SELECT p FROM Person p WHERE p.user.id = :userId AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Person> searchByUserIdAndName(@Param("userId") Long userId, @Param("query") String query);
}
