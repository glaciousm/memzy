package com.memzy.repository;

import com.memzy.model.ShareLink;
import com.memzy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {
    Optional<ShareLink> findByShareToken(String shareToken);

    List<ShareLink> findByCreatedByAndIsActiveTrue(User user);

    List<ShareLink> findByExpiresAtBeforeAndIsActiveTrue(LocalDateTime now);
}
