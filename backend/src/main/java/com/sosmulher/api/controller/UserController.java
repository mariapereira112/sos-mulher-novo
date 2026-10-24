package com.sosmulher.api.controller;

import com.sosmulher.api.dto.CreateUserRequest;
import com.sosmulher.api.dto.UpdateEmailRequest;
import com.sosmulher.api.dto.UpdatePasswordRequest;
import com.sosmulher.api.dto.UpdateUserRequest;
import com.sosmulher.api.entity.User;
import com.sosmulher.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest req) {
        try {
            User user = userService.createUser(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (UserService.GenderRestrictedException e) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "restricted", "redirect", "/acesso-restrito"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUser(@PathVariable Integer userId) {
        User user = userService.getUser(userId);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Integer userId,
                                        @RequestBody UpdateUserRequest req) {
        User user = userService.updateUser(userId, req);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer userId) {
        boolean deleted = userService.deleteUser(userId);
        if (!deleted) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/complete-onboarding")
    public ResponseEntity<?> completeOnboarding(@PathVariable Integer userId) {
        User user = userService.completeOnboarding(userId);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/update-email")
    public ResponseEntity<?> updateEmail(@RequestBody UpdateEmailRequest req) {
        if (req.getUserId() == null || req.getEmail() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId e email são obrigatórios."));
        }
        try {
            User user = userService.updateEmail(req.getUserId(), req.getEmail());
            if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody UpdatePasswordRequest req) {
        if (req.getUserId() == null || req.getCurrentPassword() == null || req.getNewPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "userId, currentPassword e newPassword são obrigatórios."));
        }
        try {
            return ResponseEntity.ok(userService.updatePassword(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }
}
