package com.memzy.repository;

import com.memzy.model.User;
import com.memzy.model.WatchedFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WatchedFolderRepository extends JpaRepository<WatchedFolder, Long> {

    List<WatchedFolder> findByUser(User user);

    List<WatchedFolder> findByUserAndIsActiveTrue(User user);
}
