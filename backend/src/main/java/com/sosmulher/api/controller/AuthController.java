package com.sosmulher.api.controller;

import com.sosmulher.api.dto.LoginRequest;
import com.sosmulher.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.getIdentifier() == null || req.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "E-mail/nome e senha são obrigatórios."));
        }
        try {
            return ResponseEntity.ok(authService.login(req));
        } catch (AuthService.AuthException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/recover")
    public ResponseEntity<?> recover(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "E-mail é obrigatório."));
        }
        var result = authService.recoverAccount(email.trim());
        if (result == null) {
            return ResponseEntity.status(404).body(Map.of("error", "E-mail não encontrado no sistema."));
        }
        return ResponseEntity.ok(result);
    }
}
