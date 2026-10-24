package com.sosmulher.api.controller;

import com.sosmulher.api.dto.CreatePostRequest;
import com.sosmulher.api.entity.CommunityPost;
import com.sosmulher.api.repository.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final CommunityPostRepository postRepository;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(postRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreatePostRequest req) {
        if (req.getUserId() == null || req.getContent() == null || req.getContent().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId e content são obrigatórios."));
        }
        CommunityPost post = new CommunityPost();
        post.setUserId(req.getUserId());
        post.setUserName(req.getUserName() != null ? req.getUserName() : "Usuária");
        post.setContent(req.getContent().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(postRepository.save(post));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> delete(@PathVariable Integer postId) {
        if (!postRepository.existsById(postId)) {
            return ResponseEntity.status(404).body(Map.of("error", "Post não encontrado"));
        }
        postRepository.deleteById(postId);
        return ResponseEntity.noContent().build();
    }
}
