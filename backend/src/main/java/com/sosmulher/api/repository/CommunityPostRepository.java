package com.sosmulher.api.repository;

import com.sosmulher.api.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Integer> {
    List<CommunityPost> findAllByOrderByCreatedAtDesc();
}
