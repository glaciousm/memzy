package com.memzy.repository;

import com.memzy.model.CloudStorage;
import com.memzy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CloudStorageRepository extends JpaRepository<CloudStorage, Long> {
    List<CloudStorage> findByUserAndIsActiveTrue(User user);
    List<CloudStorage> findByUser(User user);
    Optional<CloudStorage> findByUserAndProvider(User user, String provider);
    List<CloudStorage> findByAutoSyncTrue();
}
